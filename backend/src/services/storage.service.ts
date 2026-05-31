import { Readable } from 'stream';
import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env';
import { logger } from '../config/logger';

// Internal client: talks to RustFS over the docker network (rustfs:9000).
const internalClient = new S3Client({
  region: env.RUSTFS_REGION,
  endpoint: env.RUSTFS_ENDPOINT,
  credentials: {
    accessKeyId: env.RUSTFS_ACCESS_KEY,
    secretAccessKey: env.RUSTFS_SECRET_KEY,
  },
  forcePathStyle: true,
});

// Public client: used only to mint presigned URLs the browser will hit
// (must use a host-reachable hostname, e.g. localhost:9000, not the docker DNS name).
const publicClient = env.RUSTFS_PUBLIC_ENDPOINT && env.RUSTFS_PUBLIC_ENDPOINT !== env.RUSTFS_ENDPOINT
  ? new S3Client({
      region: env.RUSTFS_REGION,
      endpoint: env.RUSTFS_PUBLIC_ENDPOINT,
      credentials: {
        accessKeyId: env.RUSTFS_ACCESS_KEY,
        secretAccessKey: env.RUSTFS_SECRET_KEY,
      },
      forcePathStyle: true,
    })
  : internalClient;

export const BUCKET = env.RUSTFS_BUCKET;

/**
 * Create the bucket if it doesn't exist. Called once at server startup.
 */
export async function ensureBucket(): Promise<void> {
  try {
    await internalClient.send(new HeadBucketCommand({ Bucket: BUCKET }));
    logger.info(`RustFS bucket ready: ${BUCKET}`);
  } catch (err) {
    const status = (err as S3ServiceException).$metadata?.httpStatusCode;
    if (status === 404 || status === 301) {
      try {
        await internalClient.send(new CreateBucketCommand({ Bucket: BUCKET }));
        logger.info(`RustFS bucket created: ${BUCKET}`);
      } catch (createErr) {
        logger.error('Failed to create RustFS bucket', { error: createErr });
        throw createErr;
      }
    } else {
      logger.error('Failed to check RustFS bucket', { error: err });
      throw err;
    }
  }
}

/**
 * Stream-upload a file to RustFS using multipart under the hood.
 * Suitable for very large files (1GB) since nothing is buffered in memory.
 */
export async function uploadStream(opts: {
  key: string;
  body: Readable;
  mimeType: string;
}): Promise<void> {
  const upload = new Upload({
    client: internalClient,
    params: {
      Bucket: BUCKET,
      Key: opts.key,
      Body: opts.body,
      ContentType: opts.mimeType,
    },
    queueSize: 4,
    partSize: 8 * 1024 * 1024, // 8MB parts
  });
  await upload.done();
}

/**
 * Mint a short-lived presigned GET URL for download / inline view.
 */
export async function presignDownload(opts: {
  key: string;
  fileName?: string | null;
  inline?: boolean;
  ttlSeconds?: number;
}): Promise<string> {
  const disposition = opts.inline
    ? `inline${opts.fileName ? `; filename="${sanitizeFilename(opts.fileName)}"` : ''}`
    : `attachment${opts.fileName ? `; filename="${sanitizeFilename(opts.fileName)}"` : ''}`;

  const cmd = new GetObjectCommand({
    Bucket: BUCKET,
    Key: opts.key,
    ResponseContentDisposition: disposition,
  });
  return getSignedUrl(publicClient, cmd, {
    expiresIn: opts.ttlSeconds ?? env.PRESIGNED_URL_TTL_SECONDS,
  });
}

/**
 * Download an object from RustFS into a Buffer. Used by the OCR pipeline.
 */
export async function getObjectBuffer(key: string): Promise<Buffer> {
  const out = await internalClient.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const body = out.Body as Readable | undefined;
  if (!body) throw new Error(`Empty body for object ${key}`);
  const chunks: Buffer[] = [];
  for await (const chunk of body) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/**
 * Delete an object from RustFS. Safe to call even if the object doesn't exist.
 */
export async function deleteObject(key: string): Promise<void> {
  try {
    await internalClient.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch (err) {
    logger.warn(`Failed to delete RustFS object ${key}`, { error: err });
  }
}

function sanitizeFilename(name: string): string {
  // strip quotes & control chars; collapse path separators
  return name.replace(/[\r\n"\\]/g, '_').replace(/[/\\]/g, '_');
}
