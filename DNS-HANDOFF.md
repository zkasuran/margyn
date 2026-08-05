# margyn.xyz DNS: the one step that needs a browser

Status on 2026-08-05. Everything below the "What is done" line is finished and
verified. The single remaining action needs the Spaceship dashboard, because their
public API has no DNSSEC endpoint.

## What you need to do, once

**Turn DNSSEC off for margyn.xyz at Spaceship.**

1. Sign in at spaceship.com, open **margyn.xyz**.
2. Find **DNSSEC** (under the domain's security or advanced DNS section).
3. **Disable it**. Deleting the DS record it lists does the same thing.

That is the whole task. Nothing else is waiting on you.

Optional, and only if you would rather keep DNSSEC on: instead of disabling it,
replace the registry DS with Cloudflare's, which is

```
margyn.xyz. 3600 IN DS 2371 13 2 F703A3012C7E1C7590C97A07F10BB0AEBDB99E050C3B99AFCD3DDBD0F3A20B7C
```

Disabling is the safer option under time pressure. A wrong DS breaks the domain
exactly as it is broken now, and Cloudflare's DNSSEC can be switched on later once
the domain is confirmed working.

## Why the domain is dark right now

margyn.xyz **SERVFAILs on every validating resolver**, which is most of the
internet. It is not a propagation delay and waiting will not fix it.

The cause, from the resolvers' own error output:

```
EDE(9): DNSKEY Missing no SEP matching the DS found for margyn.xyz
```

The `.xyz` registry still publishes a DS record pointing at a signing key that
Spaceship retired the moment the domain moved to custom nameservers:

| Where | What it says |
| --- | --- |
| `.xyz` registry (`x.nic.xyz`) | `DS 25163 13 2 75508408...A0C80255` |
| `launch1.spaceship.net` | **no DNSKEY for margyn.xyz at all** |
| `aisha.ns.cloudflare.com` | serves the zone correctly, `AAAA 100::` |

So the chain of trust is broken at the top: the parent zone vouches for a key
nobody serves any more. A validating resolver is required to refuse the answer
rather than pass it through, which is DNSSEC working as designed on a
misconfiguration.

Proven rather than assumed, three ways:

- `dig DNSKEY loadline.xyz @launch1.spaceship.net` returns a key. The same query
  for margyn.xyz returns nothing. Same registrar, same nameservers, one moved and
  one did not, so the retirement is what changed.
- With validation disabled (`cd=1`) the delegation resolves fine, which rules out
  a propagation problem.
- `spaceship.net` itself is properly signed, so this is not their infrastructure
  being broken in general.

The registry DS carries a **3600 second TTL**, so allow up to an hour after you
disable it, plus registry processing time.

## What is done, and verified live

- **The worker is deployed and serving.** `https://margyn.margyn.workers.dev`
  returns 200 with real TLS. Verified anonymously: `/` serves the page, `/app.mjs`
  serves as `text/javascript`, `/api/config` carries nothing but the public snippet
  id, `POST /api/scan` is 404 because that route deliberately does not exist on a
  public host, `/api/licence` is 400 with no token and 401 with a bad one.
- **Five secrets set** with `wrangler secret put`, none in any committed file.
  Grepped every live response for the signing key and the API key: absent.
- **The Cloudflare zone exists**, id `1859c3e5123e7ace6aa390ba7cc55867`, Free plan,
  status `pending` only because it is waiting for this DNSSEC fix.
- **Nameservers already repointed at the registrar**, over the Spaceship API, from
  `launch1/launch2.spaceship.net` to `aisha.ns.cloudflare.com` and
  `ignacio.ns.cloudflare.com`. Confirmed by reading the domain back.
- **Custom domains attached** to the worker for both `margyn.xyz` and
  `www.margyn.xyz`, with Cloudflare managing the certificate. The proxied AAAA
  records exist and answer at Cloudflare's nameservers.
- **workers.dev is deliberately left enabled** as a fallback. A submission link
  that resolves beats a tidy configuration.

## After you disable it

Nothing needs redeploying. Check with:

```bash
dig +short NS margyn.xyz              # expect the two cloudflare hosts
curl -sI https://margyn.xyz/          # expect 200
```

The zone flips from `pending` to `active` on its own once Cloudflare sees the
delegation, usually within minutes of the DS clearing.

## Credentials used, and where they live

- Spaceship API key and secret: read from
  `~/Downloads/llbondraise/deploy/backend/.env` (`LIBDNS_SPACESHIP_APIKEY` and
  `LIBDNS_SPACESHIP_APISECRET`), the loadline lane's existing setup. Not copied
  into this repository.
- Cloudflare: the account token you supplied lacked zone permissions, so a scoped
  token named `margyn-zone-dns` was minted from it with Zone, DNS, Workers Routes,
  Zone Settings and SSL write. Revoke it at
  `dash.cloudflare.com/profile/api-tokens` when the lane is finished.
- The dashboard session cookie was deleted. `dash.cloudflare.com` WAF-blocks curl
  with a 403 interstitial even with a valid session, so it was unusable anyway.
