const TR_FOLD: Record<string, string> = {
  ç: 'c',
  ğ: 'g',
  ı: 'i',
  ö: 'o',
  ş: 's',
  ü: 'u',
  â: 'a',
  î: 'i',
  û: 'u',
};

/**
 * Turkish-aware, accent-insensitive folding for search:
 * "İSTANBUL", "istanbul" and "Istanbul" all become "istanbul";
 * "Gümrük" and "gumruk" match; "Hakkâri" equals "hakkari".
 */
export function foldTr(input: string): string {
  return input
    .toLocaleLowerCase('tr-TR')
    .replace(/[çğıöşüâîû]/g, (ch) => TR_FOLD[ch] ?? ch)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’'`´]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Splits a query into folded tokens (empty tokens removed). */
export function tokenize(query: string): string[] {
  return foldTr(query)
    .split(/[\s,;]+/)
    .filter((t) => t.length > 0);
}

/**
 * True when every query token appears somewhere in the (folded) haystack.
 *
 * Tokens of 5+ letters also match without their last letter, a cheap way to survive
 * Turkish consonant softening and suffixes ("yönetmelik" → "yönetmeliği", "kitap" → "kitabı").
 */
export function matchesAllTokens(haystack: string, tokens: readonly string[]): boolean {
  if (tokens.length === 0) return true;
  const folded = foldTr(haystack);
  return tokens.every((t) => folded.includes(t) || (t.length >= 5 && folded.includes(t.slice(0, -1))));
}
