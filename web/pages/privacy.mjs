/** Privacy. Short, because the honest answer is that the tool collects nothing. */
export default {
  path: "/privacy",
  title: "Margyn privacy: the CLI collects nothing and never connects",
  description:
    "The scanner makes no network call at any point. The site holds an email address through Tiun and nothing else. No analytics, no trackers, no code, no scan results.",
  body: `
<section class="phead"><div class="wrap">
  <h1 class="prose">Privacy</h1>
  <p class="lede prose">Last updated 2026-08-06. The short version: the tool that reads your code
    never connects to anything, so there is no data from it to have a policy about.</p>
</div></section>

<div class="wrap"><div class="doc">
  <nav class="toc" aria-label="On this page">
    <p>Contents</p>
    <a href="#cli">The command line tool</a>
    <a href="#site">The site</a>
    <a href="#forms">The two forms</a>
    <a href="#licence">What is inside a licence</a>
    <a href="#browser">Cookies and storage</a>
    <a href="#third">Who else is involved</a>
    <a href="#rights">Your data, your call</a>
  </nav>
  <div class="docbody">

<h2 id="cli">The command line tool</h2>
<p>It collects nothing and it sends nothing. No telemetry, no version ping, no crash reporting, no
  licence call home. It reads your working tree, shells out to git, then under
  <code>--mutate</code> it runs your own test command. That is the whole surface.</p>
<p>You do not have to take that on trust. It is one directory of ES modules with no runtime
  dependencies, so grep it for <code>fetch</code> and <code>http</code> and see for yourself. The
  <a href="/security">security page</a> lists every process it starts.</p>

<h2 id="site">The site</h2>
<p>The pages you are reading are static files served from a Cloudflare Worker. There is no analytics
  script, no tag manager, no session recorder and no advertising pixel on any page of this site.
  View source and the only JavaScript is one module that switches the colour theme, copies a command
  to your clipboard and, on two pages, loads the sign in SDK.</p>
<p>If you sign in, an email address enters the picture. <a href="https://tiun.business">Tiun</a>
  holds the account and the payment record. We ask it two questions: is this browser signed in,
  and has this account bought anything. That answer is what a licence is minted from.</p>
<p>Cloudflare sees the request itself, the way any host does: an IP address, a path, a user agent, a
  timestamp. We do not build a profile from it and we run no reporting on it.</p>

<h2 id="forms">The two forms</h2>
<p><a href="/fix">The fix intake</a> and <a href="/suggest">the suggestion box</a> work the same way.
  What you type is validated, turned into a prefilled link and handed straight back to your browser.
  Nothing is written down on this side: no database, no queue, no inbox. The request only exists once
  you click through and submit it to the public repository under your own account, which is also what
  makes it yours to watch.</p>
<p>So a contact address you type is only visible to us if you submit the issue carrying it. Cloudflare
  sees that request the way it sees any request. The fix intake goes one step further and drops the
  code snippet a finding can carry before the link is built, so your source cannot travel that way
  even by accident.</p>

<h2 id="licence">What is inside a licence</h2>
<p>A licence is a signed payload. It carries the product names it unlocks, the account email, the
  issue time and the expiry. Nothing else. It is signed rather than encrypted, so treat the
  email in it as visible to anyone you hand the licence to. That is deliberate: a licence that
  turns up in a public repository is traceable back to the account it was issued for.</p>

<h2 id="browser">Cookies and storage</h2>
<p>One key in <code>localStorage</code>, <code>margyn-theme</code>, holding the word light or dark
  when you pick one. It never leaves your browser and clearing site data removes it.</p>
<p>Sign in and checkout set whatever cookies Tiun's session needs. Those are theirs. They are only
  set once you sign in, so reading these pages sets none of them.</p>

<h2 id="third">Who else is involved</h2>
<table class="st">
  <tr><th>Tiun</th><td>Authentication, subscriptions and card handling. Holds your email and your
    payment record. We never receive card details.</td></tr>
  <tr><th>Cloudflare</th><td>Serves every page and runs the licence endpoint, so it sees the
    request metadata for any visit.</td></tr>
  <tr><th>esm.sh</th><td>Delivers the sign in SDK to your browser on the home page and the pricing
    page, which means it sees your IP address when one of those two pages loads. The other pages do
    not load it.</td></tr>
  <tr><th>npm</th><td>When you run <code>npx margyn-scan</code>, npm fetches the package. That request
    goes to npm rather than to us, so we get no report of it.</td></tr>
</table>

<h2 id="rights">Your data, your call</h2>
<p>To see or delete what is held about you, the account lives with Tiun, so start there. If a
  request needs us, <a href="https://github.com/zkasuran/margyn/issues">open an issue</a> and say
  what you want done. There is no dataset here to export beyond the account record and the payment
  history that Tiun keeps.</p>
<p>We do not sell anything to anyone. There is no list, no data sharing arrangement and no third
  party in the chain beyond the four named above.</p>

  </div>
</div></div>
`,
};
