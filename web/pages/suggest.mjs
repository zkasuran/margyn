/** The suggestion box. Say what is missing, get a tracked issue you can watch. */
export default {
  path: "/suggest",
  title: "Margyn suggestion box: feedback and feature requests",
  ogTitle: "Tell it what it is missing.",
  description:
    "Send feedback or ask for a feature. Nothing is stored: the box prepares a prefilled issue on the public repository which you submit under your own account, so you can watch the answer.",
  body: `
<section class="phead"><div class="wrap">
  <h1 class="prose">Tell it what it is missing.</h1>
  <p class="lede prose">Six checks is a deliberate number rather than a finished one. If Margyn
    reported something wrong, missed something it should have caught or needs a check that does not
    exist yet, this is the box for it. A false positive is treated as a defect here, so those are
    the most useful messages we get.</p>
</div></section>

<section><div class="wrap">
  <form id="sgform" class="fixform">
    <label for="kind">What is this</label>
    <select id="kind" name="kind">
      <option value="feedback">Feedback, including a wrong or noisy finding</option>
      <option value="feature">A feature or a check that should exist</option>
    </select>

    <label for="suggestion">Say it here</label>
    <p class="hint prose">Concrete beats polite. A repository and a command we can run turns this
      into something actionable the same day. So does the finding you disagree with. Do not paste
      code you would not put in a public issue: this prepares one.</p>
    <textarea id="suggestion" name="suggestion" rows="9" required minlength="12" maxlength="2000"
      placeholder="npx margyn-scan on our monorepo reports every package's dist/ as missing source. Repo is public at github.com/..., the command is ..."></textarea>

    <label for="contact">Where a reply should reach you (optional)</label>
    <input id="contact" name="contact" type="text" maxlength="200" placeholder="you@example.com or @handle">

    <div class="row">
      <button type="submit">Prepare the request</button>
    </div>
  </form>
  <div id="sgout" class="fixout" role="status" aria-live="polite"></div>
</div></section>

<section><div class="wrap">
  <h2>What happens to it</h2>
  <p class="prose">Nothing is stored here. The box validates what you wrote, gives it a reference and
    prepares an issue on <a href="https://github.com/zkasuran/margyn/issues">the public
    repository</a> with the text already filled in. You submit it under your own account, which is
    what makes it yours to watch and ours to answer in public. There is no inbox on this side to
    fill up and no database of other people's ideas to guard.</p>
  <p class="prose">If you would rather not use a GitHub account, open the prepared link, copy the
    text out of it and send it wherever you like. The reference is deterministic, so quoting it back
    at us finds the same request.</p>
  <p class="sm prose">A finding you think is wrong is the highest value message on this page.
    <a href="/proof#public">Twenty two false positives</a> were found and fixed exactly this way,
    by pointing the tool at repositories that were not ours and reading every finding by hand.</p>
</div></section>

<script type="module">
const byId = (id) => document.getElementById(id);
const form = byId("sgform");
const out = byId("sgout");
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const body = {
    kind: byId("kind").value,
    suggestion: byId("suggestion").value.trim(),
    contact: byId("contact").value.trim(),
  };
  out.textContent = "Preparing...";
  try {
    const res = await fetch("/api/suggest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) { out.textContent = data.error || ("the server returned " + res.status); return; }
    out.innerHTML = "";
    const head = document.createElement("p");
    const ref = document.createElement("b");
    ref.textContent = data.reference;
    head.append("Prepared as ", ref, ", labelled ");
    const label = document.createElement("code");
    label.textContent = data.label;
    // No period after the code span: its right padding leaves a visible gap.
    head.append(label);
    const link = document.createElement("a");
    link.href = data.issue.url;
    link.target = "_blank";
    link.rel = "noopener";
    link.className = "btn";
    link.textContent = "Open the prepared issue";
    const note = document.createElement("p");
    note.className = "sm";
    note.textContent = data.trimmed
      ? "The text was trimmed to fit the link, so paste the rest into the issue before you submit."
      : "Edit anything before you submit. Nothing was stored on this side.";
    out.append(head, link, note);
  } catch (err) {
    out.textContent = String((err && err.message) || err);
  }
});
</script>
`,
};
