/** Terms. Plain English, because a term nobody reads is another unrun check. */
export default {
  path: "/terms",
  title: "Margyn terms of sale and use",
  description:
    "What you are buying, what it costs, how to cancel, how refunds work and what the software does not promise. Written to be read.",
  body: `
<section class="phead"><div class="wrap">
  <h1 class="prose">Terms of sale and use</h1>
  <p class="lede prose">Last updated 2026-08-06. Written to be read once rather than skipped, so it
    is short and it says what it means.</p>
</div></section>

<div class="wrap"><div class="doc">
  <nav class="toc" aria-label="On this page">
    <p>Contents</p>
    <a href="#who">Who you are buying from</a>
    <a href="#what">What you are buying</a>
    <a href="#price">Price and billing</a>
    <a href="#cancel">Cancelling</a>
    <a href="#refunds">Refunds</a>
    <a href="#licence">The licence</a>
    <a href="#promise">What the software promises</a>
    <a href="#use">Acceptable use</a>
    <a href="#availability">Availability</a>
    <a href="#changes">Changes to these terms</a>
    <a href="#contact">Contact</a>
  </nav>
  <div class="docbody">

<h2 id="who">Who you are buying from</h2>
<p>Margyn is built and sold by Asura Coding Works. Sign in, checkout, subscriptions and card
  handling run on <a href="https://tiun.business">Tiun</a>. We never see or store a card number.</p>

<h2 id="what">What you are buying</h2>
<p>Three separate things. It is worth keeping them apart.</p>
<p>The command line tool is MIT licensed and free. You can read it, fork it, run it on anything you
  have the right to read. Nothing about that depends on paying us. The four static checks are
  part of that free tool and they stay free.</p>
<p><b>Watch</b> and <b>Team</b> buy one thing: the right to hold a licence that unlocks the mutation
  proof in that tool. Watch covers one repository owner, Team covers an organisation and every
  repository it owns. Both are subscriptions to a capability rather than access to a service, which
  is why a scan keeps working when our site does not.</p>
<p><b>Fix flow</b> is not software, it is work. For 79 USD a month we fix up to three findings you
  send us, each returned as a patch carrying a test that fails before the fix and passes after.
  Three is the ceiling and it is on the page rather than the word unlimited, because three is what
  one person can do properly in a month. Terms of that work:</p>
<ul>
  <li>It runs from the finding, not from your repository. You send the finding output plus the file
    it names if the patch needs it. We ask for no token, no repository access and no clone.</li>
  <li>Back within five working days of receiving what a patch needs. If it is later than that, that
    month is refunded without you having to ask twice.</li>
  <li>If a fix genuinely cannot be written from what you sent, we say so and it does not count
    against your three.</li>
  <li>A patch that does not apply is our defect, as is a test that does not fail before the fix. We
    redo it and it does not count against your three either.</li>
  <li>Unused findings do not roll over. It is a month of attention rather than a bucket of
    credits.</li>
</ul>

<h2 id="price">Price and billing</h2>
<p>Watch is 8.99 USD a month for one repository owner. Team is 29 USD a month for an organisation.
  Fix flow is 79 USD a month. Watch and Team carry three free days first. Every one of them renews
  monthly until you cancel it. Prices shown on the <a href="/pricing">pricing page</a> are the prices
  charged. A change to them applies from your next renewal rather than retroactively.</p>

<h2 id="cancel">Cancelling</h2>
<p>Cancel whenever you like, from your account. Three things happen, in this order: you are not
  charged again, you stop being able to mint new licences at the end of the paid period, then the
  licence already on your disk carries on working until it expires. The four free checks are not
  affected by any of it.</p>

<h2 id="refunds">Refunds</h2>
<p>Ask within 14 days of a charge and it is refunded. You do not have to explain why. Ask through
  <a href="https://github.com/zkasuran/margyn/issues">the repository issues</a> and say which
  account the charge belongs to.</p>

<h2 id="licence">The licence</h2>
<p>A licence is issued to one account. It carries the account email inside a signed payload, so a
  licence that turns up somewhere it should not be is traceable to the account it came from.</p>
<p>Do not publish it and do not resell it. Nothing about that is enforced by phoning home, because
  the whole point of the design is that verification needs no network. It is a term you agree to
  rather than a lock we install. We would rather say so than pretend otherwise.</p>
<p>Licences expire 31 days after they are issued. While the subscription is active you can take a
  new one at any time.</p>

<h2 id="promise">What the software promises, what it does not</h2>
<p>It promises one thing: every finding it reports comes with a command that reproduces the finding.
  A finding that cannot be reproduced is dropped rather than printed.</p>
<p>It does not promise that a clean result means your test suite is correct. It checks five specific
  things. A repository that passes all five can still have a suite that misses bugs. The
  <a href="/">home page</a> names what is not built rather than implying coverage we do not have.</p>
<p>The software is provided under the MIT licence, which includes its warranty disclaimer. Nothing
  on this page adds a warranty on top of that. Nothing on this page limits a right you have
  under consumer law where you live.</p>

<h2 id="use">Acceptable use</h2>
<p>Run it on repositories you have the right to read. Under <code>--mutate</code> it edits files and
  runs your test command, so run that against trees you have the right to modify. Do not use the
  tool or the licence to attack anyone. Do not resell either as your own product.</p>

<h2 id="availability">Availability</h2>
<p>There is no uptime commitment on the site. There does not need to be one. The site exists to
  sign you in, take a payment and hand you a licence. Scanning happens on your machine, so an
  outage here cannot stop a scan or fail a build. If the site is down you cannot buy or reissue a
  licence until it is back.</p>

<h2 id="changes">Changes to these terms</h2>
<p>These terms change by editing this page and moving the date at the top. Anything that changes what
  you are paying for or what you are allowed to do also gets an entry in the
  <a href="/changelog">changelog</a>, so the change is dated somewhere you can check.</p>

<h2 id="contact">Contact and disputes</h2>
<p>Support, refunds and anything else: <a href="https://github.com/zkasuran/margyn/issues">open an
  issue</a>. It is a public channel that demonstrably works, which is why it is the one listed.</p>
<p>These terms are governed by the law of the seller's place of business. If you need a signed
  agreement, an invoice in a particular form or a named forum for disputes, ask before you
  subscribe rather than after.</p>

  </div>
</div></div>
`,
};
