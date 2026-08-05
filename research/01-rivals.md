# Margyn: the competitive landscape

Researched 2026-08-05. Every headline below is quoted verbatim from the live page
on that date, punctuation included, so a few carry em dashes that belong to the
vendor and not to us. Every price is the number the vendor published, with the
unit they bill on. URLs are listed at the bottom and each one was fetched.

Eighteen rivals from the brief plus two nobody put on the list. Those last two
matter most, so read that section before the gap.

## The table

| Rival | Verbatim headline | Pricing and unit | Weakness a sharper rival attacks |
| --- | --- | --- | --- |
| Stryker Mutator | "Stryker Mutator" / "Test your tests with mutation testing." | Free, Apache 2.0. Dashboard "Free to use for open source" | `break` threshold defaults to `null`, so out of the box the leading mutation tool cannot fail a build. Output is a score, never a proof |
| PIT / pitest | "Real world mutation testing" | Free OSS. Paid extension sold separately as arcmutate | JVM only. Sells itself as "gold standard test coverage", so it is still competing inside the coverage frame |
| arcmutate | "ArcMutate — Enterprise Mutation Testing for Java, Kotlin & Android" | Base "$8 per user/month", Pro "$12 per user/month", free for open source | Per seat pricing on a build-time analysis. Java, Kotlin and Android only. Buys you speed on PiTest, not a different claim |
| Mutahunter | "Open-Source Language Agnostic LLM-based Mutation Testing" | Free, AGPL-3.0. Run cost shown as "💰 Total Cost: $0.00060 USD 💰" | Last push 2025-04-17, 299 stars. Needs `OPENAI_API_KEY`, so the audit ships your source to a model vendor and cannot run air-gapped |
| Codecov | "Codecov: More than just code coverage." | Developer $0, Team "$5 per user/month", Pro "$12 per user/month", Enterprise custom. Per user per month | Its own blog concedes "it is too easy to write high-coverage tests that don't deliver value". The product still centres the percentage |
| SonarQube Cloud | "Automated code quality and security reviews for high velocity software development" | Free to 50k private LOC. Team "Starts at $34monthly" (FAQ says $32) up to 1.9M LOC. Enterprise custom. Per LOC | Reviews code, not the verification layer. Coverage is one tile on a dashboard. A "Clear go/no-go Sonar Quality Gate" is a threshold, so it is negotiable |
| Codacy | "Code Quality & Security for AI-Assisted Engineering" | Developer $0, Team from "$18" per dev/mth yearly or "$21" monthly, Business custom. Seat per git contributor to a private repo | Sells "Test coverage automation" as one of nine cards. Nothing audits whether a test asserts. Homepage was serving Lorem ipsum and a staging link on the day we fetched it |
| CodeRabbit | "Cut code review time & bugs in half, instantly." | Free $0/mo/user, Pro "$24/mo/user", Pro Plus "$48/mo/user" billed annually, Enterprise custom. Slack agent "$0.50 per agent minute" | Reviews the diff. A test that asserts nothing is valid code and passes review. "Unit test generation" adds tests, it does not check them |
| Snyk | "Unleash AI Innovators — Securely" | Free $0, Team "$25" per month, Ignite "$1,260" per year, Enterprise custom. Per contributing developer, 90 day window | Security, not verification. Nothing it ships tells you a test is hollow |
| Semgrep | "Code Security for Builders" | Free $0, Teams "$30 / month per contributor" for Code or Supply Chain, Secrets "$15/month/contributor", Enterprise custom. Contributor over 90 days | Rule matching over source. Its own pitch is "Make Zero False Positives a Reality", which concedes noise is the category problem and leaves the number unspoken |
| Qodo | "Govern code at the speed AI writes it" | Pro Team "$30", credits at "$.012/credit, pooled across the team", 2,500 credits is "~18 Reviews/Mo". Credits "expire at the end of each monthly cycle" | Metered credits on an audit is hostile: the cheapest action is to scan less. Expiring credits punish the CI gate use case |
| Diffblue | "Automated regression unit test generation at scale" | "Starting at" "$1500" for "5,000" net new lines, "$0.30 / line". Enterprise custom | Generates tests, so it is the thing Margyn audits. Java and Python only. Charging per line of coverage still sells coverage |
| Graphite | "The next generation of code review." | Hobby free, Starter "$20" per user/month annual, Team "$40" per user/month annual, Enterprise custom | Review workflow and merge queue. No test-quality claim at all |
| Trunk.io | "Keep CI Green" / "Eliminate flaky tests and merge bottlenecks" | Free "$0 / committer/month" to 5 committers, Team also printed "$0 / committer/month" with the real rate absent, Enterprise custom. Committer over 30 days | Owns flaky, ignores hollow. A test that always passes is never flaky, so quarantining makes it invisible rather than visible |
| Wallaby | "Test Runner with Instant Actionable Results" | Per seat perpetual licence plus 1 year of updates. No figure published, the store renders "Calculating". OSS free, students 30% off, startups 40% off, volume 5% at 10-19 and 10% at 20+ | An IDE feedback loop, not a gate. Shows "Inline Code Coverage", so it inherits the coverage frame. A price you cannot read is a price you cannot compare |
| CloudBees Smart Tests (was Launchable) | "Stop waiting for tests that don't matter." | No pricing published anywhere on the page | Closest headline in the field to ours, then it means "run fewer tests", not "your tests are broken". Selects tests, never judges them |
| Sourcery | "Code review for the AI era" | Open Source free, Pro "$12" "per seat / month*", Team "$24" per seat/month, Enterprise custom. 20% off annual | Another AI reviewer. The asterisk on both prices is never explained on the page |
| GitHub Code Quality | "GitHub Code Quality" | "$10 USD per committer / month plus usage-based billing for AI features and Actions minutes". Public repos "$0 per committer" | GA on 2026-07-20 and it resets the floor on generic code quality. Restricted to Enterprise Cloud and Team. Findings, fixes and a backlog metric, no verification-layer check |
| kingdomwatch.dev | "Your suite is green. That is not proof anything is being tested." | Scan "$0", one repo per team. Report is "One fixed price, agreed up front" | Nearest positioning rival and it disowns the word: "a structural proxy, not proof". Static only, human writes the report, so it does not scale and cannot gate |
| provally.io | "Stop triaging SAST noise. Prove what is actually exploitable." | Starter free, Pro "$100" (promo $0), Business "$3,000", Enterprise custom | Proves exploitability for SAST findings, not test quality. Hosted, so "deletion of source after analysis" means it had your source |

