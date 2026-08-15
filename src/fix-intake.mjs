/**
 * Fix flow intake, in one place, because the deployed Worker and the local
 * server both expose it and they must not drift. Pure JavaScript, no runtime
 * API, so the same function runs in both.
 *
 * The intake works from the FINDING, not from your repository. That is the whole
 * shape of Fix flow: the finding already carries the file, the line, the rule and
 * the reproduction, so no token that can read your source is ever needed. The
 * code snippet a finding sometimes carries in `evidence` is dropped here and
 * never travels, so preparing a request cannot leak your source into a public
 * issue. The security promise on the site holds for the paid service exactly as
 * it does for the free scan.
 */
import { clip, fitUrl, oneLine, reference, repoPath } from "./prepare.mjs";

const CONTACT_MIN = 3;
const CONTACT_MAX = 200;
const MAX_FINDINGS = 20;
const ISSUE_BODY_CAP = 6000;

/**
 * A finding, reduced to the fields that describe a defect rather than the source.
 *
 * Every field is coerced and clipped rather than copied. A finding arrives as JSON
 * from a stranger, so `{"summary": 1}` used to reach `.slice` and throw a
 * TypeError out of the worker. A backtick in `check` or `file` escaped the inline
 * code span it is wrapped in.
 */
const plain = (value, max) => (value == null ? undefined : clip(oneLine(value).replace(/`/g, "'"), max));
function safeFields(f) {
  if (typeof f !== "object" || f === null) return { summary: clip(oneLine(f ?? ""), 400) };
  return {
    check: plain(f.check, 60),
    severity: plain(f.severity, 20),
    file: plain(f.file, 200),
    summary: plain(f.summary, 400),
    why: plain(f.why, 600),
    reproduction: Array.isArray(f.reproduction)
      ? f.reproduction.slice(0, 12).map((line) => clip(String(line), 300))
      : undefined,
  };
}

/** A fence longer than the longest backtick run inside it, so nothing closes early. */
function fence(lines) {
  const longest = Math.max(0, ...lines.map((l) => Math.max(0, ...[...String(l).matchAll(/`+/g)].map((m) => m[0].length))));
  return "`".repeat(Math.max(3, longest + 1));
}

function issueBody(findings, contact, note, ref) {
  const lines = [
    `Fix request ${ref}`,
    "",
    "Prepared from Margyn findings. Only the location and the rule are included, not the source.",
    "Fulfilment is included with Solo Fix and Fix flow. Edit anything below before you submit.",
    "",
    `Contact: ${contact}`,
  ];
  if (note) lines.push(`Note: ${note}`);
  findings.forEach((f, i) => {
    lines.push("", `### ${i + 1}. ${f.summary ?? f.check ?? "finding"}`);
    if (f.check) lines.push(`- rule: \`${f.check}\`${f.severity ? ` (${f.severity})` : ""}`);
    if (f.file) lines.push(`- where: \`${f.file}\``);
    if (f.why) lines.push(`- why: ${f.why}`);
    if (f.reproduction?.length) {
      const bars = fence(f.reproduction);
      lines.push("- reproduce:", bars, ...f.reproduction, bars);
    }
  });
  return lines.join("\n");
}

/**
 * Validates and normalises a fix request. Returns `{ ok, status, ... }` so the
 * caller only has to shape a response. It records nothing: there is nothing to
 * store, because the request is delivered to a real, trackable channel rather
 * than to a database we would then have to guard.
 *
 * @param body { finding | findings, contact, note }
 * @param opts.repo the repo the prefilled issue targets
 */
export function intake(body = {}, opts = {}) {
  const repo = repoPath(opts.repo ?? "zkasuran/margyn");
  const contact = typeof body.contact === "string" ? clip(oneLine(body.contact), CONTACT_MAX) : "";
  if (contact.length < CONTACT_MIN) {
    return { ok: false, status: 400, error: "a contact (email or handle) is required so a fix can reach you" };
  }

  const raw = body.findings ?? (body.finding != null ? [body.finding] : []);
  const list = (Array.isArray(raw) ? raw : [raw]).filter((f) => f != null && f !== "");
  if (list.length === 0) {
    return { ok: false, status: 400, error: "paste at least one finding, from `margyn --json` or the text output" };
  }
  if (list.length > MAX_FINDINGS) {
    return { ok: false, status: 400, error: `that is more than ${MAX_FINDINGS} findings for one request, so split it` };
  }

  const findings = list.map(safeFields);
  const note = typeof body.note === "string" ? clip(oneLine(body.note), 500) : "";
  const ref = reference("FX", JSON.stringify({ contact, findings }));
  const title = `Fix request ${ref}: ${clip(findings[0].summary ?? findings[0].check ?? "finding", 80)}`;
  // No `labels=`: GitHub needs permission to honour it and treats a label the
  // repository does not have as an invalid URL, either of which hands the sender a
  // 404 instead of the form. The kind is in the title and the label is applied at
  // triage.
  const link = (body) =>
    `https://github.com/${repo}/issues/new?title=${encodeURIComponent(title)}` +
    `&body=${encodeURIComponent(body)}`;
  const { url, trimmed } = fitUrl(issueBody(findings, contact, note, ref), link, ISSUE_BODY_CAP);

  return { ok: true, status: 200, reference: ref, count: findings.length, trimmed, issue: { url, title } };
}
