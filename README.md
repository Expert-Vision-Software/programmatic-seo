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

## Downstream adoption

BillGrokker switches to this package under its own spec:
[Expert-Vision-Software/billgrokker#36](https://github.com/Expert-Vision-Software/billgrokker/issues/36)
(baseline parity gate → integration → import swap → parity verification → docs).