## The mutation-testing tools, up close

This is our paid check, so their framing sets the price ceiling and the language
we have to beat.

### Stryker Mutator

Homepage order, top to bottom:

1. Announcement bar for a FOSDEM 2024 conference talk, "Who's testing the tests?
   Mutation testing with StrykerJS"
2. Nav: "For JavaScript", "For C#", "For Scala", "An example", "Playground",
   "Dashboard"
3. Hero: "Stryker Mutator" / "Test your tests with mutation testing.", the
   Strykerman mascot, CTAs "Introduction" and "Playground"
4. "Getting started with Stryker": "JavaScript and friends", "C#", "Scala"
5. "Features": "Mutations", "Speed", "Test runner agnostic", "Open source",
   "Multilingual", "Clever reports"
6. Footer: "Docs", "Community", "More", then "Powered by Info Support"

The whole page is a technique, not an outcome. There is no problem statement, no
buyer, no price and no proof. The value is a percentage: mutation score is
defined as `detected / valid * 100`, "The total percentage of mutants that were
detected. The higher, the better!" Thresholds default to `high: 80`, `low: 60`
and, critically, `break: null`, documented as "Set `break` to `null` (default)
to never let your build fail." The market-leading mutation tool ships unable to
fail a build. 6,195,044 downloads of `@stryker-mutator/core` in the month to
2026-08-03, 2,986 stars, so reach is not the problem. Framing is.

