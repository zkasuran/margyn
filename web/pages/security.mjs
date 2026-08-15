/** Security. The absent endpoint is the feature, so it leads. */
export default {
  path: "/security",
  title: "Margyn security: a local CLI, no hosted scan, licences verified offline",
  ogTitle: "Your code never leaves your machine. There is nowhere to send it.",
  description:
    "Every process the scanner starts, every file it writes, plus why there is deliberately no scan endpoint on the deployed site. Licences are Ed25519 and verified offline.",
  body: `
<section class="phead"><div class="wrap">
  <h1 class="prose">Your code never leaves your machine. There is nowhere to send it.</h1>
  <p class="lede prose">This page lists every process the scanner starts, every file it writes and
    every network call it makes. The last list is empty.</p>
</div></section>

<section><div class="wrap">
  <h2>There is no hosted scan. There is not going to be one</h2>
  <p class="prose">A hosted scanner would need read access to your repository. We would then be
    holding your source plus a token wide enough to fetch it, which is a security story we are not
    in a position to defend. So the scan stays on your side of the line.</p>
  <p class="prose">That is not a promise, it is a missing route. The deployed worker serves the
    page, sign in, checkout and the licence endpoint. Check it yourself:</p>
<pre tabindex="0" role="group" aria-label="Proving the scan endpoint does not exist"><b>$ curl -s -o /dev/null -w '%{http_code}\\n' -X POST https://margyn.xyz/api/scan</b>
404
<b>$ curl -s https://margyn.xyz/api/config</b>
{"snippetId":"...","sandbox":true,"products":[...],"scan":false}</pre>
  <p class="sm prose" style="margin-top:14px">The local development server does have a scan route,
    because there the caller and the repository are the same machine. On a public host that route
    would take a filesystem path from a stranger and run git against it, which is a filesystem
    probe wearing a product's clothes.</p>
</div></section>

<section><div class="wrap">
  <h2>Every process the CLI starts</h2>
  <table class="st">
    <tr><th><code>git ls-files</code></th><td>Lists what the repository actually tracks. Every
      check starts here, which is also why Margyn needs a git repository rather than a
      directory.</td></tr>
    <tr><th><code>git check-ignore -v</code></th><td>Asks git which rule excludes a file, so the
      finding can name the rule and the line instead of guessing.</td></tr>
    <tr><th>your test command</th><td>Only under <code>--mutate</code>. It is whatever
      <code>npm test</code> resolves to in the repository being scanned. Nothing is inferred and
      nothing else is executed.</td></tr>
  </table>
  <p class="sm prose" style="margin-top:18px">That is the whole list. Files are read with
    <code>node:fs</code>, capped at 400 KB each, skipping <code>.git</code>,
    <code>node_modules</code>, build output and virtual environments. The commands printed inside a
    finding, including <code>git archive</code>, are text for you to run. The scanner does not run
    them.</p>
</div></section>

<section><div class="wrap">
  <h2>What it writes, what it does not</h2>
  <p class="prose">With no flags: nothing. The five static checks are read only.</p>
  <p class="prose">Under <code>--mutate</code>: one file at a time, inverted at one line, only
    after your suite has passed unmutated. The original is restored in a <code>finally</code> block
    and on <code>SIGINT</code>, so a scan you interrupt with ctrl-c cannot leave a mutated tree
    behind. A red baseline aborts the whole check with the reason rather than producing results
    that would mean nothing.</p>
  <p class="prose">It never writes to your home directory, never installs anything and never edits
    a config file. It reads a licence from <code>~/.margyn/licence</code> if one is there.</p>
</div></section>

<section><div class="wrap">
  <h2>Network calls: none</h2>
  <p class="prose">The scanner opens no connection at any point, including for billing. There are no
    runtime dependencies, so there is no transitive package to audit either. It is one directory of
    ES modules, which means reading it before you run it costs minutes rather than an afternoon.</p>
<pre tabindex="0" role="group" aria-label="Grepping the scanner for network calls"><b>$ grep -rnE 'fetch\\(|node:http|node:https|axios' src/</b>
<span class="d">(no output)</span></pre>
</div></section>

<section><div class="wrap">
  <h2>The licence is signed, not phoned in</h2>
  <p class="prose">The server signs a short payload with Ed25519. The CLI verifies it against a
    public key compiled into the source, so a paid check runs on a CI runner with no network access
    at all. The private key lives only in the server environment and is not in the repository.</p>
  <p class="prose">Four attacks are tested rather than asserted, using signatures from the real
    signer: a flipped signature byte, a payload swapped under a valid signature, an expired licence
    and a licence for a different product. Each is refused with the reason named, because "your
    licence expired" and "your licence was tampered with" are different conversations.</p>
  <p class="prose">A licence carries the product names, the account email, the issue time and the
    expiry. It is signed rather than encrypted, so treat it as readable by anyone who holds it.</p>
  <p class="sm"><a href="/pricing#licence">How a licence is installed</a> &middot; <a
    href="/privacy#licence">What is inside one</a></p>
</div></section>

<section><div class="wrap">
  <h2>The hosted half</h2>
  <table class="st">
    <tr><th>Secrets</th><td>Set once per environment with <code>wrangler secret put</code> and
      never committed. The API key and the signing key exist only in the worker
      environment.</td></tr>
    <tr><th><code>/api/config</code></th><td>Returns the public snippet id, the environment flag and
      the product list. The API key is absent from it by construction rather than by
      filtering.</td></tr>
    <tr><th>Token exchange</th><td>The browser gets a short lived verification token from the sign in
      SDK. Exchanging it for a user happens server side, so the secret key never reaches a
      page.</td></tr>
    <tr><th>Request bodies</th><td>Capped at 64 KB before parsing. An unbounded parse on a worker
      billed for CPU is somebody else's denial of service on our account.</td></tr>
    <tr><th>Cards</th><td>Handled by <a href="https://tiun.business">Tiun</a>. We never see a card
      number.</td></tr>
  </table>
</div></section>

<section><div class="wrap">
  <h2>Reporting something</h2>
  <p class="prose">Use <a href="https://github.com/zkasuran/margyn/security/advisories/new">a private
    security advisory</a> for anything exploitable, so it stays out of public view until it is
    fixed. Everything else can be <a href="https://github.com/zkasuran/margyn/issues">an
    issue</a>.</p>
  <p class="prose">Two things this page will not claim. Release tags are not signed yet, so verify
    the published package against the repository rather than against a signature. There has been no
    third party audit. There will not be a badge here pretending otherwise.</p>
</div></section>
`,
};
