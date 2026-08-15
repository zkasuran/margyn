/**
 * The shared half of the two forms on this site: the fix intake and the
 * suggestion box. Both take text from a stranger and turn it into a link, so both
 * need the same three things done correctly. Doing them twice is how one of the
 * two ends up wrong.
 *
 * Every function here exists because the naive version has a real failure mode:
 *
 *   clip    slicing by UTF-16 code unit can cut a surrogate pair in half, then
 *           encodeURIComponent throws URIError on the lone half. 79 characters
 *           followed by an emoji was enough to take the whole request to a 500.
 *   oneLine a newline in a value that lands on its own line in the prepared issue
 *           lets the sender forge the lines around it.
 *   fitUrl  a body capped before percent encoding says nothing about the length of
 *           the URL it produces. Measured: a 6000 character body of CJK text
 *           produced a 52,274 character URL. GitHub answers a long URL with 414
 *           URI Too Long.
 */

/** FNV-1a over the request's own content, so the same request yields the same id.
 *
 * Deterministic rather than unique: it is 32 bits, so two different requests can
 * collide. One was found in about a second of searching. That is fine for what it
 * is for, which is spotting the same suggestion arriving twice. It is not an
 * identifier to look anything up by. */
export function reference(prefix, input) {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return `${prefix}-${(h >>> 0).toString(36).toUpperCase().padStart(6, "0")}`;
}

/** Truncates by code point, so an emoji is kept or dropped whole. */
export const clip = (text, max) => [...String(text)].slice(0, max).join("");

/** Flattens whitespace, so one field cannot become two lines of the issue. */
export const oneLine = (text) => String(text).replace(/\s+/g, " ").trim();

/**
 * Builds a URL from a body and shortens the body until the URL fits.
 *
 * `build` takes the body and returns the whole URL, so the caller keeps the shape
 * of its own link. Returns the URL plus whether anything was dropped, because a
 * sender whose text was trimmed has to be told rather than left to notice.
 */
export function fitUrl(body, build, cap = 6000) {
  let text = body;
  let url = build(text);
  let trimmed = false;
  while (url.length > cap && text.length > 200) {
    text = `${clip(text, Math.floor([...text].length * 0.8))}\n\n(trimmed to fit the link, paste the rest)`;
    url = build(text);
    trimmed = true;
  }
  return { url, trimmed };
}

/** A repository is `owner/name` and it is never read from a request. */
export function repoPath(repo) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error(`not a repository path: ${repo}`);
  return repo;
}
