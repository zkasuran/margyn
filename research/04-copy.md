# Margyn: copy plan and positioning

Written 2026-08-05. Pre-launch. No customers, no testimonials, no logos, no
star count. Everything on the page has to be true on the day it goes live and
checkable by a stranger in under a minute.

Every fact used below was verified today by running the product. The commands
are in the appendix so a later editor can re-verify instead of trusting this
file.

---

## 0. Positioning, decided in one place

**Category:** test-suite auditor. Not a linter, not a code reviewer, not a
coverage tool.

**The claim:** your suite is a claim about your code. Margyn tests that claim.

**The one thing the page must land:** passing is not the same as checking. A
green suite can be green because nothing was watching.

**What we say we are not, out loud, early:** we do not read your logic for bugs,
we do not score your coverage and we do not have an opinion about your style.

**The asset nobody else on this page has:** run the mutation proof on Margyn's
own repository and it reports three surviving mutants in Margyn's own test
suite. One of them is in the mutation checker itself. A tool that indicts itself
on its own front page is not selling.

---

## 1. Hero options, ranked

Seven options. Ranked worst to best is a waste of a reader's time, so they are
listed in rank order with the recommendation written out in full at the end.

### 1. Your tests pass. That is not the same as working.

> Margyn audits the machinery that is supposed to catch your bugs. It does not
> review your code. Every finding ships a reproduction you can run. A finding
> without one is dropped instead of reported.
>
> We ran it on itself. Three of our own tests do not check anything.
>
> `npx margyn /path/to/repo`

**Why it works.** The headline states the reader's belief in four words, then
splits it. It makes no claim about Margyn at all, so there is nothing to
disbelieve in the first three seconds. The subhead then spends its credibility
on us instead of on the reader, which is the only proof move a product with zero
customers gets for free. "Three of our own tests do not check anything" is a
sentence a marketer would never write, which is exactly why a developer reads
the next line.

**Risk.** The two-sentence contrast shape is common. The self-indictment under
it is not, so the shape stops mattering.

### 2. Some of your tests cannot fail.

> Not a metaphor. A test whose body asserts nothing reports green whatever the
> code returned. A script no workflow invokes cannot go red. Margyn finds both
> and proves each one with a command you can run.
>
> `npx margyn /path/to/repo`

**Why it works.** Shortest true alarming sentence available. "Cannot fail" is
the literal technical state, not hyperbole. The subhead proves it in one line
before anyone can call it hype. "Not a metaphor" does real work: it turns
an accusation into a definition.

**Risk.** Reads accusatory to a reader who is proud of their suite. That reader
is also the one most likely to run it to prove us wrong, which is a conversion.

### 3. Three of our own tests do not check anything.

> We know because we ran Margyn on Margyn. It inverts a line, runs the suite,
> then reports the suite that stayed green anyway. On our repository, at the
> default cap of four mutations, three survived. One was in the mutation checker
> itself.

**Why it works.** Highest trust per word of anything we can say pre-launch.
Verifiable by a stranger, on our own public repo, in one command. It also
demonstrates the product's whole thesis on us rather than asserting it about
them.

**Risk.** It leads with our problem instead of theirs. It also explains the
mechanism before the reader knows why they should care. Stronger as the line
directly beneath a shorter headline, which is what the recommendation does.

### 4. A green check mark is a claim. Margyn tests the claim.

> Five checks over the verification layer: files git never committed, tests that
> assert nothing, scripts no workflow runs, linters scoped by the wrong file and
> lines you can invert with the suite still green. Every finding ships a command
> you can run.

**Why it works.** The cleanest statement of the category we have. It positions
against code review and against coverage in six words without naming either.
"Tests the claim" is precise, which is the register this audience reads in.

**Risk.** Abstract. Nothing in it hurts yet. It only lands if real terminal
output sits immediately underneath.

### 5. 26 tests green. Two were reading files that had never been pushed.

> That was a real pull request, on 2026-08-01. Eight vendored modules sat under
> a path containing `dist/`, which the root `.gitignore` excludes at any depth,
> so git dropped all eight while they sat on disk. The diff was innocent. The
> absence was the bug. Margyn was written from it.

**Why it works.** The most concrete thing we own. Numbers, a date, a mechanism
and no adjectives. A reader can picture their own repo doing this, because it
needs nobody to be incompetent.

**Risk.** The specific failure is narrow enough that a reader can decide it is
not their problem. It also collides with Margyn's own test count, which is also
26, so putting both numbers near each other reads as a copy error.

### 6. Coverage tells you a line ran. It does not tell you anyone was watching.

> Margyn inverts a line, runs your suite, then reports the suite that stayed
> green anyway. It also finds the files git never committed, the tests that
> assert nothing and the gates no workflow calls. Zero dependencies. Node 22 and
> git.

