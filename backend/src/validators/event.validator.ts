import { z } from 'zod';

// Closed set of event types the client may emit. Anything else is rejected so
// the events table stays a known, queryable shape.
export const EVENT_TYPES = [
  'route_change',
  'blog_open',
  'blog_scroll_depth',
  'blog_dwell',
  'chat_message',
] as const;

const eventSchema = z.object({
  type: z.enum(EVENT_TYPES),
  payload: z.record(z.unknown()).optional(),
  sessionId: z.string().max(64).optional(),
  ts: z.number().int().positive().optional(), // client timestamp (ms since epoch)
});

export const eventBatchSchema = z.object({
  events: z.array(eventSchema).min(1).max(100),
});

export type IncomingEvent = z.infer<typeof eventSchema>;
