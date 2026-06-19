// Token-aware-ish text chunking. We approximate tokens by characters
// (~4 chars/token for Latin scripts), so ~2000 chars ≈ ~500 tokens, with a
// 200-char overlap so context isn't lost across a boundary. Good enough for a
// thesis-scale RAG store without pulling in a tokenizer dependency.
const TARGET_CHARS = 2000;
const OVERLAP_CHARS = 200;

/**
 * Split extracted document text into overlapping chunks, preferring to break on
 * a natural boundary (newline / sentence / space) near the target size.
 */
export function chunkText(input: string): string[] {
  const text = input.trim();
  if (!text) return [];
  if (text.length <= TARGET_CHARS) return [text];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + TARGET_CHARS, text.length);

    if (end < text.length) {
      const slice = text.slice(start, end);
      // Prefer a paragraph break, then sentence end, then a space — but only if
      // it's past the halfway mark so chunks don't end up tiny.
      const candidates = [slice.lastIndexOf('\n'), slice.lastIndexOf('. '), slice.lastIndexOf(' ')];
      const breakAt = Math.max(...candidates);
      if (breakAt > TARGET_CHARS * 0.5) end = start + breakAt + 1;
    }

    const chunk = text.slice(start, end).trim();
    if (chunk) chunks.push(chunk);

    if (end >= text.length) break;
    start = Math.max(end - OVERLAP_CHARS, start + 1);
  }

  return chunks;
}