**Why it works.** Names the incumbent belief and dismantles it without
disparaging any tool. "Anyone was watching" is the whole argument in four words.

**Risk.** It picks a fight on mutation testing's ground, where Stryker and PIT
already stand. Four of our five checks are not mutation testing, so this
headline undersells most of the product.

### 7. Proves your checks do not check anything. (the current line)

**Why it works.** Accurate and compressed. "Proves" is load bearing, which the
reproduction rule earns.

**Risk.** It is a claim about us in the voice of a verdict about them. "Your
checks do not check anything" asserts a finding before showing any evidence,
which is the one thing the product itself refuses to do. Keep it as the repo
tagline and the meta description. The page should earn that sentence by the end
rather than open with it.

### Recommended hero, verbatim

Option 1 as the headline, option 3 compressed into the proof line, the command
as the only button.

```
Your tests pass. That is not the same as working.

Margyn audits the machinery that is supposed to catch your bugs. It does not
review your code. Every finding ships a reproduction you can run. A finding
without one is dropped instead of reported.

We ran it on itself. Three of our own tests do not check anything.

    npx margyn /path/to/repo          [copy]

Zero dependencies. Node 22 and git. Exit code 1 on findings, so it works as a
CI gate.
```

---

## 2. Section plan, top to bottom

Order is decided by one rule from the devtool landing page research: real output
before any prose about the output. Never make a developer scroll past a thousand
pixels to reach a command. Pricing sits at position 10, after the
product is believed and before the status note. The honest pre-launch state sits
at position 11, after pricing on purpose: a status note read before the product
looks like an excuse, read after it looks like discipline.

**The single primary call to action, everywhere on the page, is one line:**

```
npx margyn /path/to/repo
```

Not "get started". Not "sign up". Not "book a demo". The command is the CTA
because running it costs nothing, needs no account, sends no code anywhere and
answers the reader's real question, which is whether their own repo comes back
clean. Sign in exists on the page as a small nav link for the one group who
needs it, which is people who already bought Watch and want their licence.

### Section 1. Hero

**Job.** State the tension in one sentence, say what the tool is, hand over the
command. Under 350 pixels of vertical space.

**Direction.** No product noun before the tension lands. No adjectives. The
command visible without scrolling.

**Draft.** As written in the recommendation above.

### Section 2. The real output

**Job.** Prove the tool exists and does something specific, before any
explanation. This is the section the whole page rests on.

**Direction.** One real terminal block, copied out of a real run, colour and
all. A caption naming the repository and the commit so a reader can reproduce
it. No mocked screenshot, no invented paths, no prettified fake.

**Draft.**

> **This is a real run, against the commit that broke.**
>
> `nishuzumi/moss` at `c6cbb45`, reconstructed in a detached worktree with the
> untracked files restored:
>
> ```
> margyn /tmp/moss
>
> 2 findings, each with a reproduction you can run.
>
> 1. packages/protocols/aave/abis-src/dist/AaveV3Monad.mjs is read by
>    packages/protocols/aave/README.md but git ignores it, so it is not in the commit
>    HIGH  ignored-source  ignore rule: .gitignore:2:dist/
>    reproduce:
>      git archive HEAD | tar -t | grep -qx '<path>' || echo 'ABSENT from HEAD'
>      test -f '<path>' && echo 'PRESENT on disk'
> ```
>
> Run those two lines and they answer `ABSENT from HEAD` then `PRESENT on disk`.
> That is the finding. Not an opinion about the file, two facts about it that
> disagree.
>
> Run the same scan against the fixed tree at `0c743c2` and both high findings
> are gone. A checker that cannot be shown to go quiet is as hollow as the
> checks it hunts, so that direction is tested too.

**Why.** A reproduction the reader can run in their own shell converts better
than any claim. It is also the product's own rule turned into copy.

### Section 3. We ran it on ourselves

**Job.** Spend the credibility on us. This is the section that replaces a
testimonial strip.

**Direction.** Blunt, specific, no flinching and no apology after it. State the
number, name the worst one, then say what we are doing about it. Do not soften
it with "of course, every suite has gaps".

**Draft.**

> **Margyn finds three holes in Margyn.**
>
> The mutation proof inverts one line, runs the suite, then reports the suite
> that stayed green anyway. Pointed at our own repository at the default cap of
> four mutations, three survived:
>
> ```
> src/checks/mutation.mjs        return true -> false    suite still passed
> src/checks/ignored-source.mjs  return true -> false    suite still passed
> bin/bundle-static.mjs          === -> !==              suite still passed
> ```
>
> The first one is the mutation checker. Our own tool inverted a line inside our
> own mutation checker and our 26 tests reported success.
>
> Raise the cap and it finds more. We publish the number rather than the cap
> that flatters it.
>
> You can check this yourself. Clone the repo, run `npm test` and watch 26 tests
> pass, then run the mutation proof against it and watch three of them turn out
> to be watching nothing.

