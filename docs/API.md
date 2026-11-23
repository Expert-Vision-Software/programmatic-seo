# API reference

Full public surface of `programmatic-seo-sdk` (exported from
`src/index.ts`).

Adapted from the upstream reference document
[seo-service-api.md](https://github.com/Expert-Vision-Software/billgrokker/blob/3169c7a10003/docs/reference/seo-service-api.md)
(BillGrokker, master @ `3169c7a10003`), verified against this package's source.

---

## `SeoService`

The entry point. One instance per app (register as a singleton).

```ts
class SeoService {
    readonly siteWide: ISitewideBuilder;
    get rootUrl(): string;
    initialize(config: SeoServiceConfig | string): void;
    emit(seoPage: ISeoPage): void;
    page(): IPageBuilder;
    prepareToNavigate(): void;
    setUrl(pathOrUrl: string): this;
    resolveUrl(path: string): string;
    setSiteName(name: string): this;
    getDefaults(): SeoConfig;
}
```

### `initialize(config: SeoServiceConfig | string): void`

Initializes the service, reads static defaults from the host document, applies page
defaults, and renders any site-wide nodes configured before `initialize()`. A string is
accepted as shorthand for `{rootUrl: str}`. Idempotent: a second call is a no-op.

### `emit(seoPage: ISeoPage): void`

The single atomic commit point. Accepts a plain `ISeoPage` object. See
[merge semantics](#emit-merge-semantics).

### `page(): IPageBuilder`

Factory returning a chainable [`SeoPageBuilder`](#seoPageBuilder) (L1). The canonical entry
point for all page-level SEO. See [builder chains](#builder-chains-l1--l2).

### `prepareToNavigate(): void`

Page-state reset between navigations: removes meta/canonical tags the service created,
removes `script[data-seo="true"]` scripts, clears page-level title/keywords/breadcrumbs, and
re-renders the graph from site-wide state only. Call on navigation start.

### `setUrl(pathOrUrl: string): this`

First-class navigation-sync method (not a builder passthrough). Called with
`window.location.href` on navigation end. Accepts an absolute URL or a root-relative path;
invalid values throw `` `Invalid URL: ${pathOrUrl}` ``. Sets `og:url`, `twitter:url`, the
canonical link, and syncs the active `WebPage`/`Article` node's `url`.

### `resolveUrl(path: string): string`

Resolves a path against the configured `rootUrl` (absolute URLs pass through).

### `setSiteName(name: string): this`

Sets `og:site_name` and `apple-mobile-web-app-title`.

### `getDefaults(): SeoConfig`

Returns the `SeoConfig` parsed from the host document at `initialize()` time.

---

## `SeoServiceConfig`

```ts
type SeoServiceConfig = {
    rootUrl: string;
    siteTitle?: string;
    pageTitleSuffix?: string;
    language?: string;
    description?: string;
    defaultKeywords?: readonly string[];
    graphScriptDomId?: string;
    webApplicationId?: string;
    logoId?: string;
    organizationId?: string;
    logger?: SeoLogger;
};
```

`pageTitleSuffix` defaults to `" | ${siteTitle}"` when a `siteTitle` (or a document-parsed
site name) is present. The `@id` fields default to `${rootUrl}/#webapplication`, `#logo`,
`#organization`. `graphScriptDomId` defaults to `${rootUrl}/#graph` and identifies the
`<script type="application/ld+json" data-id="...">` the service hydrates from and renders
into. `logger` is the [SeoLogger](#seologger) bridge.

---

## `ISitewideBuilder`

Available as `service.siteWide`. Configure before or after `initialize()`; nodes persist
across `prepareToNavigate()` resets. All setters return the builder.

| Method | Renders |
|---|---|
| `setBreadcrumb(items)` | Site-wide breadcrumb prefix merged into every page's `BreadcrumbList` |
| `setKeywords(...keywords)` | Site-wide keyword baseline for pages that don't set their own |
| `setBaseGraphNode(node)` | Arbitrary JSON-LD node by explicit `@id` |
| `setLogo({url, width, height, caption?})` | `ImageObject` node at the configured logo `@id`; back-fills `logo` refs on existing organization/application nodes |
| `setOrganization({name, url?, logo?, sameAs?, contactPoint?})` | `Organization` node; back-fills `publisher` on the application node |
| `setWebApplication({name, url?, description?, softwareVersion?, applicationCategory?, operatingSystem?})` | `WebApplication`/`SoftwareApplication` node with a free `Offer` |

---

## `SeoLogger`

The logging seam. Supply an implementation via `SeoServiceConfig.logger`; without one the
service is silent.

```ts
interface SeoLogger {
    debug(msg: string, ...args: unknown[]): void;
    info(msg: string, ...args: unknown[]): void;
    warn(msg: string, ...args: unknown[]): void;
    error(msg: string, ...args: unknown[]): void;
}
```

---

## Builder chains (L1 / L2)

### `SeoPageBuilder` — L1

Created by `service.page()`. Also constructible standalone via
`createBuilder(target)` with `{rootUrl, emit}` — useful in tests. All setters return `this`;
`emit()` commits the built spec; `build()` returns the `ISeoPage` without committing.

```ts
interface IPageBuilder {
    setTitle(title: string): this;
    setDescription(description: string): this;
    setUrl(url: string): this;
    setCanonicalPath(path: string): this;
    setOgType(type: "article" | "website"): this;
    setImage(image: string): this;
    setKeywords(...keywords: (string | string[])[]): this;
    appendKeywords(...keywords: (string | string[])[]): this;
    setBreadcrumbs(items: readonly BreadcrumbItem[]): this;
    appendBreadcrumbs(items: readonly BreadcrumbItem[]): this;
    setNoIndex(): this;
    setStatusCode(code: number): this;
    setResponseHttpStatus(code: number): this;
    setTwitter(options: TwitterSpec): this;
    setWebPage(spec: WebPageBuilderSpec): this;
    setArticle(spec: ArticleBuilderSpec): this;
    setFaqPage(spec: FaqPageSpec): this;
    contentPage(): ContentPageBuilder;
    emit(): void;
    build(): ISeoPage;
}
```

`setKeywords` and `appendKeywords` are de-duplicating and cumulative within one chain;
`appendBreadcrumbs` extends the chain's breadcrumb list, `setBreadcrumbs` replaces it.
`setWebPage`/`setArticle` merge field-by-field into the chain's node state; dates accept
`SeoDateInput` and are normalized (see [DateOnly normalization](#dateonly-normalization)).

#### URL hygiene guard

`setUrl`, `setCanonicalPath`, `setWebPage({canonicalPath})`, `setArticle({canonicalPath})`,
and `setFaqPage({canonicalPath})` **throw** when passed an absolute `http(s)` URL whose
origin matches the configured `rootUrl`:

```
Use relative url when referring to same website. If you mean to set to another site's root url, it cannot match the value of '${rootUrl}'.
```

Exception: `setImage` is NOT guarded (`og:image` accepts absolute off-site URLs).

### `ContentPageBuilder` — L2

Created by `page().contentPage()`. Entering L2 seeds the `webPage` + `article` node pair
(`webPage` gets `breadcrumb: true` by default), sets `ogType: "article"`, and exposes
article-focused helpers. `end()` returns to the parent `SeoPageBuilder` (e.g. to reach
`setFaqPage`). All L1 setters are delegated; `emit()`/`build()` delegate too.

```ts
class ContentPageBuilder {
    setDates(dates: {published?: SeoDateInput; modified?: SeoDateInput}): this;
    setAbout(about: string | Thing): this;
    setSection(section: string): this;
    setQuestion(question: {name: string; answerText: string; answerUrl?: string}): this;
    setFaqPage(spec: FaqPageSpec): this;
    end(): SeoPageBuilder;
}
```

- `setDates` fans the published/modified dates to both the `webPage` and `article` nodes.
- `setAbout("Policy Area")` wraps the string as a `Thing` and sets `articleSection` to the
  same value; passing a `Thing` object sets `about` only. `setSection` sets
  `articleSection` only.
- `setQuestion` sets `webPage.mainEntity` to a `Question` with an `acceptedAnswer`
  (`answerUrl` adds an `url` on the answer).

#### Root-value inheritance

At `build()` time:

- `title` → `webPage.name`, `article.name`, `article.headline` (when not explicitly set)
- `description` → `webPage.description`, `article.description` (when not explicitly set)
- `url` (relative) → `webPage.canonicalPath`, `article.canonicalPath` (when not explicitly
  set; explicit `setCanonicalPath` wins, and sets canonical-only without syncing `url` /
  `og:url`)
- chain `keywords` → `article.keywords` (comma-joined) when `setArticle` didn't set its own

Builder chains and atomic `emit()` are provably interchangeable: `page().set*(...).emit()`
builds exactly the `ISeoPage` that an equivalent `emit(spec)` consumes.

---

## The `ISeoPage` spec

Pure data, zero framework types. Every field is optional; omitted fields leave current
page-state untouched.

```ts
interface ISeoPage {
    title?: string;
    description?: string;
    url?: string;
    canonicalPath?: string;
    ogType?: "article" | "website";
    image?: string;
    keywords?: AppendableList<string>;
    breadcrumbs?: AppendableList<BreadcrumbItem>;
    noIndex?: boolean;
    statusCode?: number;
    responseHttpStatus?: number;
    webPage?: WebPageSpec;
    article?: ArticleSpec;
    faqPage?: FaqPageSpec;
    twitter?: TwitterSpec;
}
```

| Field | Renders |
|---|---|
| `title` | `document.title` (with configured suffix), `og:title`, `twitter:title` |
| `description` | `<meta name="description">`, `og:description`, `twitter:description` |
| `url` | `og:url`, `twitter:url`, `<link rel="canonical">`, active node `url` sync |
| `canonicalPath` | `<link rel="canonical">` only — no `og:url` sync |
| `ogType` | `og:type` |
| `image` | `og:image`, `twitter:image` |
| `keywords` | `<meta name="keywords">`, `og:keywords`, active `Article` node `keywords` |
| `breadcrumbs` | `BreadcrumbList` JSON-LD node, merged after site-wide items |
| `noIndex` | `<meta name="robots" content="noindex, nofollow">` when `true` |
| `statusCode` | `<meta name="prerender-status-code">` |
| `responseHttpStatus` | `<meta name="response-http-status">` (hosting-layer status hint) |
| `twitter` | `twitter:card`, `twitter:site` (handle normalized to `@…`) |

### `WebPageSpec`

| Field | Type | Notes |
|---|---|---|
| `canonicalPath` | `string` (required) | Computes the node's `@id` (`${rootUrl}${path}#webpage`) and `url` |
| `name` | `string?` | Falls back to the page `title` |
| `description` | `string` (required) | Copied verbatim into the node |
| `datePublished` | `string?` | ISO-8601 |
| `dateModified` | `string?` | ISO-8601 |
| `breadcrumb` | `boolean?` | `true` adds the `breadcrumb` `@id` ref and renders the breadcrumb list even with no page-level items |
| `mainEntity` | `Thing \| Thing[]?` | E.g. a `Question` for Q&A pages |

### `ArticleSpec`

| Field | Type | Notes |
|---|---|---|
| `canonicalPath` | `string` (required) | `@id` is `${rootUrl}${path}#article` |
| `name` | `string?` | Falls back to page `title` |
| `headline` | `string?` | Falls back to page `title` |
| `description` | `string` (required) | |
| `datePublished` | `string` (required) | |
| `dateModified` | `string` (required) | |
| `about` | `Thing?` | |
| `articleSection` | `string?` | |
| `keywords` | `string?` | Comma-separated |

### `FaqPageSpec`

| Field | Type | Notes |
|---|---|---|
| `canonicalPath` | `string` (required) | `@id` is `${rootUrl}${path}#faqpage` |
| `mainEntity` | `Question[]` (required) | Each needs an `acceptedAnswer` for rich results |

### `TwitterSpec`

| Field | Type |
|---|---|
| `card` | `"summary" \| "summary_large_image" \| "app" \| "player"` |
| `handle` | `string?` (rendered with a leading `@`) |

### `BreadcrumbItem`

The input shape (DX); mapped to schema.org `ListItem` at render time, URLs resolved against
`rootUrl`.

```ts
interface BreadcrumbItem {
    name: string;
    url: string;
}
```

### `AppendableList<T>`

```ts
type AppendableList<T> = T[] | {append: T[]};
```

Used for `keywords` and `breadcrumbs`: a bare array **replaces** the current page-state
list; `{append: [...]}` **appends** (de-duplicated).

---

## `emit()` merge semantics

The service holds per-navigation **page state** (reset by `prepareToNavigate()`; site-wide
state from `siteWide` is independent). `emit(spec)` applies the spec with:

| Field kind in spec | Absent | Present |
|---|---|---|
| Scalar (`title`, `description`, `url`, `ogType`, `image`, `noIndex`, `statusCode`, `responseHttpStatus`, `canonicalPath`, `twitter.card`, `twitter.handle`) | unchanged | **replace** page-state value |
| List (`breadcrumbs`, `keywords`) as bare array | unchanged | **replace** page-state list |
| List as `{append: [...]}` | unchanged | **append** to current page-state list |
| Graph node (`webPage`, `article`, `faqPage`) | unchanged (keep current node) | **render/update** JSON-LD node (idempotent by `canonicalPath`; sets the active node id) |

Consequences:

- **Partial emit:** emit only what you want to set/override; omit the rest.
- **Layered contribution:** a wrapper emits `keywords: {append: [...]}`; the page emits
  `keywords: [...]` (replace). Neither reads the other.
- **Idempotent graph:** re-emitting a node with the same `canonicalPath` updates it in
  place (`@id` stable).
- **Reset:** `prepareToNavigate()` clears page state; `siteWide` nodes persist.

---

## DateOnly normalization

```ts
type DateOnly = `${number}${number}${number}${number}-${number}${number}-${number}${number}`;
type SeoDateInput = DateOnly | (string & {});
function normalizeSeoDate(input: SeoDateInput): string;
```

`normalizeSeoDate("2025-08-01")` → `"2025-08-01T00:00:00+00:00"`. Any other string passes
through unchanged, so pre-formatted ISO strings are accepted everywhere dates go
(`setWebPage`, `setArticle`, `setDates`).

---

## `HtmlSeoConfigParser`

```ts
type SeoConfig = {
    title: string;
    description: string;
    keywords: string[];
    siteName: string;
    locale: string;
    robots: string;
    pageUrl: string;
    logoUrl: string;
    og: {type: string; imageUrl: string; imageWidth: number; imageHeight: number};
    twitter: {cardType: "summary" | "summary_large_image" | "app" | "player"; handleId: string; domain: string};
    jsonLd?: JsonLdScript[] | JsonLdScript | undefined;
};

type JsonLdScript = {id: string; data: JsonLdObject};

type GraphDocument = {
    "@context": string | string[] | Record<string, unknown>;
    "@graph": JsonLdObject[];
};

function HtmlSeoConfigParser(rootDomain: string, graphScriptDomId?: string): SeoConfig;
```

Reads static SEO defaults from the host document (usually the served `index.html`): title,
meta description/keywords/robots, `og:*` and `twitter:*` metas, and the JSON-LD graph script
identified by `data-id` (default `https://${rootDomain}/#graph`). The service calls this
inside `initialize()`; the result is available via `getDefaults()`. It operates on the
host-provided `document`, staying host-agnostic (works under jsdom in tests).

## `createBuilder`

```ts
function createBuilder(target: ISeoBuilderTarget): IPageBuilder;

interface ISeoBuilderTarget {
    readonly rootUrl: string;
    emit(seoPage: ISeoPage): void;
}
```

Constructs an L1 `SeoPageBuilder` against an explicit emit target — how `SeoService.page()`
wires the builder, and useful standalone in tests or custom hosts.
