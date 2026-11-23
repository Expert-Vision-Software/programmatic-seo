# programmatic-seo

Framework-agnostic programmatic SEO engine for SPAs and component frameworks.

- **Declarative page spec** (`ISeoPage`) with an atomic `emit()` commit
- **Chainable builder API** (L1 `SeoPageBuilder`, L2 `ContentPageBuilder`) with URL hygiene guard
- **Managed JSON-LD `@graph`** — stable `@id`s, idempotent node upserts by canonical path
- **Meta / canonical / Open Graph / Twitter Card rendering** into the document head
- **Zero framework dependencies** — the only runtime dependency is `schema-dts`

## Status

Pre-release: the engine is being extracted behavior-identically from
[Expert-Vision-Software/billgrokker](https://github.com/Expert-Vision-Software/billgrokker)
(BillGrokker's SPA SEO service, hardened and extraction-prepared upstream).

- Normative spec: [#1](https://github.com/Expert-Vision-Software/programmatic-seo/issues/1)
- First publish: [#9](https://github.com/Expert-Vision-Software/programmatic-seo/issues/9) → npm **`@expert-vision-software/programmatic-seo`** (v0.1.0)

## How it is used

```text
initialize(config)        site defaults from the host document (meta, title, JSON-LD graph)
siteWide.set*(...)        site-wide nodes: organization, logo, webApplication, base breadcrumb
emit(pageSpec)            per navigation: atomic commit of the page's SEO spec
page().set*(...).emit()   the same, via the chainable builder
prepareToNavigate()       page-state reset between navigations (site-wide state persists)
setUrl(href)              first-class navigation sync
```

Full API reference lands with the docs ticket
([#7](https://github.com/Expert-Vision-Software/programmatic-seo/issues/7)),
adapted from the upstream
[SEO service reference](https://github.com/Expert-Vision-Software/billgrokker/blob/3169c7a10003/docs/reference/seo-service-api.md).

## Extraction plan

| Ticket | Scope |
|---|---|
| [#2](https://github.com/Expert-Vision-Software/programmatic-seo/issues/2) | Package scaffold (manifest, toolchain, MIT license) |
| [#3](https://github.com/Expert-Vision-Software/programmatic-seo/issues/3) | Production baseline fixtures captured from billgrokker.com |
| [#4](https://github.com/Expert-Vision-Software/programmatic-seo/issues/4) | Core module migration (types, service, builders, dates, config parser) |
| [#5](https://github.com/Expert-Vision-Software/programmatic-seo/issues/5) | Golden-master unit suites migrated in-package |
| [#6](https://github.com/Expert-Vision-Software/programmatic-seo/issues/6) | Baseline synthesis tests (package output ≡ production) |
| [#7](https://github.com/Expert-Vision-Software/programmatic-seo/issues/7) | README, API reference, framework integration guidance |
| [#8](https://github.com/Expert-Vision-Software/programmatic-seo/issues/8) | CI: PR gate + tag-driven npm publish with provenance |
| [#9](https://github.com/Expert-Vision-Software/programmatic-seo/issues/9) | Publish v0.1.0 |

## Production baseline

The implementation iterates against production truth: committed fixtures of the
SPA-rendered `<head>` per route, captured once from `https://billgrokker.com`
([#3](https://github.com/Expert-Vision-Software/programmatic-seo/issues/3)), with
synthesis tests proving the public API reproduces them
([#6](https://github.com/Expert-Vision-Software/programmatic-seo/issues/6)).
Re-capture is always a deliberate, reviewed PR — never automated.

Rendered output is **byte-identical** to the upstream implementation; this is the
hard constraint inherited from the source project (stable `@id` ordering, key
insertion order, `@context`/`@graph` shape).

### Baseline synthesis tests

`test/baseline-synthesis.spec.ts` reconstructs each of the nine fixture routes
through the public API only — `initialize` → `siteWide.set*(...)` →
`emit()` / `page()` chains → `setUrl(href)` — inside a fresh jsdom document
seeded with the SPA's served static head, then compares the serialized head
against the fixture after the shared normalization
(`scripts/normalize.ts`, the single source of truth, shared with the capture
harness).

Content inputs come from the fixtures' stored data blocks, never the network:
bill-detail routes synthesize from the fixture's `bill` metadata block
(title, dates, policyArea, breadcrumbs) plus the captured description meta,
and the FAQ routes reuse the fixture's stored `Question` content. The doubled
`<title>` values on router-titled routes (home, FAQ, not-found, account) and
the `/faq` → `/faq/index` canonical are reproduced as-is: they are upstream
behaviors (the SPA router's `buildTitle` composition and the router's
`/faq/index` URL), documented in `fixtures/baseline/NORMALIZATION.md` context —
not bugs to fix here.

### What a synthesis failure means

- **Diff only inside `{{NOW}}` fields** → a normalization bug. Fix the
  normalization module or the test harness; never the fixture.
- **Diff in JSON-LD shape, `@id` values, key order, meta set, canonical, or
  title** → a package regression. Fix the package; the fixture is production
  truth.
- **Diff caused by an intentional behavior change** → land a `baseline:
  recapture` PR first (see below), then update the synthesis expectation.
  Do not weaken the comparison in the test.

### Re-capturing the baseline

Re-capture is **manual only** and always ships as a reviewed PR titled
`baseline: recapture` with a justification in the body (production head change,
new route, fixture drift). CI never re-captures.

```sh
bun install && bunx playwright install chromium
npm run capture-baseline
```

This rewrites `fixtures/baseline/*.json` for all nine routes from
`https://billgrokker.com`. Then verify idempotence: run the command a second
time and confirm `git status` shows no further diff outside `{{NOW}}` fields
(see `fixtures/baseline/NORMALIZATION.md`). Commit the changed fixtures in a
single `baseline: recapture` PR describing what changed in production and why.

## Downstream adoption

BillGrokker switches to this package under its own spec:
[Expert-Vision-Software/billgrokker#36](https://github.com/Expert-Vision-Software/billgrokker/issues/36)
(baseline parity gate → integration → import swap → parity verification → docs).