**Why.** Zero-customer products have exactly one honest source of proof, which
is evidence about themselves. This is stronger than a testimonial, because a
testimonial asks the reader to trust a stranger and this asks them to trust a
command.

### Section 4. Where it came from

**Job.** Establish that this was found in the world, not invented in a
whiteboard session.

**Direction.** Tell it as an incident report. Date, mechanism, numbers, the
sentence that makes it universal.

**Draft.**

> **A real pull request went red on 2026-08-01 and no reviewer could have seen
> why.**
>
> Eight vendored modules lived under a path containing `dist/`. The root
> `.gitignore` excludes `dist/` at any depth, so git dropped all eight from the
> commit while they sat on disk. Locally the suite was 26 tests green. In CI two
> tests failed, reading files that had never been pushed.
>
> The diff was innocent. The absence was the bug. Nothing in a diff shows you a
> file that is not there.
>
> The first two checks were written from that failure. Then three more, from the
> same question: what else in this repository reads as verification and performs
> none?

### Section 5. The five checks

**Job.** Say exactly what it looks for, in the reader's own vocabulary, so they
can predict whether it will find anything in their repo.

**Direction.** One line of mechanism per check, then one line of consequence.
Severity shown. Paid check marked as paid right here, not hidden until pricing.

**Draft.**

> **`ignored-source`  high**
> Files the repo reads that git never committed. Green on your laptop because
> the file is on your disk untracked, red in CI reading something that was never
> pushed.
>
> **`no-assertion`  high**
> Tests that assert nothing. The body runs, throws nothing and reports green
> whatever the code returned. Assertions reached through a helper count, so a
> test whose whole body is `expectTreeError(...)` is not reported.
>
> **`mutation`  high, part of Watch**
> Inverts a line, runs the suite, reports the suite that stayed green anyway.
> There is no arguing with a test that passed while the thing it guards was
> inverted.
>
> **`unrun-check`  medium**
> A `test:online` or `verify` script that no workflow invokes and no sibling
> script calls. It reads as coverage in the repository and cannot fail.
>
> **`lint-blindspot`  medium**
> Linters whose exclusions come from `.gitignore` instead of their own config.
> The exclusion is a side effect, so a path that becomes tracked silently enters
> the tool's scope, which can rewrite vendored bytes whose hash was the thing
> proving they came from upstream.

### Section 6. What it does not do

**Job.** Draw the boundary before the reader guesses wrong and feels misled.
This section wins more trust than any feature list.

**Direction.** Plain declaratives. No "yet" on things we are not building. "Not
yet" only where it is honestly next.

**Draft.**

> - It does not review your code. Logic bugs, naming, architecture: not our job
>   and not our claim.
> - It does not score coverage. Coverage tells you a line ran. That is a
>   different question.
> - It does not have an opinion about your style. No rules to configure, no
>   `.margynrc`.
> - It does not upload anything. There is no hosted scan, on purpose. See below.
> - It does not report anything it cannot reproduce. A finding without a runnable
>   reproduction is dropped rather than reported, so the count you see is smaller
>   than the count we could have printed.
> - It does not yet catch an assertion that cannot fail for a subtler reason than
>   having none, for example a fixture hash written by hand instead of generated.
>   We hit exactly that on 2026-08-01 and it is not automated.
> - It does not yet compare your local environment against your CI environment.

### Section 7. Your code never leaves your machine

**Job.** Kill the security objection before it forms. Turn a missing feature into
a decision.

**Direction.** State the absence first, then the reason. The reason is the copy.

**Draft.**

> **There is no hosted scan and there is not going to be one.**
>
> Margyn is a local CLI. It reads your working tree and your git history on the
> machine you run it on. Nothing is uploaded and there is no endpoint to upload
> to.
>
> A hosted scanner would need read access to your repository. We would then be
> holding your source and an OAuth token wide enough to fetch it, which is a
> security story we are not in a position to defend. So the scan stays on your
> side of the line.
>
> The same decision explains the licence. It is signed with Ed25519 and verified
> offline against a public key compiled into the CLI, so a paid check runs on a
> CI runner with no network access. A licence check that needs the network is a
> new way for a build to go red for a reason that has nothing to do with the
> code.

### Section 8. As a CI gate

**Job.** Show the reader where this lives in their week.

**Direction.** Real YAML. Real exit code semantics. One sentence on the refusal
behaviour, because it is a promise about their build.

**Draft.**