Its own docs also hedge the finding. A survivor means "there is probably a test
missing". Mutation testing "might indicate your tests do not sufficiently
cover the code". Probably and might. Margyn says a line was inverted, the suite
was run and it stayed green.

### PIT / pitest

Homepage order:

1. "Real world mutation testing"
2. "What is mutation testing?", dek "How it works in 51 words"
3. "What?", dek "Really it is quite simple"
4. "Why?", dek "What's wrong with line coverage?"
5. "Why PIT?"
6. "How to use it?"
7. "Pro Version"
8. "Success stories"

Four of the eight sections explain the technique before anything is claimed.
PIT makes the sharpest anti-coverage argument in the field: coverage "does not
check that your tests are actually able to detect faults in the executed code",
and it is only good for flagging code that is "definitely not tested". Then it
undoes it by positioning itself as "gold standard test coverage" and the
"gold standard against which all other types of coverage are measured". It wins
the argument against coverage and then re-enters the coverage frame to sell.
1,839 stars, still active, last push 2026-08-04.

### arcmutate

The commercial arm, from PiTest's own author. Page order: "Are Your Tests
Working?", "Enterprise-Grade Features", "Industry Use Cases", "Built by the
Creators of PiTest", "Testimonials", "Pricing", "Links".

Only rival in the field with a real proof-shaped claim: "Research at Google
found that mutation testing could have caught nearly 3 out of 4 high-priority
production bugs before they shipped." That is a borrowed statistic about the
technique, not evidence about your repo. Pricing is "Base — $8 per user/month"
and "Pro — $12 per user/month", free for open source. Note what the paid tier
sells: "Incremental Analysis — Only analyze new or changed code. 10x faster
analysis", git integration, Kotlin, subsumption. Speed and reach, not a
stronger claim. Verticals are named: automotive with "ISO 26262 compliance and
ASIL D safety integrity", banking, healthcare.

### Mutahunter

README order: title, "Open-Source Language Agnostic LLM-based Mutation
Testing", three badges, "Getting Started with Mutation Testing", "Examples".
That is the whole document. No problem statement, no pricing, no positioning.

Output is a score: "57.14% mutation coverage" over 7 mutants, 4 killed, 3
survived, 1 compile error, 29 seconds and "💰 Total Cost: $0.00060 USD 💰".
299 stars, AGPL-3.0, last push 2025-04-17, so roughly sixteen months stale.
Setup exports `OPENAI_API_KEY` with the comment "Work with GPT-4o on your
repo". An LLM-based mutation tool sends your source to a model vendor, cannot
run on an air-gapped runner and produces a different answer on two runs of the
same commit. Margyn is deterministic, zero dependency and never leaves the
machine. Say that next to this.

## The coverage incumbents

### Codecov

Homepage order:

1. Banner: "Harness + Codecov - Code coverage for the AI era"
2. Hero: "Codecov: More than just code coverage." Subhead: "Codecov doesn't just
   measure code coverage—it helps you improve code quality at every step."
3. Logo strip: SpotHero, Snowflake, Washington Post, Uber, Betterment, Ledger
4. "Prevent issues in production | Spend less time debugging | Improve developer
   workflow", holding "Ship better code without slowing down", "Ditch flaky test
   frustration", "Keep untested code out of production", "Keep JavaScript
   Bundles in Check"
5. "Code Quality for Any Tech Stack": "Languages", "CI Platforms", "Code Hosts"
6. Testimonial, Axle Health, "40% of our engineering capacity was going to
   fixing things that were broken."
7. "Ready to get started?"
8. Footer

Read the headline again. "More than just code coverage" is a company admitting
its own category is not enough, then adding AI test generation and flaky
detection rather than auditing anything. Its blog goes further and hands us the
argument: "it is too easy to write high-coverage tests that don't deliver
value", developers "write worthless tests to boost coverage". It cites
Goodhart's law, "When a measure becomes a target, it ceases to be a good
measure." Codecov has published the case against Codecov. Nobody sells the
product that follows from it.

