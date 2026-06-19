// ─────────────────────────────────────────────────────────────────────
//  Client-side activity tracker.
//  Batches events in memory and flushes them to POST /api/events:
//   - periodically (timer) and when the queue fills, via keepalive fetch
//   - on page hide / unload, via navigator.sendBeacon (survives navigation)
//  Completely inert unless analytics consent has been granted
//  (setTrackingEnabled(true)); nothing is collected before opt-in.
// ─────────────────────────────────────────────────────────────────────
import { apiBaseUrl, tokenStorage } from './api';

export type TrackableEvent = {
  type: 'route_change' | 'blog_open' | 'blog_scroll_depth' | 'blog_dwell' | 'chat_message';
  payload?: Record<string, unknown>;
};

type QueuedEvent = TrackableEvent & { sessionId: string; ts: number };

const FLUSH_INTERVAL_MS = 15_000;
const MAX_QUEUE = 25;
const SESSION_KEY = 'synthea_event_session';

let queue: QueuedEvent[] = [];
let enabled = false;
let timer: ReturnType<typeof setInterval> | null = null;

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/** Enable/disable collection. Driven by the user's analytics consent flag. */
export function setTrackingEnabled(on: boolean): void {
  if (on === enabled) return;
  enabled = on;
  if (on) {
    if (!timer) timer = setInterval(() => flush(false), FLUSH_INTERVAL_MS);
  } else {
    queue = [];
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }
}

/** Queue an event. No-op unless tracking is enabled. */
export function trackEvent(type: TrackableEvent['type'], payload?: Record<string, unknown>): void {
  if (!enabled) return;
  queue.push({ type, payload, sessionId: getSessionId(), ts: Date.now() });
  if (queue.length >= MAX_QUEUE) flush(false);
}

function flush(useBeacon: boolean): void {
  if (!queue.length) return;
  const token = tokenStorage.getAccessToken();
  if (!token) {
    queue = [];
    return;
  }

  const events = queue;
  queue = [];
  const url = `${apiBaseUrl}/events`;

  // On unload, sendBeacon is the only reliable channel. It cannot set headers
  // and must use a CORS-safe content type, so the token rides in the body as
  // text/plain (the backend authenticates from the body in that case).
  if (useBeacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify({ token, events })], { type: 'text/plain' });
    const ok = navigator.sendBeacon(url, blob);
    if (!ok) queue = events.concat(queue); // requeue on failure
    return;
  }

  // While the page is alive: keepalive fetch carries the auth header and
  // survives an in-flight navigation.
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ events }),
    keepalive: true,
  }).catch(() => {
    /* best-effort telemetry — drop on failure */
  });
}

// Final flush when the tab is backgrounded or closed.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush(true);
  });
  window.addEventListener('pagehide', () => flush(true));
}