> Exit code is 1 when anything was found, so no wrapper is needed:
>
> ```yaml
> - run: npx margyn .
> ```
>
> `--json` gives you the same findings as an object if you would rather post them
> on the pull request than fail the job.
>
> **A billing problem never fails your build.** Ask for a paid check without a
> licence and Margyn tells you why, then runs the free scan in full and exits on
> its own findings:
>
> ```
> The mutation proof is part of Watch and it is locked: no licence found.
> Everything below is the free scan, which ran in full.
> ```
>
> Billing is not a reason to break someone's build.

### Section 9. False positives were treated as defects

**Job.** Answer the objection that decides whether a scanner gets adopted or
uninstalled, using numbers instead of a promise.

**Direction.** Show the bad first number. A tool that admits its first run was
mostly noise is more believable than one that claims it never was.

**Draft.**

> **The first run produced 132 findings on one repository. Nearly all of them were
> wrong.**
>
> A scanner that cries wolf is hollow itself, so those were treated as defects
> rather than tuning. Four fixes:
>
> - A `package.json` naming its own build output in `main` or `exports` is not
>   reading it. Only source code counts as a reader.
> - Matching on a bare basename reported every `dist/index.js` in a monorepo.
>   A match now needs a path suffix carrying at least one parent directory, which
>   is how the real defect was caught in the first place: `dist/abis/IPool.mjs`.
> - Dependency trees an install step fetches, like `forge install` into
>   `contracts/lib`, are ignored on purpose and recreated on demand. Detected by a
>   manifest of their own inside an untracked ancestor.
> - A sibling script calling a gate as `pnpm check:web` counts as running it.
>
> Same five repositories, after:
>
> | repository | before | after |
> | --- | --- | --- |
> | 1 | 132 | 0 |
> | 2 | 51 | 2 |
> | 3 | 20 | 2 |
> | 4 | 6 | 2 |
> | 5 | 12 | 0 |
>
> The eight that remain are true. An unrun `lint:fix` and biome inheriting its
> exclusions from `.gitignore`.

### Section 10. Pricing

**Job.** Say the price, say what is free forever, then make the paid boundary
sound like a cost rather than a hostage.

**Direction.** Published numbers, no "contact us", no tier table theatre for two
products. The reason the paid check is paid goes next to the price, because it is
the thing that makes the price feel fair.

**Draft.**

> **The four static checks are free and they stay free.**
> Zero dependencies, no account, no licence. `npx margyn /path/to/repo`.
>
> **Watch, 8.99 a month, adds the mutation proof.**
> It is the paid one because it is the one that costs real machine time. It edits
> your tree and runs your whole suite once per mutation, then restores the file
> in a `finally` block and on `SIGINT`, so an interrupted scan cannot leave a
> mutated tree behind. A red baseline aborts the run rather than producing
> results that would mean nothing.
>
> Licences are Ed25519-signed and verified offline, so this works on a CI runner
> with no network. No licence means a printed reason and a full free scan, never a
> failed build.
>
> Sign in and checkout run on Tiun.

**Note for the build.** Confirm the 8.99 figure against the live product record
before this ships. The subscription in the sandbox account is USD 8.99 a month
with no trial. Fix pack is unverified and must not appear on the page until its
checkout is confirmed working, because a button that 404s costs more than one
fewer product.

### Section 11. Where this actually is

**Job.** State the pre-launch position as a fact about scope, not a confession.
Full wording and rationale in part 3 below.

**Draft.** See part 3. It goes here, in a bordered box, under a plain heading.

### Section 12. Objections

**Job.** Answer the six questions the reader is already asking, in their words.

**Direction.** A short FAQ. Question phrased the way a skeptic would phrase it,
including the rude ones. Full list with answers in part 5 below.

### Section 13. Close

**Job.** One command, one line, nothing new.

**Draft.**

> ```
> npx margyn /path/to/repo
> ```
>
> If it finds nothing, you have learned something for free. If it finds
> something, every line comes with a command that proves it.

**No footer logo strip. No "trusted by". No star count. No user number.** Those
sections do not exist on this page and no placeholder version of them exists
either.

---

## 3. Pre-launch honesty: the exact wording

### What the comparables actually do

Fetched 2026-08-05. The pattern is consistent and none of them apologise.

**Ghostty** is the cleanest example. Its about page calls the moment "the initial
public release", says outright "I am not trying to claim that Ghostty is the best
(i.e. the fastest, most feature-rich or most native)", admits `libghostty` "is
not yet a stable API and has not been released as a standalone, stable library",
defers benchmarks to the future rather than showing weak ones and concedes that
"native" on Linux is a compromise because GTK4 is only the closest thing to a
standard toolkit. It never says sorry and it never asks for patience. Precision
does the work.

**Turso** labels maturity per component instead of per product. The embedded
engine and its SDKs carry Beta, Turso Cloud and the Cloud SDKs carry Production
Ready and sync conflict resolution carries Soon. One page, three different
truth levels, no global disclaimer.

