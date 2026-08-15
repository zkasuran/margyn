/**
 * The shared reader for test files.
 *
 * Two checks look at the same thing (no-assertion and cannot-fail), so they read
 * it through one parser rather than two. A second copy of the span scanner is the
 * drift this tool reports about other people's repositories: the two would agree
 * on the day they were written and disagree by the third release.
 */
import { execFileSync } from "node:child_process";

export const TEST_FILE = /\.(test|spec)\.[mc]?[jt]sx?$/;

/** Test files git actually has. An untracked one is a different check's problem. */
export function trackedTests(root) {
  try {
    return execFileSync("git", ["ls-files"], {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .split("\n")
      .filter((f) => TEST_FILE.test(f));
  } catch {
    return [];
  }
}

/**
 * Returns the whole balanced-paren span of each `it(...)` / `test(...)` call.
 *
 * Deliberately not trying to find the callback body: `it("x", {timeout: 1}, fn)`
 * puts an options object where the body looks like it should be, and reading
 * that object instead of the body reports every timed test as assertionless.
 * Searching the entire call span cannot make that mistake.
 *
 * Pass the blanked source as `source` and the original as `raw`. Scanning the
 * blanked copy is what stops a test-shaped string from being read as a test: this
 * repository's own CLI test writes `test("hollow", () => ...)` into a fixture as a
 * string, and matching the raw text reported our own suite. The title is read
 * back out of `raw` at the same offset, because blanking preserves length.
 */
export function testCalls(source, raw = source) {
  const calls = [];
  const opener = /\b(?:it|test)\s*(?:\.\w+)?\s*\(\s*(['"`])(.*?)\1\s*,/g;
  for (let m = opener.exec(source); m; m = opener.exec(source)) {
    const open = source.indexOf("(", m.index);
    if (open === -1) continue;
    let depth = 0;
    let end = open;
    for (; end < source.length; end += 1) {
      const c = source[end];
      if (c === "(") depth += 1;
      else if (c === ")") {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    const quoteAt = m.index + m[0].indexOf(m[1]);
    calls.push({
      name: raw.slice(quoteAt + 1, quoteAt + 1 + m[2].length),
      span: source.slice(open, end + 1),
      start: open,
      line: source.slice(0, m.index).split("\n").length,
      endLine: source.slice(0, end + 1).split("\n").length,
    });
    opener.lastIndex = end;
  }
  return calls;
}

/**
 * A `/` starts a regular expression when what came before it cannot end an
 * expression. This is the standard heuristic, and it is needed rather than
 * optional: `matchAll(/href="(\/[^"#]*)/g)` carries a double quote, so a scanner
 * that reads it as division reads the quote as a string opener and blanks the rest
 * of the test. That reported one of this repository's own tests as assertionless.
 */
const BEFORE_REGEX = /[(,=:[!&|?{};+\-*%~^<>]$/;
const KEYWORD_BEFORE_REGEX = /\b(?:return|typeof|case|in|of|new|delete|void|do|else|yield|await)$/;

/**
 * The same source with comments, string contents and regex bodies blanked to
 * spaces, newlines kept, so every offset and every line number still lines up
 * with the original.
 *
 * Needed because a test suite is full of assertions written down as text. A real
 * example from this corpus: `expect(result).toContain('}catch(e){}}();')`. Match
 * on the raw source and that line is a swallowed catch inside an empty block. A
 * template literal is blanked whole, including its `${}` parts, which can only
 * make a check quieter than it could be.
 */
export function blanked(source) {
  const out = source.split("");
  let i = 0;
  let sig = "";
  const blank = (from, to) => {
    for (let k = from; k < to && k < out.length; k += 1) if (out[k] !== "\n") out[k] = " ";
  };
  while (i < source.length) {
    const c = source[i];
    const next = source[i + 1];
    if (c === "/" && next === "/") {
      const end = source.indexOf("\n", i);
      const stop = end === -1 ? source.length : end;
      blank(i, stop);
      i = stop;
    } else if (c === "/" && next === "*") {
      const end = source.indexOf("*/", i + 2);
      blank(i, end === -1 ? source.length : end + 2);
      i = end === -1 ? source.length : end + 2;
    } else if (c === '"' || c === "'" || c === "`") {
      let k = i + 1;
      for (; k < source.length; k += 1) {
        if (source[k] === "\\") {
          k += 1;
          continue;
        }
        if (source[k] === c) break;
      }
      blank(i + 1, k);
      i = k + 1;
      sig = c;
    } else if (c === "/" && (sig === "" || BEFORE_REGEX.test(sig) || KEYWORD_BEFORE_REGEX.test(source.slice(0, i).trimEnd()))) {
      let k = i + 1;
      let inClass = false;
      for (; k < source.length; k += 1) {
        const d = source[k];
        if (d === "\\") {
          k += 1;
          continue;
        }
        if (d === "\n") break;
        if (d === "[") inClass = true;
        else if (d === "]") inClass = false;
        else if (d === "/" && !inClass) break;
      }
      blank(i + 1, k);
      i = k + 1;
      sig = "/";
    } else {
      if (!/\s/.test(c)) sig = c;
      i += 1;
    }
  }
  return out.join("");
}

/**
 * The span of the block that starts at the first `{` at or after `from`.
 * Returns null when the braces do not balance, which is the honest answer for a
 * text scanner reading someone else's syntax.
 */
export function blockAt(source, from) {
  const open = source.indexOf("{", from);
  if (open === -1) return null;
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    else if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) return { start: open, end: i, body: source.slice(open + 1, i) };
    }
  }
  return null;
}