Pricing is per user per month, where a user is "anyone who authors a pull
request or merge request on a private repo with Codecov coverage": $0, "$5 per
user/month" (also printed "$4 per user/month" annually) capped at 10 users,
"$12 per user/month", custom. Free private tier is metered at "250" uploads a
month. Team tier "shows Patch ONLY coverage."

### SonarQube Cloud

Homepage order:

1. Hero: "Automated code quality and security reviews for high velocity software
   development", subhead "SonarQube Cloud verifies AI-generated and
   developer-written code in real time"
2. "Trusted by over 7M developers and 75% of the Fortune 100"
3. "What is SonarQube Cloud?" into "The independent trust and verification layer
   for AI code", eight cards ending in "Measure and track test coverage of your
   code"
4. "AI Code Quality" into "Assurance and accountability for AI-generated code"
5. "SonarQube Cloud CI/CD integrations"
6. "Security and secrets detection"
7. "Open source projects"
8. "Languages"
9. "What Sonar users are saying"
10. Gartner and G2 analyst badges
11. "Your codebase deserves better. Start in minutes."
12. "Frequently asked questions", 12 entries
13. Newsletter
14. Footer

They already claim the words "trust and verification layer". They mean verifying
the code. Margyn verifies the checks. That distinction has to be in our first
sentence, because Sonar has 7M developers and the phrase is theirs by volume.

Pricing is per private line of code, not per seat: free to 50k LOC, Team "Starts
at $34monthly" on the card while the FAQ says "starts at $32 monthly for
analysis of up to 100k LOC" with increments "up to 1.9M LOC", Enterprise custom.
Analysis frequency is free, only the ceiling is billed.

### GitHub Code Quality

Page order: hero "GitHub Code Quality" with three stats (67% of findings ship
with an AI-generated fix, 70% of findings on complex PRs fixed same day, 50%
smaller backlogs in six months), then "Ship more code, not more backlog",
"Everything you need to enforce quality", "Bring Code Quality to your
organization", FAQ, footer.

Generally available 2026-07-20 at "$10 USD per committer / month plus
usage-based billing", public repos at "$0 per committer", limited to Enterprise
Cloud and Team. This is the new floor. Anything that reads as generic code
quality now competes with a $10 line item already inside the buyer's bill. Being
a test-suite auditor rather than a code-quality tool is not a nicety here, it is
survival.

## The AI reviewers

Four products, one claim. None of them touches our surface. Verbatim:

- CodeRabbit: "Cut code review time & bugs in half, instantly." Order: hero,
  "The leader in AI code reviews", "Trusted by 15,000+ customers", "Code reviews
  were hard before. Now, they feel impossible.", "Faster reviews + better code.",
  "The only tool that reviews everywhere you work.", "Industry-leading context.",
  "Code reviews that learn from you.", "Ship faster with pre-merge checks &
  finishing touches.", "We take security seriously.", "Why teams prefer
  CodeRabbit", footer.
- Qodo: "Govern code at the speed AI writes it". Seventeen sections, ending
  "Questions?" and a footer. Credits at "$.012/credit, pooled across the team",
  and they "expire at the end of each monthly cycle".
- Sourcery: "Code review for the AI era". Order: hero, "Trusted by 300,000+
  developers", "The Problem with AI-Driven Development", "Code Review for the AI
  Era", "Review Everywhere You Work", "Enterprise Security", "Seamless
  Integration", "Try Sourcery Today", footer.
- Graphite: "The next generation of code review." Order: announcement bar, hero,
  "Trusted by leading engineering teams at", product video tabs, customer
  carousel, five feature highlights, "Everything you need to ship faster",
  "Developer infrastructure built for your team", closing CTA, footer.

All four review the diff. A test that asserts nothing is syntactically perfect,
passes lint, passes type-check and passes AI review, because there is nothing
wrong with the code. The defect is the absence of an assertion. Absence is
what a diff reviewer cannot see. That is the same shape as `ignored-source`,
where the moss PR diff was innocent and the missing file was the bug. Margyn's
category line writes itself: reviewers read what is there, Margyn reads what is
missing.