**Bun** words compatibility as a target, not a state: it "aims for 100% Node.js
compatibility", native addon support is listed as "partial V8 C++ API", and
HTTP/2 and HTTP/3 ship labelled experimental. The claim and its limit occupy the
same sentence.

**Biome** publishes 97% Prettier compatibility and links its own known
limitations page next to the number. Publishing the number that is not 100 is
what makes the 97 believable.

**Zed** shows no benchmarks at all and gives architectural reasoning instead,
links a public roadmap and releases page in place of promises and labels its
unreleased product Early Access.

**Val Town** makes no status claim and instead links a Limits page and a status
page in the footer, so constraints are one click away rather than absent.

The shared move: replace a global apology with local precision. Say exactly what
is finished, exactly what is not, then make the boundary checkable.

### What we do not do

- No "beta" badge on the whole product. Four of the five checks are finished,
  tested and safe to run anywhere. Calling the product beta lies downward about
  those four.
- No launch date, no roadmap with quarters, no "coming soon" on anything we have
  not started.
- No waitlist. The thing works today and the command is on the page.
- No apology. Not "we are early, bear with us", not "we would love your
  feedback", not "this is a work in progress".
- No customer count, no download count, no star count, no logos. Not even framed
  as "join the first users". A number nobody has is not a number.

### The section, verbatim

This is the copy. It goes on the page as written, under this heading, after
pricing.

```
Where this actually is

Margyn went public this month. It has no customers yet and this page carries
no testimonials, no logos and no download count, because there are none to
report and a placeholder version of those would be the exact thing this tool
was built to catch.

What is finished: the four static checks. 26 tests, zero dependencies. Each
check has a test that plants one defect and proves the check fires, then plants
the fixed shape and proves it goes quiet. Both directions, because a checker
that cannot be shown to go quiet is as hollow as the checks it hunts.

What is measured: precision. Across five real repositories the first run
produced 132, 51, 20, 6 and 12 findings. After four fixes, the same five
produced 0, 2, 2, 2 and 0. The eight that remain are true. The full list of
what changed is above.

What is honest about the mutation proof: it is the strongest check here and the
newest. It runs your suite once per mutation, so it is slow. It is capped by
default at four mutations, so it under-reports on purpose. Raising the cap
finds more. On our own repository three of four survived.

What we have not built: an assertion that cannot fail for a subtler reason than
having none, for example a fixture hash written by hand instead of generated.
We hit exactly that case on 2026-08-01 and it is still a human's job. Local
versus CI environment divergence is not detected. Generating the fix, rather
than naming the defect, is not built.

What will not be built: a hosted scan. That is a decision, not a gap.

The check on all of this is that you do not have to believe any of it. Clone
the repository, run the suite, then run Margyn on Margyn.
```

### Why this wording turns the state into a signal

Six mechanisms, each doing a specific job.

1. **"Went public this month" replaces "pre-launch".** One states a date, the
   other asks for allowance. Ghostty's "the initial public release" does the same
   thing.
2. **The absence of proof is named before the reader notices it.** "No
   testimonials, no logos and no download count, because there are none to
   report" removes the reader's discovery. A gap you point at yourself stops being
   a gap and starts being a standard.
3. **The reason for the absence is the product's own thesis.** A fake trust strip
   is a check that does not check anything. Refusing to ship one is the tool
   applied to its own marketing, which is an argument no competitor can copy
   without also giving up their logo wall.
4. **Maturity is labelled per check, not per product**, which is Turso's move.
   Four checks finished, one new and capped. A reader can act on that. "Beta"
   tells them nothing they can act on.
5. **The under-reporting is disclosed with its direction.** "Capped by default at
   four, so it under-reports on purpose" is a limitation that makes every number
   on the page safer, because the reader now knows which way the error runs. This
   is Biome publishing 97 rather than claiming 100.
6. **The last line hands the verification away.** The section ends by telling the
   reader not to believe it and giving them the command. Nothing else on a
   pre-launch page buys as much.

### Sentences to keep out of the page

- "We are just getting started."
- "Built with love by a solo developer."
- "Help us shape the product."
- "Early access."
- "Join the first developers using Margyn."
- Anything with "we know it is not perfect".

Each one asks the reader for something. The section above asks for nothing and
tells them where the edges are, which is the register this audience reads as
competence.

---

## 4. Legitimate trust signals available to us

Concrete, available now or available with named work. Each one is a thing a
stranger can check without taking our word for anything.

**Available today, no work needed.**

1. **The self-audit.** Three surviving mutants in our own suite, one in the
   mutation checker. Reproducible by anyone with the repo. This is the strongest
   signal we have and it should appear above the fold, not in a footnote.
