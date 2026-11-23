import type {Thing, Question} from "schema-dts";

/**
 * A single entry in a `BreadcrumbItem[]` breadcrumb list. The service renders these as
 * schema.org `ListItem` entries inside a `BreadcrumbList` JSON-LD node, and the URL is
 * resolved against the configured root.
 */
export interface BreadcrumbItem {
    /** Human-readable label for the breadcrumb step. Used as the `name` on the rendered `ListItem`. */
    name: string;
    /** Absolute or root-relative path the step points to. Resolved against the site's `rootUrl`. */
    url: string;
}

/**
 * A list field that can either replace the current page-state list (bare array) or append to it
 * (object form with `append`). Used for `breadcrumbs` and `keywords` on `ISeoPage`. Lets layered
 * contributors (a layout wrapper + a page) compose without reading each other.
 */
export type AppendableList<T> = T[] | {append: T[]};

/**
 * Spec for emitting a schema.org `WebPage` JSON-LD node. Drives the page-level structured data
 * Google uses to understand the page's identity, publication dates, and relationship to the site.
 */
export interface WebPageSpec {
    /** Path used to compute the node's `@id` and `url`. Combined with `rootUrl` at render. */
    canonicalPath: string;
    /** Display name for the page node. Falls back to the page `title` if omitted. */
    name?: string | undefined;
    /** Required description; copied verbatim into the node's `description` field. SEO-critical. */
    description: string;
    /** ISO-8601 publish date. Appears in the node as `datePublished`. Helps Google News / rich results. */
    datePublished?: string | undefined;
    /** ISO-8601 last-modified date. Appears in the node as `dateModified`. Signals freshness to crawlers. */
    dateModified?: string | undefined;
    /**
     * Spec control flag. When `true`, the rendered WebPage node includes
     * `"breadcrumb": {"@id": "<canonicalPath>#breadcrumb"}`, linking it to the page's `BreadcrumbList`.
     * Also causes the breadcrumb list to render even when no page-level `breadcrumbs` are emitted
     * (so site-wide breadcrumbs alone still appear).
     */
    breadcrumb?: boolean | undefined;
    /** Optional `mainEntity` for the page — e.g. a `Question` for a Q&A page or a `Thing` summary. */
    mainEntity?: Thing | Thing[] | undefined;
}

/**
 * Spec for emitting a schema.org `Article` JSON-LD node. Required for Google News / article rich
 * results. Co-exists with a `WebPage` node on the same page (the article's `mainEntityOfPage`
 * points back to the WebPage).
 */
export interface ArticleSpec {
    /** Path used to compute the node's `@id` and `url`. Combined with `rootUrl` at render. */
    canonicalPath: string;
    /** Display name. Falls back to page `title`. */
    name?: string | undefined;
    /** Headline — can differ from `name` for editorial titles. Falls back to page `title`. */
    headline?: string | undefined;
    /** Required description; copied into the node. SEO-critical for article rich results. */
    description: string;
    /** Required ISO-8601 publish date. Drives `datePublished` — required for article rich results. */
    datePublished: string;
    /** Required ISO-8601 last-modified date. Drives `dateModified`. */
    dateModified: string;
    /** Optional `about` entity — typically a `Thing` describing the article's topic. */
    about?: Thing | undefined;
    /** Optional section label (e.g. "Politics"). Maps to `articleSection` — helps Google News categorization. */
    articleSection?: string | undefined;
    /** Optional comma-separated keywords string. Maps to `keywords` on the article node. */
    keywords?: string | undefined;
}

/**
 * Spec for emitting a schema.org `FAQPage` JSON-LD node. Required for FAQ rich results in Google
 * Search (the expandable Q&A SERP feature). Each entry in `mainEntity` must be a `Question`.
 */
export interface FaqPageSpec {
    /** Path used to compute the node's `@id`. Combined with `rootUrl` at render. */
    canonicalPath: string;
    /** Required `Question[]`. Each must include an `acceptedAnswer` to qualify for FAQ rich results. */
    mainEntity: Question[];
}

