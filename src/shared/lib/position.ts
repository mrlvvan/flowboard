/**
 * Fractional indexing for drag-and-drop position ordering.
 * Positions are lexicographically sortable strings.
 */

const MIN = "a";
const MAX = "z";
const MID_CHAR = "n";

function midString(prev: string, next: string): string {
  let p = prev;
  let n = next;

  // Pad to same length
  while (p.length < n.length) p += MIN;
  while (n.length < p.length) n += MAX;

  let result = "";
  for (let i = 0; i < p.length; i++) {
    const pCode = p.charCodeAt(i);
    const nCode = n.charCodeAt(i);
    if (nCode - pCode > 1) {
      result += String.fromCharCode(Math.floor((pCode + nCode) / 2));
      return result + p.slice(i + 1);
    }
    result += p[i];
  }
  // Need to go deeper
  return p + MID_CHAR;
}

export function positionBetween(prev: string | undefined, next: string | undefined): string {
  if (!prev && !next) return MID_CHAR;
  if (!prev) return midString(MIN, next!);
  if (!next) return midString(prev, MAX + MAX);
  return midString(prev, next);
}

export function initialPosition(index: number): string {
  return MID_CHAR.repeat(index + 1);
}
