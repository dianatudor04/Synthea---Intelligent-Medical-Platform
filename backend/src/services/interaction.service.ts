import { prisma } from '../config/database';

export type InteractionLevel = 'Major' | 'Moderate' | 'Minor' | 'Unknown';

export interface InteractionResult {
  drugA: string;
  drugB: string;
  level: InteractionLevel;
}

const SEVERITY: Record<string, number> = { Major: 3, Moderate: 2, Minor: 1, Unknown: 0 };

/**
 * Given a list of drug names, return every known pairwise interaction among
 * them. Matching is case-insensitive and order-independent. Results are sorted
 * most-severe first.
 */
export async function checkInteractions(drugNames: string[]): Promise<InteractionResult[]> {
  const keys = [...new Set(drugNames.map((d) => d.trim().toLowerCase()).filter(Boolean))];
  if (keys.length < 2) return [];

  // Any interacting pair within the selection has both of its keys in `keys`.
  const rows = await prisma.drugInteraction.findMany({
    where: { keyA: { in: keys }, keyB: { in: keys } },
    select: { drugA: true, drugB: true, level: true },
  });

  return rows
    .map((r) => ({ drugA: r.drugA, drugB: r.drugB, level: r.level as InteractionLevel }))
    .sort((a, b) => (SEVERITY[b.level] ?? 0) - (SEVERITY[a.level] ?? 0));
}

/** Autocomplete: drug names matching `search`, capped at `limit`. */
export async function searchDrugs(search: string, limit = 10): Promise<string[]> {
  const q = search.trim();
  if (!q) return [];
  const rows = await prisma.drug.findMany({
    where: { name: { contains: q, mode: 'insensitive' } },
    orderBy: { name: 'asc' },
    take: Math.min(Math.max(limit, 1), 25),
    select: { name: true },
  });
  return rows.map((r) => r.name);
}
