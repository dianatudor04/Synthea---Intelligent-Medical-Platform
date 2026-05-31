import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  File,
  Loader2,
  X,
} from 'lucide-react';
import { uploadsApi, UploadProgress } from '../../../lib/services';
import { PatientUpload, UploadCategory } from '../../../lib/types';
import { ApiRequestError } from '../../../lib/api';

const CATEGORY_OPTIONS: { value: UploadCategory; label: string }[] = [
  { value: 'lab', label: 'Lab results' },
  { value: 'imaging', label: 'Imaging / X-ray' },
  { value: 'prescription', label: 'Prescription' },
  { value: 'other', label: 'Other' },
];

const mockSharedFiles = [
  { id: 's1', name: 'Blood Test Results', type: 'PDF', size: '1.2 MB', uploadedAt: 'April 5, 2026' },
  { id: 's2', name: 'X-Ray Chest', type: 'Image', size: '3.4 MB', uploadedAt: 'March 28, 2026' },
];

type InFlightUpload = {
  tempId: string;
  fileName: string;
  sizeBytes: number;
  percent: number;
  category?: UploadCategory;
  abort: () => void;
};

function formatSize(bytes: number | null): string {
  if (bytes === null || bytes === undefined) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function shortType(mime: string | null): string {
  if (!mime) return 'File';
  if (mime === 'application/pdf') return 'PDF';
  if (mime.startsWith('image/')) return 'Image';
  if (mime.startsWith('text/')) return 'Text';
  return mime.split('/')[1]?.toUpperCase() ?? 'File';
}

export function MedicalFilesSection() {
  const [uploads, setUploads] = useState<PatientUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inFlight, setInFlight] = useState<InFlightUpload[]>([]);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingCategory, setPendingCategory] = useState<UploadCategory | ''>('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const data = await uploadsApi.list();
      setUploads(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load uploads');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const startUpload = useCallback(
    (file: File, category?: UploadCategory) => {
      const tempId = `tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const controller = new AbortController();

      setInFlight((cur) => [
        ...cur,
        {
          tempId,
          fileName: file.name,
          sizeBytes: file.size,
          percent: 0,
          category,
          abort: () => controller.abort(),
        },
      ]);

      uploadsApi
        .upload({
          file,
          category,
          signal: controller.signal,
          onProgress: (p: UploadProgress) => {
            setInFlight((cur) =>
              cur.map((u) => (u.tempId === tempId ? { ...u, percent: p.percent } : u)),
            );
          },
        })
        .then((created) => {
          setInFlight((cur) => cur.filter((u) => u.tempId !== tempId));
          setUploads((cur) => [created, ...cur]);
        })
        .catch((err) => {
          setInFlight((cur) => cur.filter((u) => u.tempId !== tempId));
          const msg =
            err instanceof ApiRequestError ? err.message : 'Upload failed';
          setError(msg);
        });
    },
    [],
  );

  const handlePickFile = (file: File | null) => {
    if (!file) return;
    setPendingFile(file);
    setPendingCategory('');
  };

  const confirmUpload = () => {
    if (!pendingFile) return;
    startUpload(pendingFile, (pendingCategory || undefined) as UploadCategory | undefined);
    setPendingFile(null);
    setPendingCategory('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const cancelPending = () => {
    setPendingFile(null);
    setPendingCategory('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleView = async (id: string) => {
    try {
      const { url } = await uploadsApi.downloadUrl(id, true);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open file');
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const { url } = await uploadsApi.downloadUrl(id, false);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not download file');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this file? This action cannot be undone.')) return;
    try {
      await uploadsApi.remove(id);
      setUploads((cur) => cur.filter((u) => u.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handlePickFile(file);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Medical Files</h3>

        {/* Shared with Doctor — still mocked, separate feature */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">Shared with Doctor</h4>
            <FileText className="w-5 h-5 text-[#3A7BD5]" />
          </div>
          <div className="space-y-3">
            {mockSharedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#E6F0FA] to-[#E8F5E9] rounded-lg flex items-center justify-center">
                    <File className="w-5 h-5 text-[#3A7BD5]" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {file.type} • {file.size} • {file.uploadedAt}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Eye className="w-4 h-4 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Download className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Personal Uploads — wired to /api/uploads */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">Personal Uploads</h4>
            <Upload className="w-5 h-5 text-[#4CAF50]" />
          </div>

          {error && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="space-y-3">
            {/* In-flight uploads */}
            {inFlight.map((u) => (
              <div
                key={u.tempId}
                className="flex items-center justify-between p-3 rounded-xl bg-blue-50/50 border border-blue-100"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#E6F0FA] to-[#E8F5E9] rounded-lg flex items-center justify-center shrink-0">
                    <Loader2 className="w-5 h-5 text-[#3A7BD5] animate-spin" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{u.fileName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#3A7BD5] transition-all"
                          style={{ width: `${u.percent}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 tabular-nums">{u.percent}%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatSize(Math.round((u.sizeBytes * u.percent) / 100))} / {formatSize(u.sizeBytes)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={u.abort}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Cancel upload"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            ))}

            {/* Existing uploads */}
            {loading && (
              <div className="text-center py-4 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                Loading your files…
              </div>
            )}

            {!loading && uploads.length === 0 && inFlight.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-2">
                No files yet — upload your first one below.
              </p>
            )}

            {uploads.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#E6F0FA] to-[#E8F5E9] rounded-lg flex items-center justify-center shrink-0">
                    <File className="w-5 h-5 text-[#4CAF50]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {file.fileName ?? 'Untitled'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {shortType(file.mimeType)} • {formatSize(file.sizeBytes)} • {formatDate(file.uploadedAt)}
                      {file.category ? ` • ${file.category}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleView(file.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="View"
                  >
                    <Eye className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDownload(file.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))}

            {/* Pending category selection modal-ish row */}
            {pendingFile && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{pendingFile.name}</p>
                    <p className="text-xs text-gray-500">{formatSize(pendingFile.size)}</p>
                  </div>
                  <button
                    onClick={cancelPending}
                    className="p-1 hover:bg-amber-100 rounded"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    Category (optional)
                  </label>
                  <select
                    value={pendingCategory}
                    onChange={(e) => setPendingCategory(e.target.value as UploadCategory | '')}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
                  >
                    <option value="">— None —</option>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={cancelPending}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmUpload}
                    className="px-3 py-1.5 text-sm rounded-lg bg-[#3A7BD5] text-white hover:bg-[#2f6abc]"
                  >
                    Upload
                  </button>
                </div>
              </div>
            )}

            {/* Drop zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                dragOver
                  ? 'border-[#3A7BD5] bg-[#E6F0FA]/50'
                  : 'border-gray-200 hover:border-[#3A7BD5] hover:bg-[#E6F0FA]/30'
              }`}
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600 mb-1">Upload New File</p>
              <p className="text-xs text-gray-500">Drag and drop or click to browse (up to 1 GB)</p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => handlePickFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
