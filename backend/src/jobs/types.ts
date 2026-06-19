// Job catalogue for the async layer. These names fall out of the pipeline
// diagram: text extraction → embedding → signal extraction → recommendation
// generation → email delivery. One queue, dispatched by job name.

export const JOB = {
  extractText: 'extractText',
  embedDocument: 'embedDocument',
  extractSignals: 'extractSignals',
  generateRecommendations: 'generateRecommendations',
  sendEmail: 'sendEmail',
  weeklyDigest: 'weeklyDigest',
} as const;

export type JobName = (typeof JOB)[keyof typeof JOB];

// Typed payload per job — keeps enqueue() call-sites honest.
export interface JobPayloads {
  extractText: { documentId: string };
  embedDocument: { documentId: string };
  extractSignals: { userId: string; documentId?: string };
  generateRecommendations: { userId: string };
  // Digest send: the handler re-fetches the recs by id (so it only sends/marks
  // ones still PENDING — shared frequency cap across channels).
  sendEmail: {
    to: string;
    subject: string;
    template: 'weekly_digest';
    userId: string;
    recIds: string[];
    firstName?: string | null;
  };
  // Repeatable: fan out digest emails to all consented users with pending recs.
  weeklyDigest: Record<string, never>;
}
