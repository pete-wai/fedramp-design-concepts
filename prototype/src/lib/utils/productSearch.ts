// $lib/utils/productSearch.ts
//
// Prioritized marketplace product search.
//
// The search is evaluated across four tiers, each of which walks a fixed list
// of product fields in priority order:
//   1. FedRAMP ID (`id`)
//   2. CSO name (`cso`)
//   3. CSP name (`csp`)
//   4. Service description (`service_desc`)
//
// Tiers, in order of precedence:
//   1. Exact match — field value equals the term (case-insensitive).
//   2. Word match  — the term appears as a standalone word in the field
//                    (e.g. "AI" matches "Generative AI" but not "maintenance").
//   3. Contains    — field value includes the term as a substring
//                    (prefix/suffix/infix, e.g. "tester", "atest", "testing"
//                    all match "test").
//   4. Fuzzy       — Fuse.js approximate match.
//
// Exact ranks above word, which ranks above contains. The exact and word tiers
// stop at the first field that yields any match. The contains tier returns ALL
// matching items, ordered by field priority (cso before service_desc, etc.).
// Already-matched items are never repeated in a lower tier. If none of those
// three tiers produce results, we fall back to a fuzzy search evaluated in the
// same field order, returning the first field tier that matches.
import Fuse from 'fuse.js';

/**
 * Fields searched, in priority order, for every search tier. Each entry maps to
 * the underlying product key(s) searched in that tier.
 */
export const SEARCH_TIERS: readonly (readonly string[])[] = [
  ['id'], // 1. FedRAMP ID
  ['cso'], // 2. CSO name
  ['csp'], // 3. CSP name
  ['service_desc'] // 4. Service description
];

/**
 * Read a product field as a lowercased, trimmed string for comparison.
 * Returns an empty string when the field is missing or non-string.
 */
export function fieldAsString<T>(product: T, field: string): string {
  const value = (product as Record<string, unknown>)[field];
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

/**
 * Build a case-insensitive whole-word matcher for the given term.
 *
 * Matches the term only when it appears as a standalone word — bounded by
 * non-alphanumeric characters or the string ends — so "AI" matches
 * "Generative AI" but not "maintenance". The term is regex-escaped to stay
 * literal. The term is expected to already be normalized (trimmed/lowercased).
 */
export function makeWordBoundaryMatcher(term: string): (value: string) => boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const wordRegex = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, 'i');
  return (value: string) => wordRegex.test(value);
}

/**
 * Prioritized product search. See module header for the full tier description.
 *
 * @param items   Products to search.
 * @param rawTerm Raw user search term (will be trimmed and lowercased).
 * @returns       Matching products ordered exact -> word -> contains, or the
 *                first non-empty fuzzy tier, or `items` when the term is empty.
 */
export function prioritizedProductSearch<T>(items: T[], rawTerm: string): T[] {
  const term = rawTerm.trim().toLowerCase();
  if (!term) return items;

  const matched = new Set<T>();

  // Walk the field tiers and return the first tier's matches for the given
  // predicate, skipping items already claimed by a higher tier. Used by the
  // exact and word tiers, which stop at the first matching field.
  const collectFirstTier = (predicate: (value: string) => boolean): T[] => {
    for (const keys of SEARCH_TIERS) {
      const hits = items.filter((p) => !matched.has(p) && keys.some((field) => predicate(fieldAsString(p, field))));
      if (hits.length > 0) {
        hits.forEach((p) => matched.add(p));
        return hits;
      }
    }
    return [];
  };

  // Walk every field tier and gather all matches for the given predicate,
  // ordered by field priority (cso before service_desc, etc.). Items already
  // claimed by a higher tier — or a higher-priority field within this pass —
  // are not repeated.
  const collectAllTiers = (predicate: (value: string) => boolean): T[] => {
    const collected: T[] = [];
    for (const keys of SEARCH_TIERS) {
      for (const p of items) {
        if (matched.has(p)) continue;
        if (keys.some((field) => predicate(fieldAsString(p, field)))) {
          matched.add(p);
          collected.push(p);
        }
      }
    }
    return collected;
  };

  // 1) Exact-match tier — field value equals the term.
  const exactMatches = collectFirstTier((value) => value === term);

  // 2) Word-boundary tier — term appears as a standalone word.
  const isWordMatch = makeWordBoundaryMatcher(term);
  const wordMatches = collectFirstTier((value) => isWordMatch(value));

  // 3) Contains tier — term appears anywhere as a substring. All matching items
  //    are returned, ordered by field priority.
  const containsMatches = collectAllTiers((value) => value.includes(term));

  if (exactMatches.length > 0 || wordMatches.length > 0 || containsMatches.length > 0) {
    return [...exactMatches, ...wordMatches, ...containsMatches];
  }

  // 4) Fuzzy fallback — first field tier that produces matches.
  for (const keys of SEARCH_TIERS) {
    const fuse = new Fuse(items, {
      keys: keys as string[],
      threshold: 0.3,
      ignoreLocation: true,
      minMatchCharLength: 2,
      includeScore: true
    });
    const results = fuse.search(term);
    if (results.length > 0) {
      return results.map((r) => r.item);
    }
  }

  return [];
}

/**
 * Whether the term has an exact (tier 1) or whole-word (tier 2) match in any of
 * the prioritized fields of at least one item. Used to decide whether to tell
 * the user "Could not find exact match for ___. Showing relevant results." —
 * contains/infix and fuzzy matches do NOT count as an exact match here.
 *
 * @param items   Products to search.
 * @param rawTerm Raw user search term (will be trimmed and lowercased).
 * @returns       `true` when at least one item exactly equals or contains the
 *                term as a standalone word; `false` otherwise. An empty term
 *                returns `false`.
 */
export function hasExactOrWordMatch<T>(items: T[], rawTerm: string): boolean {
  const term = rawTerm.trim().toLowerCase();
  if (!term) return false;

  const isWordMatch = makeWordBoundaryMatcher(term);
  const fields = SEARCH_TIERS.flat();

  return items.some((p) =>
    fields.some((field) => {
      const value = fieldAsString(p, field);
      return value === term || isWordMatch(value);
    })
  );
}
