/**
 * A deterministic reference for anything a visitor prepares on this site.
 *
 * FNV-1a over the request's own content, so the same request yields the same id
 * and a person can quote it back at us. Shared by the fix intake and the
 * suggestion box rather than copied into both: two hashes that agree on the day
 * they are written and disagree by the third release is the drift this tool
 * reports about other people's repositories.
 */
export function reference(prefix, input) {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return `${prefix}-${(h >>> 0).toString(36).toUpperCase().padStart(6, "0")}`;
}