CodeRabbit and Codecov both sell unit test generation. Diffblue sells only that,
at "$0.30 / line" of net new coverage. Every one of them manufactures the exact
artefact Margyn audits. That is a partnership story, not a fight.

## The CI reliability tools

Trunk.io: "Keep CI Green" / "Eliminate flaky tests and merge bottlenecks".
Order: hero, "The CI reliability platform trusted by teams that ship fast",
"Detect, quarantine, and eliminate flaky tests", "Upgrade Your GitHub Merge
Queue", "How Trunk improves developer productivity", closing CTA. Free and Team
both print "$0 / committer/month", which means the Team rate is simply not on
the page. A committer is "a non-bot user who committed to a Trunk-enabled
private repo within the prior 30 days".

Trunk owns the failure mode where a test passes sometimes. Margyn owns the
failure mode where a test always passes. These are opposite defects and only one
of them has a vendor. Worse for Trunk: quarantining a flaky test converts an
honest red into a silent green, which manufactures Margyn findings.

CloudBees Smart Tests, formerly Launchable: "Stop waiting for tests that don't
matter." Order: hero, "Faster feedback. Fewer reruns. Less CI waste.", "Still
testing the old way?", "Stop paying for slow, noisy testing", customer impact,
"Trusted by enterprises, loved by engineering teams", "Why CloudBees Smart
Tests", resources, closing CTA. No pricing published.

That headline is the closest anyone comes to ours and it means something else
entirely. "Tests that don't matter" here means tests unrelated to this diff, so
skip them. Ours means tests that cannot fail, so fix them. If we ever use that
phrasing we hand them the association, so we will not.

## The two nobody listed

These are the real competitors for the positioning and neither was on the
research list.

### kingdomwatch.dev

Hero, verbatim: "Your suite is green. That is not proof anything is being
tested." Subhead: "Green only proves the tests that exist passed." Then "It says
nothing about the routes no test visits, the specs that assert nothing, the
checks that quietly vanished." And: "It's deterministic. No AI grading AI."

Section order: "The Trap", "The Receipts", "How It Works", "A smoke detector,
not fireproofing.", "Free Repo Scan", "CI Gate Roadmap", "The Toolbag", "Bring
Us Your Repo".

Someone is already in our exact frame, with our exact three failure modes, and
they got there first. Read the overlap honestly: assertion-free specs, CI escape
hatches ("skipped globs, continue-on-error, zeroed coverage gates", which is
`unrun-check` under another name), a flake grade, a suite-smell grade, and
receipts. They quantify: "roughly 35% of migration files (47 of 135) demonstrably
dropped an assertion", "~74% dropped or weakened one", "zero suites turned red".

Three openings, all decisive.

1. **They disown the word.** They call themselves "a structural proxy, not
   proof", say a clean result means only "no obvious gap detected", then warn that a
   flagged test may be covered elsewhere. Every claim is hedged because they
   never execute anything. Margyn executes: mutation inverts a line, runs the
   real suite and reports what stayed green. That is not a proxy. Proof is
   available to us and it is not available to them.
2. **A human writes the report.** Fixed price, agreed up front, one repo per
   team. It does not scale and it cannot run on every pull request.
3. **"CI Gate Roadmap" is unbuilt.** Margyn exits 1 today. They are planning the
   thing we ship.

### provally.io

"AutoProof: The Proof Layer for SAST Findings" with the hero "Stop triaging SAST
noise. Prove what is actually exploitable." Pricing: Starter free, Pro "$100"
struck to $0 on promo, Business "$3,000", Enterprise custom, metered in "SAST
checks" and "patch verifications".

This is the only vendor in the whole sweep that sells proof as a product and it
proves the wrong thing: exploitability of a security finding, not hollowness of
a check. Read what they got right. The tagline "Pay for proof, not access" is a
pricing philosophy. The report is an artefact list: original finding,
verdict, redacted PoC, execution evidence, code path, suggested fix, retest
result. That is exactly the shape of a Margyn finding and it validates
per-proof pricing as something the market accepts.

Their weakness is the one Margyn was built to avoid. It is hosted, so source
leaves the building. "Deletion of source after analysis" is a promise about
data they already took. Margyn has no `/api/scan` and never will.