2. **Runnable reproductions in every finding.** The product's rule is that a
   finding without a reproduction is dropped. That is a falsifiable promise, and
   the output on the page shows the commands so a reader can run them against
   their own tree.
3. **The precision table, with the bad first number.** 132 to 0 is only credible
   because we print the 132. Publishing the before column is a trust signal in a
   way publishing the after column alone never is.
4. **Zero dependencies, stated and checkable.** `package.json` has no runtime
   dependencies. One glance at the file settles it. It also removes the supply
   chain objection without a paragraph about supply chains.
5. **Node 22 and git, named exactly.** A specific version requirement reads as
   someone who tested it. "Works everywhere" reads as someone who did not.
6. **The dated incident.** 2026-08-01, `nishuzumi/moss` PR #157, `.gitignore:2`,
   eight files, 26 green locally, 2 failing in CI, fixed at `0c743c2`. Every one
   of those is checkable in a public repository.
7. **The architectural refusal.** No hosted scan endpoint, with the reason stated.
   A missing feature explained by a threat model we will not accept is a
   credential. Ghostty does the same thing with its Linux "native" concession.
8. **Offline licence verification.** Ed25519, public key compiled into the CLI,
   private key never in the repository. The tests carry real signatures from the
   production signer and prove a flipped byte, a swapped payload, an expired
   licence and a wrong-product licence are all refused with the reason named.
9. **The refusal that does not fail the build.** A paid product whose billing
   layer cannot break a customer's CI is a design decision the reader can verify
   in ten seconds with an unset environment variable.
10. **The boundary section.** "What it does not do" is a trust signal in its own
    right and it costs nothing.
11. **Both test directions.** Every check test proves the check fires on a planted
    defect and goes quiet on the fixed shape. Most tools only claim the first
    half.
12. **The named unfinished work.** The hand-written fixture hash case, local
    versus CI divergence, fix generation. Naming three specific things we cannot
    do is more convincing than any list of things we can.

**Available with named work, worth doing before launch.**

13. **The public repository.** Everything above that says "clone it and check"
    depends on the repo being public on the day the page ships. This is a hard
    dependency, not a nice-to-have. See the blockers list in the appendix.
14. **The published npm package.** `npx margyn` has to actually resolve. Right now
    it does not. Same blocker list.
15. **A CI badge on our own repository.** Our own suite going green in public CI,
    on every commit, on a repo anyone can read. Cheap and it is evidence rather
    than a claim.
16. **A signed release.** Tags signed, checksums published. Small effort. It
    matters to exactly the audience that would run our binary over their source
    tree.
17. **A CHANGELOG with real dates.** Version history is the pre-launch substitute
    for a customer list. It shows the thing is being worked on by someone who
    ships.
18. **The scan output for a well-known public repository, published as-is.** Pick
    one, run it, publish the whole output including the empty result if it is
    empty. Zero findings on a famous repo is a stronger precision claim than a
    table and it costs one command.

**Explicitly refused.**

- Testimonials, invented or solicited-from-friends.
- Company logos of any kind, including "as seen on" and including our own stack's
  logos arranged to look like customers.
- Download counts, user counts, star counts, GitHub follower counts.
- Ratings, review stars, badge farms.
- "Trusted by", "loved by", "used in production at".
- A number with an asterisk explaining what it really counts.

---

## 5. The objection list

Phrased as the skeptic actually thinks it, including the dismissive ones. Each
answer is copy that can go on the page as written, in the FAQ or in the section
noted.

**1. "This is a linter with a marketing angle."**

> It never looks at your logic. Every finding is about the verification layer: a
> file git does not have, a test body with no assertion, a script no workflow
> calls, a linter scoped by the wrong file, a line you can invert with the suite
> still green. A linter reads the code you wrote. Margyn reads whether anything
> would notice if that code were wrong.

*Where.* Section 6 and first in the FAQ. This is the fastest way to dismiss us,
so it gets answered before anything else.

**2. "Mutation testing exists. Stryker, PIT, mutmut."**

> Those are mutation testing frameworks and they are better at mutation testing
> than we are. Mutation is one of five checks here and it is the paid one. The
> other four are static, run in under a second and catch things a mutation
> framework structurally cannot: a file that is not in the commit, a gate nobody
> invokes, a linter whose scope comes from `.gitignore`. If mutation testing is
> the only thing you want, use Stryker.

*Where.* FAQ. Naming the competitor and conceding the point is the only answer
that survives contact with a reader who already uses one.

**3. "I am not running an unknown binary over my source tree."**

> Reasonable. It is one directory of ES modules with no runtime dependencies, so
> reading it before you run it takes minutes rather than an afternoon. It shells
> out to `git` and, only under `--mutate`, to your own test command. It opens no
> network connection at any point, including for the licence. The one thing it
> writes is the mutated file during a mutation run, restored in a `finally` block
> and on `SIGINT`.

