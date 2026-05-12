/** Normaliza una cadena: lowercase + sin acentos. Para búsqueda Unicode-friendly. */
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/** True si `haystack` contiene `needle` (ambos normalizados). */
export function matches(haystack: string, needle: string): boolean {
  if (!needle.trim()) return true;
  return normalize(haystack).includes(normalize(needle));
}