## Adjacent tools that already do one of our checks for free

Every check needs to survive this comparison, because a buyer will find these.

- **`eslint-plugin-jest/expect-expect`**: "Enforce assertion to be made in a
  test body." It is in the `recommended` config, at warning severity. So the
  narrow version of `no-assertion` is free, on by default and already installed
  in a large share of JS repos. Our differentiators are real and must be stated:
  it warns rather than fails, it is Jest-shaped and it does not follow an
  assertion through a local helper. Margyn does, which is why
  `expectTreeError(...)` is not reported.
- **Knip**: "Declutter your JavaScript & TypeScript projects." Reports unused
  files, dependencies, devDependencies, exports, types, enum members, namespace
  members. It has 182 plugins. It does not report unreferenced package.json
  scripts, so `unrun-check` is not covered, but the neighbourhood is occupied
  and the comparison will be drawn.
- **`@intentsolutions/audit-harness`**, Apache-2.0, 5,261 downloads last month:
  "Deterministic test-enforcement harness — escape-scan, hash-pinning, CRAP,
  architecture checks, bias detection, Gherkin lint." Keywords include
  `test-audit`, `escape-scan`, `mutation-testing`, `ai-containment`. Closest
  free CLI to Margyn's shape and it is honest about limits: "the escape-scan is
  a *heuristic net* over the staged diff", "Deliberately not claiming
  bulletproof." It is a Claude Code skill companion, not a product and it has
  no hosted or paid path.
- **`tautest`**, MIT, 70 downloads last month: "PR-focused mutation testing CLI
  powered by StrykerJS". It states "Tautest is not a mutation engine." Proof
  that PR-scoped mutation is an obvious idea and that being a Stryker wrapper
  does not earn traction.

## The gap

Twenty products. Line them up by what they claim about your verification layer
and the empty seat is obvious.

**Nobody sells proof about tests.** One vendor in the sweep sells proof at all,
provally.io, which proves exploitability of a security finding. Everyone else
sells one of four things: a percentage (Codecov, Sonar, Stryker, PIT,
Mutahunter), a queue of findings (Codacy, Semgrep, Snyk, GitHub Code Quality), a
faster review (CodeRabbit, Qodo, Sourcery, Graphite) or more tests (Diffblue,
Qodo, Codecov). Not one of them ends a sentence with "and here is the command
that proves it."

**Even the tools built to test tests will not commit.** Stryker: a survivor
means "there is probably a test missing". Mutation testing "might indicate"
insufficient coverage. Probably, might. It then defaults `break` to `null`, so
the tool ships unable to fail a build. PIT wins the argument against coverage
("does not check that your tests are actually able to detect faults") and then
sells itself as "gold standard test coverage", back inside the frame it just
demolished. arcmutate's strongest claim is a Google statistic about the
technique, not a fact about your repo. Mutation testing has spent twenty years
producing a number when it could have been producing an exhibit.

**The one vendor in our frame refuses the word.** kingdomwatch.dev opens with
"Your suite is green. That is not proof anything is being tested." and then says
it is "a structural proxy, not proof". They must hedge, because they only read.
Margyn executes. The word proof is sitting unclaimed in a market where the
nearest competitor has explained on their own homepage why they cannot have it.

**Absence is the unserved defect class.** Every incumbent is built to grade what
is present: this line was covered, this rule matched, this diff is fine. Margyn's
five checks are all about something missing. A file that is read and not
committed. A test with no assertion. A gate nobody invokes. A linter exclusion
that lives in the wrong file. A mutation nothing caught. The moss PR is the whole
argument in one line and it is in our own README. The diff was innocent, the
absence was the bug and no diff reviewer could have seen it. No diff-shaped tool
finds absence. Every rival above is diff-shaped or percentage-shaped.

