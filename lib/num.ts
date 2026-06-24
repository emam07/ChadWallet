/** Coerce an unknown value (often a numeric string from a REST API) to a
 *  finite number, falling back to `fallback` for null/NaN/Infinity. */
export function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