/**
 * Twitter / X card configuration. Drives `<meta name="twitter:*">` tags. Defaults are applied at
 * init via `initialize()` — override per-page by emitting a `twitter` field on `ISeoPage`.
 */
export interface TwitterSpec {
    /** Twitter card type. `summary_large_image` is required for image-forward cards. */
    card?: "summary" | "summary_large_image" | "app" | "player";
    /** Site handle (with or without leading `@`). Rendered as `twitter:site` after normalization. */
    handle?: string;
}

/**
 * Pure-data page SEO spec. Emitted to `SeoService.emit()` as a single atomic commit.
 * Every field is optional; omitted fields leave the current page-state value untouched, which
 * lets layered contributors (a wrapper + a page) compose without coupling.
 *
 * All fields are framework-agnostic — this type travels cleanly into the split-out package
 * and can be consumed from React, Vue, Next.js, or any other host.
 */
export interface ISeoPage {
    /** Page title. Drives `document.title` (with configured suffix) plus `og:title` and `twitter:title`. */
    title?: string;
    /** Page description. Drives the `<meta name="description">`, `og:description`, `twitter:description`. SEO-critical. */
    description?: string;
    /**
     * Canonical path or absolute URL for the page. Drives `og:url`, `twitter:url`, `<link rel="canonical">`,
     * and synchronizes the active `WebPage`/`Article` node's `url` field. Use a path (`/foo`) for the
     * site's own pages; use an absolute URL when canonicalizing to an off-site location.
     */
    url?: string;
    /**
     * Sets `<link rel="canonical">` only, without touching `og:url` / `twitter:url` / graph nodes.
     * Distinct from `url` — use when the canonical target differs from the social-share URL.
     */
    canonicalPath?: string;
    /** Open Graph type. `article` is required for article rich results. */
    ogType?: "article" | "website";
    /** Social-share image. Drives `og:image` and `twitter:image`. Recommended ≥1200×630 for OG. */
    image?: string;
    /**
     * Page-level keywords. Bare array = replace; `{append: [...]}` = append to current page-state.
     * Renders into `<meta name="keywords">`, `og:keywords`, and synchronizes the active `Article` node.
     */
    keywords?: AppendableList<string>;
    /**
     * Page-level breadcrumb items. Bare array = replace; `{append: [...]}` = append.
     * Renders a `BreadcrumbList` JSON-LD node, merged with site-wide items (e.g. `Home`) at render time.
     */
    breadcrumbs?: AppendableList<BreadcrumbItem>;
    /** When `true`, emits `<meta name="robots" content="noindex, nofollow">`. Use for auth pages, 404s, internal routes. */
    noIndex?: boolean;
    /** HTTP status hint for prerenderers (e.g. `404` for not-found, `410` for gone). Drives `<meta name="prerender-status-code">`. */
    statusCode?: number;
    /**
     * HTTP status hint consumed downstream by the hosting layer (Stage 2 nginx parser).
     * Drives `<meta name="response-http-status" content="...">`. Independent of `statusCode`:
     * `statusCode` targets `prerender-status-code` (PageReplica), `responseHttpStatus` targets the
     * nginx parser that turns the SPA shell into a real HTTP 404 for non-bill routes.
     */
    responseHttpStatus?: number;
    /** Optional `WebPage` graph node. See {@link WebPageSpec}. */
    webPage?: WebPageSpec;
    /** Optional `Article` graph node. See {@link ArticleSpec}. Usually paired with a `webPage`. */
    article?: ArticleSpec;
    /** Optional `FAQPage` graph node. See {@link FaqPageSpec}. Required for FAQ rich results. */
    faqPage?: FaqPageSpec;
    /** Optional Twitter / X card overrides. See {@link TwitterSpec}. */
    twitter?: TwitterSpec;
}