*Where.* Section 7. Answer with the audit surface, not with reassurance.

**4. "It edits my files? No."**

> Only under `--mutate` and only one file at a time. The baseline must pass
> before anything is touched or the run aborts with the reason, because a
> mutation result means nothing against a red suite. Each file is restored in a
> `finally` block and on `SIGINT`. If you would rather it never wrote to your
> tree, do not pass `--mutate` and the other four checks still run.

*Where.* Section 10, next to the price, since the two facts belong together.

**5. "How many false positives am I about to eat?"**

> First run across five real repositories: 132, 51, 20, 6 and 12. Nearly all of
> the 132 were wrong. Four fixes later the same five gave 0, 2, 2, 2 and 0, and
> the eight that remain are true. The fixes are listed so you can judge whether
> they would hold on your repo. A finding with no runnable reproduction is
> dropped rather than reported, so the count you see is smaller than the count we
> could have printed.

*Where.* Section 9. This objection decides adoption, so it gets its own section
rather than an FAQ line.

**6. "Who else uses this?"**

> Nobody yet. It went public this month and there are no customers, so there is
> nothing on this page pretending otherwise. What there is instead: run it on
> our own repository and it reports three of our own tests as watching nothing,
> one of them inside the mutation checker itself.

*Where.* Section 11. Answer the question in its own words, then redirect to the
only evidence that is actually ours.

**7. "Solo pre-launch project. It will be abandoned in three months."**

> Fair risk. Three things reduce it. It is MIT licensed with no runtime
> dependencies, so the whole thing is readable and forkable. It is one CLI, not a
> platform, so there is no service to go dark and nothing to migrate off. The
> four static checks are free permanently, so a lapsed subscription costs you the
> mutation proof and nothing else.

*Where.* FAQ. Do not argue the premise. Reduce the blast radius.

**8. "Our suite is fine. Coverage is 90%."**

> Coverage tells you a line ran while a test was in progress. It does not tell
> you that anything checked the result. A test that calls your function and
> asserts nothing produces coverage. Invert a line and see whether the suite
> notices. That is a different measurement. It is also the one that predicts
> whether a bug reaches production.

*Where.* Section 3 or the FAQ. Never phrased as "your coverage is a lie".

**9. "Green locally and red in CI is a CI config problem, not a product."**

> Sometimes. On 2026-08-01 it was eight vendored files under a path containing
> `dist/`, which the root `.gitignore` excludes at any depth. Nothing was
> misconfigured. Git did exactly what it was told and the files were never in the
> commit, while sitting on disk where every local run could read them. No CI
> setting would have caught that and no diff reviewer could have seen it. The
> check is two facts about one path: absent from `HEAD`, present on disk.

*Where.* Section 4.

**10. "What happens when your licence server is down or you go out of business?"**

> Nothing happens. The licence is verified offline against a public key compiled
> into the CLI, so a scan never contacts us. If our server is down you cannot buy
> or reissue a licence and the one on your disk keeps working until its expiry.
> If no licence is found at all, Margyn prints the reason and runs the free scan
> in full. It never exits non-zero for a billing reason.

*Where.* Section 7 and section 10.

**11. "Why is the good check the paid one?"**

> Because it is the one that costs real machine time. The static checks read your
> tree once. The mutation proof runs your entire suite once per mutation. That is
> the honest line between the two. The free four are not crippled versions of
> anything.

*Where.* Section 10.

**12. "What does this cost and where is the pricing page?"**

> Watch is 8.99 a month and it adds the mutation proof. The four static checks
> are free and stay free. The number is on this page, not behind a form.

*Where.* Section 10. Confirm the figure against the live product record before
publishing.

**13. "I do not want an account to try it."**

> You do not need one. `npx margyn /path/to/repo` needs no sign-in, no key and no
> network. An account exists only to buy the mutation proof and collect a licence.

*Where.* Hero microcopy and the FAQ.

**14. "It found nothing on my repo, so it does nothing."**

> Then your verification layer held up on the five things this tool knows how to
> test, which is worth knowing and cost you one command. It is a narrow tool by
> design. It has five checks, it says so and it does not invent a sixth to make a
> report look busy.

*Where.* FAQ. This is a real outcome for a good repo and the page should have an
answer for it that is not defensive.

**15. "Is my code being uploaded?"**

> No and there is nowhere for it to go. Margyn is a local CLI and there is no
> hosted scan endpoint, on purpose. A hosted scanner would need repo access we
> are not in a position to defend.

*Where.* Section 7. Also worth a single line under the hero command, because a
reader who has this fear will not scroll to section 7 to have it answered.

---

## Appendix A. Every number on this page and how it was verified