**Two structural moats nobody else has.** Every commercial rival is hosted or
seat-metered. Most are both. Margyn is a local CLI with no `/api/scan`, zero
dependencies and Ed25519 licences verified offline, so the paid check runs on an
air-gapped runner. Mutahunter, the only other language-agnostic mutation tool,
requires `OPENAI_API_KEY` and therefore ships your source out. provally deletes
your source after analysis, which means it had it. In a regulated buyer's
procurement review that difference decides the deal and it costs those vendors a
rewrite to match.

**The positioning space: proof-carrying verification-layer audit.** Not coverage,
not static analysis, not AI review. The claim is that the tests themselves are
broken, stated only where it can be demonstrated, with a reproduction attached to
every finding. Sonar already uses "trust and verification layer" for verifying
code, at 7M developers, so our sentence must say *the checks*, not *the code*, in
its first clause. The falsifiability is the product: no reproduction, no finding.

## Positioning advice

**1. Own "proof" and earn it in the same breath.** Lead with the claim and the
mechanism together, because the claim alone reads like every other vendor's
marketing. "Proves your checks do not check anything. Every finding ships a
reproduction." is already correct. Keep the second sentence permanently attached
to the first. Never publish the first without it.

Add the falsifiability rule as a visible product rule, not a footnote: **no
reproduction, no finding.** Nobody else in this sweep can state that. Stryker
gives you a score, kingdomwatch gives you a proxy, provally gives you a PoC for a
different problem.

**2. Sell the mutation check as an exhibit, never as a score.** The entire
mutation category is priced and marketed on a percentage and Stryker gives that
away free 6.2M times a month. We cannot win on mutation score and should not try.
Sell the sentence instead: *we inverted line 47, ran your suite and it passed.*
Ship the inverted line, the command and the green output. Never print a mutation
score anywhere in the product. That single restraint is the difference between
being a Stryker alternative and being a category.

Corollary on positioning against Stryker: they are the reference implementation
and we should say so plainly. If a team wants a mutation score across a whole
JS codebase, that is Stryker, free and better at it. Margyn runs a capped,
targeted mutation proof as one check inside a five-check audit that gates CI.
Conceding the score explicitly is what makes the exhibit claim credible.

**3. Name the enemy as green, not as a rival.** Do not position against Codecov,
Sonar or CodeRabbit. Position against a passing CI badge. The buyer already owns
three of those tools and is not shopping for a fourth of the same shape. Our
opening move is a question they cannot answer: your suite is green, what does
that prove? Codecov has already conceded the answer in public, so quote them:
"it is too easy to write high-coverage tests that don't deliver value", plus
Goodhart's law. Being the tool that follows from a competitor's own admission is
a stronger place to stand than being their alternative.

Two hard exclusions in every piece of copy, because both are crowded and neither
is us: we do not review code and we do not generate tests. Diffblue at "$0.30 /
line", CodeRabbit's "Unit test generation" and Codecov's AI tests all manufacture
the artefact Margyn audits. Say that out loud. "Your AI wrote 400 tests last
month. How many can fail?" is the single best sentence available in this market
and no rival can use it, because they wrote the tests.

**4. Price per proof and make the local-only architecture the reason.** Seat
pricing is wrong for an audit. Trunk bills per committer, Codacy per committer,
Semgrep and Snyk per contributor, arcmutate at "$8 per user/month". A CI gate has
no seats, it has runs and per-seat billing on a gate punishes the buyer for
adding engineers who never open the tool. Qodo's expiring credits are worse: they
make the cheapest behaviour to scan less, which is the opposite of what an
auditor wants. provally already proved the market accepts the alternative with
"Pay for proof, not access."

The offline Ed25519 licence is not a footnote, it is the top of the security
section. Three sentences that no rival can copy this quarter: the scanner is a
local CLI, there is deliberately no hosted scan endpoint and the paid check
verifies its licence offline so it runs on a CI runner with no network. Then the
line from our own README that a competitor cannot say: a refusal never fails your
run, because "Billing is not a reason to break someone's build."

