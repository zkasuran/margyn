/**
 * Shell quoting, in one place, because proof mode executes commands that are
 * built from values found in the repository (file paths, script names). A value
 * is wrapped so it stays one argument no matter what it contains: the only way
 * out of a single-quoted string in sh is to close it, and the escape turns every
 * embedded quote into a closed-quote, an escaped quote, then a reopened quote.
 */
export function shq(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`;
}
