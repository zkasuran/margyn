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

const CONTACT_MIN = 3;
const CONTACT_MAX = 200;
const MAX_FINDINGS = 20;
const ISSUE_BODY_CAP = 6000;

/** FNV-1a, so a reference is deterministic: the same request yields the same id. */
function reference(input) {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return `FX-${(h >>> 0).toString(36).toUpperCase().padStart(6, "0")}`;
}

/** A finding, reduced to the fields that describe a defect rather than the source. */
function safeFields(f) {
  if (typeof f === "string") return { summary: f.slice(0, 400) };
  return {
    check: f.check,
    severity: f.severity,
    file: f.file,
    summary: f.summary,
    why: f.why,
    reproduction: Array.isArray(f.reproduction) ? f.reproduction : undefined,
  };
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
    if (f.reproduction?.length) lines.push("- reproduce:", "```", ...f.reproduction, "```");
  });
  return lines.join("\n").slice(0, ISSUE_BODY_CAP);
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
  const repo = opts.repo ?? "zkasuran/margyn";
  const contact = typeof body.contact === "string" ? body.contact.trim() : "";
  if (contact.length < CONTACT_MIN || contact.length > CONTACT_MAX) {
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
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 500) : "";
  const ref = reference(JSON.stringify({ contact, findings }));
  const title = `Fix request ${ref}: ${(findings[0].summary ?? findings[0].check ?? "finding").slice(0, 80)}`;
  const url =
    `https://github.com/${repo}/issues/new?labels=fix-request` +
    `&title=${encodeURIComponent(title)}` +
    `&body=${encodeURIComponent(issueBody(findings, contact, note, ref))}`;

  return { ok: true, status: 200, reference: ref, count: findings.length, issue: { url, title } };
}
