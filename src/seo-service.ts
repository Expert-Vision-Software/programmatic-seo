import type {SeoConfig} from './models/seo-config.js';
import {HtmlSeoConfigParser} from './models/seo-config.js';
import type {JsonLdObject} from "schema-dts";
import type {ISeoPage, AppendableList, WebPageSpec, ArticleSpec, FaqPageSpec, BreadcrumbItem} from "./seo-page.js";
import {createBuilder} from "./seo-page-builder.js";
import type {IPageBuilder} from "./seo-page-builder.js";

export type {ISeoPage, WebPageSpec, ArticleSpec, FaqPageSpec, TwitterSpec, AppendableList} from "./seo-page.js";

type GraphScriptDocument = {
    "@context": string;
    "@graph": JsonLdObject[];
};

export interface SeoLogger {
    debug(msg: string, ...args: unknown[]): void;

    info(msg: string, ...args: unknown[]): void;

    warn(msg: string, ...args: unknown[]): void;

    error(msg: string, ...args: unknown[]): void;
}

export type SeoServiceConfig = {
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

export interface ISitewideBuilder {
    setBreadcrumb(items: readonly BreadcrumbItem[]): ISitewideBuilder;

    setKeywords(...keywords: (string | string[])[]): ISitewideBuilder;

    setBaseGraphNode(node: JsonLdObject): ISitewideBuilder;

    setLogo(options: { url: string; width: number; height: number; caption?: string }): ISitewideBuilder;

    setOrganization(options: {
        name: string;
        url?: string;
        logo?: { "@id": string };
        sameAs?: string[];
        contactPoint?: object
    }): ISitewideBuilder;

    setWebApplication(options: {
        name: string;
        url?: string;
        description?: string;
        softwareVersion?: string;
        applicationCategory?: string;
        operatingSystem?: string
    }): ISitewideBuilder;
}

export class SeoService {
    private static readonly GRAPH_CONTEXT = "https://schema.org";

    private _rootUrl: string = "";
    private _graphScriptId: string = "";
    private _pageTitleSuffix: string = "";
    private _language: string = "en-US";
    private _webApplicationId: string = "";
    private _logoId: string = "";
    private _organizationId: string = "";
    private _baseConfig!: SeoConfig;
    private _currentTags: Set<HTMLElement> = new Set();
    private _isInitialized = false;
    private _baseNodeIds: Set<string> = new Set();
    private _activePageNodeId: string | null = null;
    private _activeArticleNodeId: string | null = null;

    private _pageTitle: string | null = null;
    private _pageBreadcrumbItems: BreadcrumbItem[] = [];
    private _pageKeywords: string[] = [];
    private _lastBreadcrumbPath: string = "";
    private _breadcrumbConfigured: boolean = false;

    private _siteBreadcrumbItems: readonly BreadcrumbItem[] = [];
    private _siteKeywords: string[] = [];
    private _manualBaseNodes: Map<string, JsonLdObject> = new Map();
    private _graphNodes: JsonLdObject[] = [];
    private _seedNodes: JsonLdObject[] = [];
    private _graphDirty: boolean = false;
    private _graphHydrated: boolean = false;

    private _logger: SeoLogger = {
        debug() {
        },
        info() {
        },
        warn() {
        },
        error() {
        },
    };

    public readonly siteWide: ISitewideBuilder;

    constructor() {
        this.siteWide = this._createSitewideBuilder();
    }

    public get rootUrl(): string {
        return this._rootUrl;
    }

    public page(): IPageBuilder {
        return createBuilder({
            rootUrl: this._rootUrl,
            emit: (spec: ISeoPage) => this.emit(spec),
        });
    }

    private _createSitewideBuilder(): ISitewideBuilder {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const _this = this;
        return {
            setBreadcrumb(items) {
                _this._siteBreadcrumbItems = items;
                return this;
            },
            setKeywords(...keywords) {
                _this._siteKeywords = [...new Set(keywords.flat())];
                return this;
            },
            setBaseGraphNode(node: JsonLdObject): ISitewideBuilder {
                const id = node["@id"] as string;
                _this._manualBaseNodes.set(id, node);
                _this._baseNodeIds.add(id);
                _this._renderGraphNode(id, node);
                return this;
            },
            setLogo(options): ISitewideBuilder {
                const logoNode: JsonLdObject = {
                    "@type": "ImageObject",
                    "@id": _this._logoId,
                    "url": options.url,
                    "width": options.width,
                    "height": options.height,
                } as unknown as JsonLdObject;
                if (options.caption) {
                    (logoNode as unknown as Record<string, unknown>)["caption"] = options.caption;
                }
                _this._manualBaseNodes.set(_this._logoId, logoNode);
                _this._baseNodeIds.add(_this._logoId);
                _this._renderGraphNode(_this._logoId, logoNode);

                _this._ensureLoaded();
                const orgIdx = _this._findNodeIndex(_this._graphNodes, _this._organizationId);
                if (orgIdx !== -1) {
                    const orgNode = _this._graphNodes[orgIdx] as unknown as Record<string, unknown>;
                    if (!orgNode["logo"]) {
                        _this._updateRenderedJsonLdBlock(_this._organizationId, {"logo": {"@id": _this._logoId}});
                    }
                }
                const appIdx = _this._findNodeIndex(_this._graphNodes, _this._webApplicationId);
                if (appIdx !== -1) {
                    const appNode = _this._graphNodes[appIdx] as unknown as Record<string, unknown>;
                    if (!appNode["logo"]) {
                        _this._updateRenderedJsonLdBlock(_this._webApplicationId, {"logo": {"@id": _this._logoId}});
                    }
                }
                return this;
            },
            setOrganization(options): ISitewideBuilder {
                const orgNode: Record<string, unknown> = {
                    "@type": "Organization",
                    "@id": _this._organizationId,
                    "name": options.name,
                    "url": options.url ?? _this._rootUrl,
                };
                if (options.logo) orgNode["logo"] = options.logo;
                if (options.sameAs) orgNode["sameAs"] = options.sameAs;
                if (options.contactPoint) orgNode["contactPoint"] = options.contactPoint;
                _this._manualBaseNodes.set(_this._organizationId, orgNode as unknown as JsonLdObject);
                _this._baseNodeIds.add(_this._organizationId);
                _this._renderGraphNode(_this._organizationId, orgNode);

                _this._ensureLoaded();
                const appIdx = _this._findNodeIndex(_this._graphNodes, _this._webApplicationId);
                if (appIdx !== -1) {
                    const appNode = _this._graphNodes[appIdx] as unknown as Record<string, unknown>;
                    if (!appNode["publisher"]) {
                        _this._updateRenderedJsonLdBlock(_this._webApplicationId, {"publisher": {"@id": _this._organizationId}});
                    }
                }
                return this;
            },
            setWebApplication(options): ISitewideBuilder {
                const appNode: Record<string, unknown> = {
                    "@type": ["WebApplication", "SoftwareApplication"],
                    "@id": _this._webApplicationId,
                    "name": options.name,
                    "url": options.url ?? _this._rootUrl,
                    "operatingSystem": options.operatingSystem ?? "All",
                    "offers": {
                        "@type": "Offer",
                        "price": "0",
                        "priceCurrency": "USD",
                    },
                };
                if (options.description) appNode["description"] = options.description;
                if (options.softwareVersion) appNode["softwareVersion"] = options.softwareVersion;
                if (options.applicationCategory) appNode["applicationCategory"] = options.applicationCategory;
                _this._manualBaseNodes.set(_this._webApplicationId, appNode as unknown as JsonLdObject);
                _this._baseNodeIds.add(_this._webApplicationId);
                _this._renderGraphNode(_this._webApplicationId, appNode);
                return this;
            },
        };
    }

    private _applyTitle(title: string): void {
        this._pageTitle = title;
        const suffix = this._pageTitleSuffix || "";
        document.title = `${title}${suffix}`;
        this._setMeta('og:title', title, true);
        this._setMeta('twitter:title', title);
    }

    private _applyDescription(description: string): void {
        this._setMeta('description', description);
        this._setMeta('og:description', description, true);
        this._setMeta('twitter:description', description);
    }

    private _applyUrl(pathOrUrl: string): void {
        const isAbsolute = /^https?:\/\//i.test(pathOrUrl);
        if (isAbsolute) {
            if (!this._isValidUrl(pathOrUrl)) {
                throw new Error(`Invalid URL: ${pathOrUrl}`);
            }
        } else if (!pathOrUrl.startsWith("/")) {
            throw new Error(`Invalid URL: ${pathOrUrl}`);
        }

        let fullUrl: string;
        if (isAbsolute) {
            const url = new URL(pathOrUrl.toLowerCase());
            const pathAndQuery = `${url.pathname}${url.search}`;
            fullUrl = `${this._rootUrl}${pathAndQuery}`;
        } else {
            fullUrl = this._resolveUrl(pathOrUrl.toLowerCase());
        }
        this._setMeta('og:url', fullUrl, true);
        this._setMeta('twitter:url', fullUrl, true);
        this._setCanonicalOnly(fullUrl);

        try {
            if (this._activePageNodeId) {
                this._updateRenderedJsonLdBlock(this._activePageNodeId, {url: fullUrl});
            }
            if (this._activeArticleNodeId) {
                this._updateRenderedJsonLdBlock(this._activeArticleNodeId, {url: fullUrl});
            }
        } catch {
            void 0;
        }
    }

    private _applyOgType(typeParam: "article" | "website"): void {
        this._setMeta('og:type', typeParam, true);
    }

    private _applyImage(imageUrl: string): void {
        this._setMeta('og:image', imageUrl, true);
        this._setMeta('twitter:image', imageUrl);
    }

    private _applyKeywords(spec: AppendableList<string>): void {
        if (Array.isArray(spec)) {
            this._pageKeywords = [...spec];
        } else {
            const existing = new Set(this._pageKeywords);
            for (const kw of spec.append) existing.add(kw);
            this._pageKeywords = [...existing];
        }
        this._renderKeywords();
    }

    private _applyWebPage(options: WebPageSpec): void {
        const name = options.name ?? this._pageTitle ?? "";
        const fullUrl = this._resolveUrl(options.canonicalPath);
        const webpageId = `${fullUrl}#webpage`;
        this._renderGraphNode(webpageId, {
            "@id": webpageId,
            "@type": "WebPage",
            "url": fullUrl,
            "inLanguage": this._language,
            "name": name,
            "description": options.description,
            "isPartOf": {"@id": this._webApplicationId},
            "image": {"@id": this._logoId},
            "primaryImageOfPage": {"@id": this._logoId},
            ...(options.datePublished ? {"datePublished": options.datePublished} : {}),
            ...(options.dateModified ? {"dateModified": options.dateModified} : {}),
            ...(options.breadcrumb ? {"breadcrumb": {"@id": `${fullUrl}#breadcrumb`}} : {}),
            ...(options.mainEntity ? {"mainEntity": options.mainEntity} : {}),
        });
        if (options.breadcrumb) {
            this._lastBreadcrumbPath = options.canonicalPath;
            if (!this._breadcrumbConfigured) {
                this._applyBreadcrumbAt(options.canonicalPath, []);
            }
        }
    }

    private _applyBreadcrumbAt(canonicalPath: string, itemsOrSpec: AppendableList<BreadcrumbItem>): void {
        if ("append" in itemsOrSpec) {
            const existing = new Set(this._pageBreadcrumbItems);
            for (const it of itemsOrSpec.append) existing.add(it);
            this._pageBreadcrumbItems = [...existing];
            this._breadcrumbConfigured = true;
            this._renderBreadcrumbFromState(this._lastBreadcrumbPath || canonicalPath);
        } else {
            this._lastBreadcrumbPath = canonicalPath;
            this._pageBreadcrumbItems = [...itemsOrSpec];
            this._breadcrumbConfigured = true;
            this._renderBreadcrumbFromState(canonicalPath);
        }
    }

    private _applyArticle(options: ArticleSpec): void {
        const name = options.name ?? this._pageTitle ?? "";
        const headline = options.headline ?? this._pageTitle ?? name;
        const fullUrl = this._resolveUrl(options.canonicalPath);
        const articleId = `${fullUrl}#article`;
        this._renderGraphNode(articleId, {
            "@id": articleId,
            "@type": "Article",
            "name": name,
            "headline": headline,
            "description": options.description,
            "url": fullUrl,
            "image": {"@id": this._logoId},
            "author": {"@id": this._organizationId},
            "publisher": {"@id": this._organizationId},
            ...(options.about ? {"about": options.about} : {}),
            ...(options.articleSection ? {"articleSection": options.articleSection} : {}),
            "mainEntityOfPage": {"@type": "WebPage", "@id": `${fullUrl}#webpage`},
            "datePublished": options.datePublished,
            "dateModified": options.dateModified,
            ...(options.keywords ? {"keywords": options.keywords} : {}),
        });
    }

    private _applyFaqPage(options: FaqPageSpec): void {
        const fullUrl = this._resolveUrl(options.canonicalPath);
        const faqPageId = `${fullUrl}#faqpage`;
        this._renderGraphNode(faqPageId, {
            "@id": faqPageId,
            "@type": "FAQPage",
            "mainEntity": options.mainEntity,
        });
    }

    private _applyTwitterCard(cardType?: "summary" | "summary_large_image" | "app" | "player"): void {
        if (cardType) {
            this._setMeta('twitter:card', cardType);
        }
    }

    private _applyTwitterHandle(username: string): void {
        this._setMeta('twitter:site', username.startsWith('@') ? username : `@${username}`);
    }

    private _applyStatusCode(statusCodeParam: number): void {
        this._setMeta("prerender-status-code", statusCodeParam.toString());
    }

    private _applyResponseStatusCode(statusCodeParam: number): void {
        this._setMeta("response-http-status", statusCodeParam.toString());
    }

    private _applyNoIndex(): void {
        this._setMeta("robots", "noindex, nofollow");
    }

    private _applyCanonicalUrl(path: string): void {
        const fullUrl = this._resolveUrl(path);
        this._setCanonicalOnly(fullUrl);
    }

    public getDefaults(): SeoConfig {
        return this._baseConfig;
    }

    public prepareToNavigate(): void {
        this._currentTags.forEach(tag => tag.remove());
        this._currentTags.clear();
        const scripts = document.querySelectorAll('script[data-seo="true"]') as NodeListOf<HTMLScriptElement>;
        scripts.forEach(script => script.remove());

        if (this._activePageNodeId && !this._baseNodeIds.has(this._activePageNodeId)) {
            this._activePageNodeId = null;
        }
        if (this._activeArticleNodeId && !this._baseNodeIds.has(this._activeArticleNodeId)) {
            this._activeArticleNodeId = null;
        }

        this._pageTitle = null;
        this._pageBreadcrumbItems = [];
        this._pageKeywords = [];
        this._lastBreadcrumbPath = "";
        this._breadcrumbConfigured = false;

        const mergedNodes: JsonLdObject[] = [];
        for (const seedNode of this._seedNodes) {
            const id = seedNode["@id"] as string;
            const manual = this._manualBaseNodes.get(id);
            mergedNodes.push(manual ?? seedNode);
        }
        for (const [id, node] of this._manualBaseNodes.entries()) {
            if (!this._seedNodes.some(n => n["@id"] === id)) {
                mergedNodes.push(node);
            }
        }
        this._graphNodes = mergedNodes;
        this._graphDirty = true;
        this._commitGraph();

        this._applyPageDefaults();
        this._logger.debug("SEO configurations have been reset.");
    }

    public initialize(config: SeoServiceConfig | string): void {
        if (this._isInitialized) return;

        const resolved = typeof config === "string" ? {rootUrl: config} : config;
        if (resolved.logger) {
            this._logger = resolved.logger;
        }
        this._rootUrl = resolved.rootUrl.replace(/\/+$/, "");
        this._graphScriptId = resolved.graphScriptDomId ?? `${this._rootUrl}/#graph`;
        this._language = resolved.language ?? "en-US";
        this._webApplicationId = resolved.webApplicationId ?? `${this._rootUrl}/#webapplication`;
        this._logoId = resolved.logoId ?? `${this._rootUrl}/#logo`;
        this._organizationId = resolved.organizationId ?? `${this._rootUrl}/#organization`;

        const hostname = new URL(this._rootUrl).hostname;
        this._baseConfig = HtmlSeoConfigParser(hostname, this._graphScriptId);

        this._ensureLoaded();

        const siteName = resolved.siteTitle ?? this._baseConfig.siteName ?? "";
        this._pageTitleSuffix = resolved.pageTitleSuffix ?? (siteName ? ` | ${siteName}` : "");

        if (resolved.defaultKeywords) {
            this._siteKeywords = [...new Set(resolved.defaultKeywords)];
        } else if (this._baseConfig.keywords?.length) {
            this._siteKeywords = [...this._baseConfig.keywords];
        }

        this._applyPageDefaults();
        this._isInitialized = true;
        this._logger.debug("SEO configurations have been initialized.");
    }

    public resolveUrl(path: string): string {
        return this._resolveUrl(path);
    }

    public setSiteName(nameParam: string): this {
        this._setMeta('og:site_name', nameParam, true);
        this._setMeta("apple-mobile-web-app-title", nameParam);

        return this;
    }

    public setUrl(pathOrUrl: string): this {
        this._applyUrl(pathOrUrl);
        return this;
    }

    public emit(seoPage: ISeoPage): void {
        const webPageSpec = seoPage.webPage;
        const articleSpec = seoPage.article;
        const faqPageSpec = seoPage.faqPage;

        if (seoPage.title !== undefined) {
            this._applyTitle(seoPage.title);
        }
        if (seoPage.description !== undefined) {
            this._applyDescription(seoPage.description);
        }
        if (webPageSpec) {
            this._applyWebPage(webPageSpec);
        }
        if (articleSpec) {
            this._applyArticle(articleSpec);
        }
        if (faqPageSpec) {
            this._applyFaqPage(faqPageSpec);
        }
        if (seoPage.breadcrumbs !== undefined) {
            this._applyBreadcrumbAt(this._lastBreadcrumbPath, seoPage.breadcrumbs);
        }
        if (seoPage.url !== undefined) {
            this._applyUrl(seoPage.url);
        }
        if (seoPage.ogType !== undefined) {
            this._applyOgType(seoPage.ogType);
        }
        if (seoPage.image !== undefined) {
            this._applyImage(seoPage.image);
        }
        if (seoPage.keywords !== undefined) {
            this._applyKeywords(seoPage.keywords);
        }
        if (seoPage.twitter?.card !== undefined) {
            this._applyTwitterCard(seoPage.twitter.card);
        }
        if (seoPage.twitter?.handle !== undefined) {
            this._applyTwitterHandle(seoPage.twitter.handle);
        }
        if (seoPage.statusCode !== undefined) {
            this._applyStatusCode(seoPage.statusCode);
        }
        if (seoPage.responseHttpStatus !== undefined) {
            this._applyResponseStatusCode(seoPage.responseHttpStatus);
        }
        if (seoPage.noIndex === true) {
            this._applyNoIndex();
        }
        if (seoPage.canonicalPath !== undefined) {
            this._applyCanonicalUrl(seoPage.canonicalPath);
        }
    }

    private _resolveUrl(pathOrUrl: string): string {
        if (/^https?:\/\//i.test(pathOrUrl)) {
            return pathOrUrl;
        }
        const normalizedPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
        return `${this._rootUrl}${normalizedPath}`;
    }

    private _renderKeywords(): void {
        const keywordListString = this._pageKeywords.join(', ');
        this._setMeta('keywords', keywordListString);
        this._setMeta('og:keywords', keywordListString, true);

        try {
            if (this._activeArticleNodeId) {
                this._updateRenderedJsonLdBlock(this._activeArticleNodeId, {keywords: keywordListString});
            }
        } catch {
            void 0;
        }
    }

    private _renderBreadcrumbFromState(canonicalPath: string): void {
        const combined = [...this._siteBreadcrumbItems, ...this._pageBreadcrumbItems];
        if (combined.length === 0) return;
        const resolvedPath = canonicalPath || (typeof window !== "undefined" ? window.location.pathname : "");
        const fullUrl = this._resolveUrl(resolvedPath);
        const breadcrumbId = `${fullUrl}#breadcrumb`;
        this._renderGraphNode(breadcrumbId, {
            "@id": breadcrumbId,
            "name": "Breadcrumbs",
            "@type": "BreadcrumbList",
            "itemListElement": combined.map((item, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "item": {
                    "@id": this._resolveUrl(item.url),
                    "@type": "Thing",
                    "name": item.name,
                },
            })),
        });
    }

    private _renderGraphNode(ldId: string, data: object, updateIfExistsParam: boolean = true): void {
        this._ensureLoaded();
        const idx = this._findNodeIndex(this._graphNodes, ldId);
        const node = this._stripContext(data) as unknown as JsonLdObject;

        if (idx !== -1) {
            if (!updateIfExistsParam) {
                throw new Error(`JSON-LD with id ${ldId} already exists`);
            }
            this._graphNodes[idx] = this._withId(node, ldId);
        } else {
            this._graphNodes.push(this._withId(node, ldId));
        }

        const type = node["@type"];
        if (type === "WebPage") {
            this._activePageNodeId = ldId;
        } else if (type === "Article") {
            this._activeArticleNodeId = ldId;
        }

        this._graphDirty = true;
        this._commitGraph();
    }

    private _ensureLoaded(): void {
        if (this._graphHydrated) return;
        const fromConfig = this._baseConfig?.jsonLd;
        let nodes: JsonLdObject[];
        if (fromConfig) {
            const items = Array.isArray(fromConfig) ? fromConfig : [fromConfig];
            nodes = items.map(item => this._stripContext(item.data) as unknown as JsonLdObject)
                .map(node => this._withId(node, node["@id"] as string));
        } else {
            const doc = this._readGraphDocument();
            nodes = doc ? [...doc["@graph"]] : [];
        }
        this._seedNodes = [...nodes];
        this._graphNodes = nodes;
        this._graphHydrated = true;
        this._graphDirty = false;
    }

    private _commitGraph(): void {
        if (!this._graphDirty) return;
        this._serializeGraph();
        this._graphDirty = false;
    }

    private _readGraphDocument(): GraphScriptDocument | null {
        if (this._graphHydrated) {
            return {"@context": SeoService.GRAPH_CONTEXT, "@graph": [...this._graphNodes]};
        }
        const script = document.querySelector(`script[data-id="${this._graphScriptId}"]`) as HTMLScriptElement | null;
        if (!script?.textContent) {
            return {"@context": SeoService.GRAPH_CONTEXT, "@graph": []};
        }
        try {
            const parsed = JSON.parse(script.textContent);
            if (parsed && typeof parsed === 'object' && Array.isArray(parsed["@graph"])) {
                return {
                    "@context": parsed["@context"] ?? SeoService.GRAPH_CONTEXT,
                    "@graph": parsed["@graph"] as JsonLdObject[],
                };
            }
            return {"@context": SeoService.GRAPH_CONTEXT, "@graph": []};
        } catch (e) {
            this._logger.error('Failed to parse JSON-LD graph', e);
            return null;
        }
    }

    private _serializeGraph(): void {
        let script = document.querySelector(`script[data-id="${this._graphScriptId}"]`) as HTMLScriptElement | null;
        if (!script) {
            script = document.createElement('script');
            script.type = 'application/ld+json';
            script.setAttribute('data-id', this._graphScriptId);
            document.head.appendChild(script);
        }
        script.text = JSON.stringify({"@context": SeoService.GRAPH_CONTEXT, "@graph": this._graphNodes});
    }

    private _findNodeIndex(nodes: JsonLdObject[], id: string): number {
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i]?.["@id"] === id) return i;
        }
        return -1;
    }

    private _stripContext(value: unknown): Record<string, unknown> {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            const copy = {...(value as Record<string, unknown>)};
            delete copy["@context"];
            return copy;
        }
        return {};
    }

    private _withId(node: JsonLdObject, id: string): JsonLdObject {
        (node as unknown as Record<string, unknown>)["@id"] = id;
        return node;
    }

    private _setMeta(nameOrProperty: string, content: string, isProperty = false): void {
        if (!content) return;

        const selector = isProperty || nameOrProperty.startsWith('og:')
            ? `meta[property="${nameOrProperty}"]`
            : `meta[name="${nameOrProperty}"]`;

        let meta = document.querySelector(selector) as HTMLMetaElement;

        if (!meta) {
            meta = document.createElement('meta');
            if (isProperty) {
                meta.setAttribute('property', nameOrProperty);
            } else {
                meta.setAttribute('name', nameOrProperty);
            }

            document.head.appendChild(meta);
            this._currentTags.add(meta);
        }

        meta.setAttribute('data-seo', 'true');
        meta.content = content;
    }

    private _setCanonicalOnly(url: string): void {
        let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;

        if (!link) {
            link = document.createElement('link');
            link.rel = 'canonical';
            document.head.appendChild(link);
            this._currentTags.add(link);
        }

        link.setAttribute('data-seo', 'true');
        const parsed = new URL(url);
        link.href = parsed.origin + parsed.pathname;
    }

    private _applyPageDefaults(): void {
        const {title, description, og, twitter} = this._baseConfig;

        if (title) this._applyTitle(title);
        if (description) this._applyDescription(description);

        this._setMeta('og:site_name', this._baseConfig.siteName, true);
        this._setMeta("apple-mobile-web-app-title", this._baseConfig.siteName);
        this._setMeta("robots", this._baseConfig.robots);
        this._applyUrl(window.location.href);
        this._applyImage(this._baseConfig.logoUrl);

        if (this._siteKeywords.length > 0) {
            this._pageKeywords = [...this._siteKeywords];
            this._renderKeywords();
        }

        if (og) {
            this._setMeta('og:type', og.type, true);
            if (og.imageWidth) this._setMeta('og:image:width', og.imageWidth.toString(), true);
            if (og.imageHeight) this._setMeta('og:image:height', og.imageHeight.toString(), true);
            this._setMeta("og:logo", og.imageUrl ?? this._baseConfig.logoUrl, true);
        }

        if (twitter) {
            this._setMeta('twitter:card', twitter.cardType);
            this._setMeta('twitter:site', twitter.handleId);
            this._setMeta('twitter:domain', twitter.domain, true);
        }

        this._manualBaseNodes.forEach((node, id) => {
            this._renderGraphNode(id, node);
        });
    }

    private _updateRenderedJsonLdBlock(ldId: string, partial: Record<string, unknown>): void {
        this._ensureLoaded();

        const idx = this._findNodeIndex(this._graphNodes, ldId);
        if (idx === -1) {
            throw new Error(`JSON-LD with id ${ldId} does not exist`);
        }

        const existing = this._graphNodes[idx] as unknown as Record<string, unknown>;
        this._graphNodes[idx] = {...existing, ...partial} as unknown as JsonLdObject;
        this._graphDirty = true;
        this._commitGraph();
    }

    private _isValidUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
}
