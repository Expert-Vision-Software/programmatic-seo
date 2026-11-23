# programmatic-seo

Framework-agnostic programmatic SEO engine for SPAs and component frameworks.

- **Declarative page spec** (`ISeoPage`) with an atomic `emit()` commit
- **Chainable builder API** (L1 `SeoPageBuilder`, L2 `ContentPageBuilder`) with URL hygiene guard
- **Managed JSON-LD `@graph`** — stable `@id`s, idempotent node upserts by canonical path
- **Meta / canonical / Open Graph / Twitter Card rendering** into the document head
- **Zero framework dependencies** — the only runtime dependency is `schema-dts`

## Install

```bash
bun add @expert-vision-software/programmatic-seo
```

ESM-only, TypeScript declarations included, Node 22+.

## Quickstart

```ts
import {SeoService} from "@expert-vision-software/programmatic-seo";

const seo = new SeoService();

seo.initialize({
    rootUrl: "https://example.com",
    siteTitle: "Example",
    logger: console,
});

seo.siteWide
    .setBreadcrumb([{name: "Home", url: "/"}])
    .setLogo({url: "https://example.com/logo.png", width: 300, height: 68})
    .setOrganization({name: "Example Inc.", url: "https://example.com"})
    .setWebApplication({name: "Example App", description: "What the app does."});

seo.prepareToNavigate();

seo.page()
    .setTitle("My Article")
    .setDescription("What the article is about.")
    .setUrl("/articles/my-article")
    .contentPage()
    .setDates({published: "2026-01-15", modified: "2026-02-01"})
    .setKeywords("example", "seo")
    .emit();

seo.setUrl("https://example.com/articles/my-article");
```

The lifecycle: `initialize()` once at startup → configure site-wide nodes on the `siteWide`
builder → per navigation call `prepareToNavigate()`, then commit the page's spec via
`emit(spec)` or a `page()` / `contentPage()` builder chain → on navigation end, sync the URL
with `setUrl(window.location.href)`.

The full public surface — `emit()` merge semantics, spec field tables, builder chains,
URL hygiene guard, date normalization, config parsing — is documented in
[docs/API.md](docs/API.md).

## Framework integration

`ISeoPage` is pure data with zero framework types, so the service drops into any host. The
package ships no adapters; wiring stays consumer-side.

### Aurelia