**5. Lead every surface with the moss reproduction and put our own repo second.**
The proof claim needs one concrete instance before it needs a feature list. Order
it: the defect, the finding, the reproduction output, the fix confirmation.
"Locally: 26 tests green. In CI: two tests failed reading files that had never
been pushed." Then the two-command reproduction that returns `ABSENT from HEAD`
and `PRESENT on disk`. That is a story with a date, a repo, a PR number and a
commit, which is more evidence than any homepage in this table carries.

Then the move nobody else in the sweep would survive: run the mutation proof on
Margyn's own repo and publish the three holes it finds, including the one in the
mutation checker itself. Every rival page in this file is a wall of logos and
G2 badges. A tool that audits itself in public and fails is the strongest
possible demonstration of the falsifiability rule and it inoculates us against
the first thing a sceptical developer will try.

Two things to fix before this positioning ships, both from our own lane notes.
The README says twenty-one tests and RESUME.md says ten passing, while the brief
says 26. Publish one number and make it the true one, because a proof product
caught with a wrong count loses the whole claim. And `https://margyn.xyz/` has no
TLS listener, so today every one of these sentences links to nothing.

## Sources

All fetched 2026-08-05.

- https://stryker-mutator.io/
- https://stryker-mutator.io/docs/
- https://stryker-mutator.io/docs/stryker-js/introduction/
- https://stryker-mutator.io/docs/stryker-js/configuration/
- https://stryker-mutator.io/docs/mutation-testing-elements/mutant-states-and-metrics/
- https://stryker-mutator.io/docs/General/dashboard/
- https://pitest.org/
- https://www.arcmutate.com/
- https://docs.arcmutate.com/
- https://github.com/codeintegrity-ai/mutahunter
- https://api.github.com/repos/codeintegrity-ai/mutahunter
- https://api.github.com/repos/stryker-mutator/stryker-js
- https://api.github.com/repos/hcoles/pitest
- https://api.npmjs.org/downloads/point/last-month/@stryker-mutator/core
- https://about.codecov.io/
- https://about.codecov.io/pricing/
- https://about.codecov.io/blog/mutation-testing-how-to-ensure-code-coverage-isnt-a-vanity-metric/
- https://about.codecov.io/product/feature/test-analytics/
- https://www.sonarsource.com/products/sonarcloud/
- https://www.sonarsource.com/plans-and-pricing/
- https://www.codacy.com/
- https://www.codacy.com/pricing
- https://www.coderabbit.ai/
- https://www.coderabbit.ai/pricing
- https://snyk.io/
- https://snyk.io/plans/
- https://semgrep.dev/
- https://semgrep.dev/pricing
- https://www.qodo.ai/
- https://www.qodo.ai/pricing/
- https://www.qodo.ai/products/qodo-cover/
- https://www.diffblue.com/
- https://www.diffblue.com/pricing/
- https://graphite.com/ (from a 301 on graphite.dev)
- https://graphite.com/pricing
- https://trunk.io/
- https://trunk.io/pricing
- https://wallabyjs.com/
- https://wallabyjs.com/purchase/
- https://wallabyjs.com/store/company/
- https://www.cloudbees.com/capabilities/cloudbees-smart-tests (from a 308 on launchableinc.com)
- https://sourcery.ai/
- https://sourcery.ai/pricing
- https://github.com/features/code-quality
- https://github.blog/changelog/2026-07-20-github-code-quality-is-now-generally-available/
- https://docs.github.com/en/billing/concepts/product-billing/github-code-quality
- https://kingdomwatch.dev/
- https://provally.io/
- https://getautonoma.com/
- https://knip.dev/
- https://knip.dev/reference/issue-types
- https://github.com/jest-community/eslint-plugin-jest/blob/main/docs/rules/expect-expect.md
- https://registry.npmjs.org/@intentsolutions/audit-harness
- https://registry.npmjs.org/tautest

Two notes on gaps. `arcmutate.com` does not resolve, the live site is
`www.arcmutate.com`, whose `/pricing` path returns a GitLab 404, so
the arcmutate prices above are the ones printed on its homepage. Wallaby
publishes no dollar figure at all: the store computes price in a widget that
returned "Calculating" on every fetch, so only the licence model and the
discount percentages are quotable.