Run 2026-08-05 against a clean clone of `master` at `/tmp/margyn-mut`.

| Claim in the copy | Verified how | Result |
| --- | --- | --- |
| 26 tests passing | `npm test` | 26 pass, 0 fail |
| 3 surviving mutants in our own suite | `mutationProof(root)` at the default cap of 4 | 3 findings |
| one of them is the mutation checker | same run | `src/checks/mutation.mjs`, `return true -> false` |
| the other two | same run | `src/checks/ignored-source.mjs` `return true -> false`, `bin/bundle-static.mjs` `=== -> !==` |
| raising the cap finds more | same function at `max: 12` | 9 findings |
| Margyn's free scan on Margyn is clean | `node src/cli.mjs .` | "Nothing hollow found", exit 0 |
| refusal does not fail the build | `MARGYN_HOME=/tmp/no-such-home node src/cli.mjs . --mutate` | prints "no licence found", runs free scan, exit 0 |
| zero runtime dependencies | `package.json` | `devDependencies` only, wrangler |
| Node 22 | `engines` field and `node -v` | `>=22`, running v22.22.2 |
| exit 1 on findings | `src/cli.mjs` last line | `process.exitCode = findings.length > 0 ? 1 : 0` |

Two claims from the brief were **not** re-verified today and must be before they
go on a public page:

- The 132 / 51 / 20 / 6 / 12 to 0 / 2 / 2 / 2 / 0 precision run. Sourced from the
  README, not re-run here. The five repositories are not named in the README, so
  the run cannot be reproduced from the repo alone. Either re-run it and record
  the repositories and commits or drop the table and keep the prose.
- The 8.99 price. The live product record has one subscription at USD 8.99 a
  month with no trial, per the lane notes. Confirm in the dashboard before it is
  printed as a price.

Two stale numbers exist in the repo and will contradict the page if anyone reads
them:

- `README.md` says "Twenty-one tests". The suite is 26.
- `RESUME.md` says "10 passing". The suite is 26.

Fix both before the repo goes public, because a reader who checks our numbers and
finds two wrong ones stops checking the rest.

## Appendix B. Blockers this copy depends on

The page as drafted repeatedly tells the reader to clone the repo and run one
command. Three things have to be true on the day it ships or the copy is writing
cheques the product cannot cash.

1. **`npx margyn` has to resolve.** `registry.npmjs.org/margyn` returns 404 today.
   Until the package is published, every `npx margyn` on the page is a dead
   command. Interim wording, if publishing slips: `node src/cli.mjs
   /path/to/repo` with the clone line above it. Less good, still true.
2. **The repository has to be public.** `zkasuran/margyn` is private. Sections 3,
   9 and 11 all end by telling the reader to verify against it. A private repo
   turns the strongest part of this page into a 404.
3. **`https://margyn.xyz` has to serve over TLS.** Plain HTTP answers 200 today
   and HTTPS does not connect at all. The CLI already prints
   `https://margyn.xyz` in its refusal message, so this is broken in the product
   and not only on the page.

## Appendix C. House style check on this file

- No em dashes. Checked with a grep over the whole file.
- No Oxford comma and no comma before "and" or "or" in a list.
- Banned words absent: robust, seamless, leverage, delve, "it's worth noting",
  "in conclusion".
- One caveat for whoever edits this: the drafts quote real terminal output and
  real source comments. Those are quotations and must not be restyled. If a
  quoted line ever contains a banned construction, change the source or drop the
  quote. Do not silently edit output that is presented as real.

## Appendix D. Sources read for the pre-launch honesty research

Fetched 2026-08-05.

- [Ghostty about page](https://ghostty.org/docs/about) and [ghostty.org](https://ghostty.org/)
- [Turso](https://turso.tech/)
- [Bun](https://bun.com/)
- [Biome](https://biomejs.dev/)
- [Zed](https://zed.dev/)
- [Val Town](https://val.town/)
- [Developer-first landing pages that convert, daily.dev](https://business.daily.dev/resources/create-developer-first-landing-pages-convert/)
- [B2B developer marketing, daily.dev](https://business.daily.dev/resources/b2b-developer-marketing-selling-to-engineers/)
- [Technical marketing to developers, daily.dev](https://business.daily.dev/resources/technical-marketing-to-developers-engineers-buyers/)
- [Why developer trust has become the new marketing KPI, daily.dev](https://business.daily.dev/resources/developer-trust-marketing-kpi/)
- [LaunchKit devtool landing page template, Evil Martians](https://launchkit.evilmartians.io/)

Web archive captures of the 2022 and 2023 versions of these pages could not be
fetched from this environment, so the comparable analysis is based on their
current pages plus what each one still says about its own unfinished parts. That
is a real limitation of this research. The pattern held across all six, which is
why it is reported as a pattern rather than as one company's trick.