The proven pattern (as consumed by
[BillGrokker](https://github.com/Expert-Vision-Software/billgrokker)): a DI token,
a logger bridge, an initialization AppTask, and a navigation-event handler.

```ts
import {DI} from "aurelia";
import {SeoService} from "@expert-vision-software/programmatic-seo";

export const ISeoService = DI.createInterface<ISeoService>(
    "ISeoService",
    x => x.singleton(SeoService),
);
export type ISeoService = SeoService;
```

Register and initialize in an `AppTask`, bridging Aurelia's `ILogger` over the package's
`SeoLogger` interface:

```ts
import {AppTask, ILogger} from "aurelia";
import {ISeoService} from "./seo-service.di";
import type {SeoLogger} from "@expert-vision-software/programmatic-seo";
import {HomeBreadcrumbItem} from "./constants/breadcrumbs";

export const initializeSeo: IRegistry = {
    register(container: IContainer): IContainer {
        const seoLogger: SeoLogger = container.get(ILogger).scopeTo("SeoService");
        return container.register(AppTask.activated(ISeoService, seoSvc => {
            seoSvc.initialize({rootUrl: ROOT_URL, logger: seoLogger});
            seoSvc.siteWide.setBreadcrumb([HomeBreadcrumbItem]);
            seoSvc.siteWide.setLogo({url: `${ROOT_URL}/logo.png`, width: 300, height: 68});
            seoSvc.siteWide.setOrganization({name: "Example", url: ROOT_URL});
        }));
    },
};
```

Sync navigation: `au:router:navigation-start` → `prepareToNavigate()`;
`au:router:navigation-end` → `setUrl(window.location.href)`:

```ts
import {resolve} from "aurelia";
import {IRouterEvents} from "@aurelia/router";
import {ISeoService} from "./seo-service.di";

events.subscribe("au:router:navigation-start", () => seo.prepareToNavigate());
events.subscribe("au:router:navigation-end", () => {
    seo.setUrl(window.location.href);
});
```

Page components then emit in `attached()`:

```ts
public attached(): void {
    this._seo.page().setTitle(title).setDescription(desc).setUrl(path).emit();
}
```

### React

```tsx
import {useEffect, useMemo} from "react";
import type {ISeoPage} from "@expert-vision-software/programmatic-seo";

function useSeo(spec: ISeoPage) {
    useEffect(() => {
        seo.emit(spec);
    }, [spec]);
}

function Article({post}: {post: Post}) {
    const spec = useMemo<ISeoPage>(() => ({
        title: post.title,
        description: post.excerpt,
        url: `/posts/${post.slug}`,
        ogType: "article",
        article: {
            canonicalPath: `/posts/${post.slug}`,
            description: post.excerpt,
            datePublished: post.publishedAt,
            dateModified: post.modifiedAt,
        },
    }), [post]);
    useSeo(spec);
    return <article>…</article>;
}
```

### Vue

```ts
import {watch} from "vue";
import type {ISeoPage} from "@expert-vision-software/programmatic-seo";

export function useSeo(spec: Ref<ISeoPage>) {
    watch(spec, v => seo.emit(v), {deep: true});
}
```

### Next.js

The spec is plain serializable data, so a client `<SeoHead>` component calls `emit()`
on mount, or a server-side renderer can pass the same `ISeoPage` shape down:

```tsx
"use client";
import {useEffect} from "react";
import type {ISeoPage} from "@expert-vision-software/programmatic-seo";

export function SeoHead({spec}: {spec: ISeoPage}) {
    useEffect(() => {
        seo.emit(spec);
    }, [spec]);
    return null;
}
```

## Logger bridging

The package never logs through a framework; it calls the `SeoLogger` seam supplied via the
config `logger` field. Bridge your framework logger over it:

```ts
import type {SeoLogger} from "@expert-vision-software/programmatic-seo";

const seoLogger: SeoLogger = {
    debug: (msg, ...args) => frameworkLogger.debug(msg, args),
    info: (msg, ...args) => frameworkLogger.info(msg, args),
    warn: (msg, ...args) => frameworkLogger.warn(msg, args),
    error: (msg, ...args) => frameworkLogger.error(msg, args),
};

seo.initialize({rootUrl: "https://example.com", logger: seoLogger});
```

Without a `logger`, the service stays silent (no-op defaults). Aurelia users: see the
`ILogger.scopeTo("SeoService")` bridge above.

## Production baseline

The implementation iterates against production truth: committed fixtures of the
SPA-rendered `<head>` per route, captured once from `https://billgrokker.com`
([#3](https://github.com/Expert-Vision-Software/programmatic-seo/issues/3)), with
synthesis tests proving the public API reproduces them
([#6](https://github.com/Expert-Vision-Software/programmatic-seo/issues/6)).

- **Capture once:** fixtures are committed artifacts; the git history is the baseline's
  history. Volatile runtime values (dates that default to "now") are normalized to the
  `{{NOW}}` token; every rule is documented in `fixtures/baseline/NORMALIZATION.md`.
- **Re-capture is manual and deliberate:** a PR titled `baseline: recapture` with a
  justification in the body. CI never auto-recaptures.
- **Interpreting synthesis failures:** a fixture mismatch means either the package output
  drifted from upstream behavior (a regression — fix the implementation) or production
  changed legitimately (a real-world change — re-capture via a reviewed PR). A failure is
  never silenced by editing the fixture inline with the change that broke it.

Rendered output is **byte-identical** to the upstream implementation; this is the hard
constraint inherited from the source project (stable `@id` ordering, key insertion order,
`@context`/`@graph` shape).

## Status

Pre-release: the engine is being extracted behavior-identically from
[Expert-Vision-Software/billgrokker](https://github.com/Expert-Vision-Software/billgrokker)
(BillGrokker's SPA SEO service, hardened and extraction-prepared upstream).

- Normative spec: [#1](https://github.com/Expert-Vision-Software/programmatic-seo/issues/1)
- First publish: [#9](https://github.com/Expert-Vision-Software/programmatic-seo/issues/9) —
  npm **`@expert-vision-software/programmatic-seo`** (v0.1.0)

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

## Downstream adoption

BillGrokker switches to this package under its own spec:
[Expert-Vision-Software/billgrokker#36](https://github.com/Expert-Vision-Software/billgrokker/issues/36)
(baseline parity gate → integration → import swap → parity verification → docs).

## License

[MIT](LICENSE)
