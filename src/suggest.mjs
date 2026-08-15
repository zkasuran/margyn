/**
 * The suggestion box, in one module, because the deployed Worker and the local
 * server both expose it and they must not drift. Pure JavaScript, no runtime
 * API, so the same function runs on both hosts.
 *
 * It stores nothing, for the same reason the fix intake stores nothing. A
 * suggestion becomes a prefilled issue on the public repository, filed by the
 * person who made it under their own account. So the request is trackable by
 * them, answerable in public, and we are not holding a database of other
 * people's ideas that we would then have to guard, back up and explain on the
 * privacy page. There is no inbox here to fill up and nothing to leak.
 *
 * The text a visitor types is theirs and it goes into an issue they submit, so
 * markdown inside it is not an injection, it is formatting. Every value is
 * carried in the URL through `encodeURIComponent`, which is what keeps it inside
 * the `body` parameter instead of leaking into `labels` or `assignees`.
 */
import { reference } from "./reference.mjs";

/** What a suggestion can be, and the label triage sorts it by. */
const KINDS = {
  feedback: { label: "feedback", noun: "Feedback" },
  feature: { label: "feature-request", noun: "Feature request" },
};

const TEXT_MIN = 12;
const TEXT_MAX = 2000;
const CONTACT_MAX = 200;
/**
 * The prepared link has to survive being a URL. GitHub answers a very long
 * prefill with its own error page rather than the form, which would be a dead end
 * for someone who has just written out an idea, so the body is trimmed to fit and
 * the response says so instead of shipping a link that fails on arrival.
 */
const URL_CAP = 6000;

const oneLine = (text) => text.replace(/\s+/g, " ").trim();

function issueBody(kind, text, contact, ref) {
  const lines = [
    `${KINDS[kind].noun} ${ref}`,
    "",
    "Prepared from the suggestion box at https://margyn.xyz/suggest. Nothing was stored on the way here.",
    "Edit anything below before you submit.",
    "",
  ];
  if (contact) lines.push(`Contact: ${contact}`, "");
  lines.push(text);
  return lines.join("\n");
}

const linkFor = (repo, label, title, body) =>
  `https://github.com/${repo}/issues/new?labels=${encodeURIComponent(label)}` +
  `&title=${encodeURIComponent(title)}` +
  `&body=${encodeURIComponent(body)}`;

/**
 * Validates and normalises a suggestion. Returns `{ ok, status, ... }` so the
 * caller only has to shape a response, which is the shape src/fix-intake.mjs
 * already uses.
 *
 * @param body { kind, suggestion, contact }
 * @param opts.repo the repository the prefilled issue targets
 */
export function suggest(body = {}, opts = {}) {
  const repo = opts.repo ?? "zkasuran/margyn";
  const kind = typeof body.kind === "string" && body.kind.trim() ? body.kind.trim().toLowerCase() : "feedback";
  if (!Object.hasOwn(KINDS, kind)) {
    return { ok: false, status: 400, error: `kind has to be ${Object.keys(KINDS).join(" or ")}` };
  }

  const text = typeof body.suggestion === "string" ? body.suggestion.trim() : "";
  if (text.length < TEXT_MIN) {
    return { ok: false, status: 400, error: `say a little more than that: ${TEXT_MIN} characters is the floor` };
  }
  if (text.length > TEXT_MAX) {
    return { ok: false, status: 400, error: `that is over ${TEXT_MAX} characters, so trim it or open the issue yourself` };
  }

  const contact = typeof body.contact === "string" ? oneLine(body.contact).slice(0, CONTACT_MAX) : "";
  const ref = reference("SG", JSON.stringify({ kind, text, contact }));
  const title = `${KINDS[kind].noun} ${ref}: ${oneLine(text).slice(0, 80)}`;

  // Build it, then check it fits. A link that is too long to open is worse than a
  // trimmed one, and the person still has their own text in the box either way.
  let prepared = issueBody(kind, text, contact, ref);
  let url = linkFor(repo, KINDS[kind].label, title, prepared);
  let trimmed = false;
  while (url.length > URL_CAP && prepared.length > 200) {
    prepared = `${prepared.slice(0, Math.floor(prepared.length * 0.8))}\n\n(trimmed to fit the link, paste the rest)`;
    url = linkFor(repo, KINDS[kind].label, title, prepared);
    trimmed = true;
  }

  return {
    ok: true,
    status: 200,
    reference: ref,
    kind,
    label: KINDS[kind].label,
    trimmed,
    issue: { url, title },
  };
}
