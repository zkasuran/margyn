/** Fix flow intake. Paste a finding, get a prepared, trackable fix request. */
export default {
  path: "/fix",
  title: "Margyn Fix flow: send a finding, get back a patch with a test",
  ogTitle: "Send the finding. Get back a patch that carries its own test.",
  description:
    "Paste a Margyn finding and prepare a fix request. It works from the finding, not your repository, so no token that can read your source is ever needed. Fulfilment is included with Solo Fix and Fix flow.",
  body: `
<section class="phead"><div class="wrap">
  <h1 class="prose">Send the finding. Get back a patch that carries its own test.</h1>
  <p class="lede prose">Fix flow works from the finding, never from your repository. The finding
    already carries the file, the line, the rule and the reproduction, so nobody needs a token that
    can read your source. Paste one below and Margyn prepares a tracked request. Fulfilment is
    included with <a href="/pricing#fix">Solo Fix</a> ($19 a month, one fix) and
    <a href="/pricing#fix">Fix flow</a> ($79 a month, three).</p>
</div></section>

<section><div class="wrap">
  <form id="fixform" class="fixform">
    <label for="finding">The finding</label>
    <p class="hint prose">Paste the output of <code>margyn --json</code>, or a single finding, or
      just describe it in a sentence. Your code is not needed and is not sent: only the location and
      the rule travel.</p>
    <textarea id="finding" name="finding" rows="10" required
      placeholder='{ "findings": [ { "check": "no-assertion", "file": "test/a.test.mjs:12", "summary": "test \\"x\\" asserts nothing" } ] }'></textarea>

    <label for="contact">Where a fix should reach you</label>
    <input id="contact" name="contact" type="text" required placeholder="you@example.com or @handle">

    <label for="note">Anything else (optional)</label>
    <textarea id="note" name="note" rows="3" placeholder="Context, a deadline, the branch it lives on."></textarea>

    <div class="row">
      <button type="submit">Prepare the fix request</button>
    </div>
  </form>
  <div id="fixout" class="fixout" role="status" aria-live="polite"></div>
</div></section>

<section><div class="wrap">
  <h2>What happens next</h2>
  <p class="prose">Preparing a request opens a tracked issue you can watch. Only the finding's
    location, rule and reproduction are included, never the code snippet a finding sometimes
    carries, so preparing a request cannot put your source anywhere public. Edit anything before you
    submit. A fix comes back as a patch carrying a test that fails before it and passes after, within
    five working days, or that month is refunded. If a fix genuinely cannot be written from the
    finding alone, we say so and it does not count.</p>
  <p class="sm prose">Preparing is open to anyone. Fulfilment is what the <a href="/pricing#fix">Solo
    Fix and Fix flow plans</a> buy.</p>
</div></section>

<script type="module">
const byId = (id) => document.getElementById(id);
const form = byId("fixform");
const out = byId("fixout");
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const contact = byId("contact").value.trim();
  const note = byId("note").value.trim();
  const raw = byId("finding").value.trim();
  const body = { contact, note };
  try {
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.findings)) body.findings = parsed.findings;
    else if (Array.isArray(parsed)) body.findings = parsed;
    else body.finding = parsed;
  } catch (e) {
    body.finding = raw;
  }
  out.textContent = "Preparing the request...";
  try {
    const res = await fetch("/api/fix-intake", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) { out.textContent = data.error || ("the server returned " + res.status); return; }
    out.innerHTML = "";
    const head = document.createElement("p");
    head.innerHTML = "Prepared. Reference <b></b> for <b></b> finding(s).";
    head.querySelectorAll("b")[0].textContent = data.reference;
    head.querySelectorAll("b")[1].textContent = String(data.count);
    const link = document.createElement("a");
    link.href = data.issue.url;
    link.target = "_blank";
    link.rel = "noopener";
    link.className = "btn";
    link.textContent = "Open the fix request";
    const note2 = document.createElement("p");
    note2.className = "sm";
    note2.textContent = "Only the location and rule are included, never your source. Edit anything before you submit. Fulfilment is included with Solo Fix and Fix flow.";
    out.append(head, link, note2);
  } catch (err) {
    out.textContent = String((err && err.message) || err);
  }
});
</script>
`,
};
