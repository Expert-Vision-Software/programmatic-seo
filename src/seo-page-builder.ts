import type {Thing} from "schema-dts";
import type {BreadcrumbItem, FaqPageSpec, ISeoPage, TwitterSpec, WebPageSpec, ArticleSpec} from "./seo-page.js";
import {normalizeSeoDate} from "./seo-specs.js";
import type {SeoDateInput} from "./seo-specs.js";

export interface ISeoBuilderTarget {
    readonly rootUrl: string;
    emit(seoPage: ISeoPage): void;
}

export interface IPageBuilder {
    setTitle(title: string): IPageBuilder;
    setDescription(description: string): IPageBuilder;
    setUrl(url: string): IPageBuilder;
    setCanonicalPath(path: string): IPageBuilder;
    setOgType(type: "article" | "website"): IPageBuilder;
    setImage(image: string): IPageBuilder;
    setKeywords(...keywords: (string | string[])[]): IPageBuilder;
    appendKeywords(...keywords: (string | string[])[]): IPageBuilder;
    setBreadcrumbs(items: readonly BreadcrumbItem[]): IPageBuilder;
    appendBreadcrumbs(items: readonly BreadcrumbItem[]): IPageBuilder;
    setNoIndex(): IPageBuilder;
    setStatusCode(code: number): IPageBuilder;
    setResponseHttpStatus(code: number): IPageBuilder;
    setTwitter(options: TwitterSpec): IPageBuilder;
    setWebPage(spec: {
        canonicalPath?: string;
        name?: string;
        description?: string;
        datePublished?: SeoDateInput;
        dateModified?: SeoDateInput;
        breadcrumb?: boolean;
        mainEntity?: Thing | Thing[];
    }): IPageBuilder;
    setArticle(spec: {
        canonicalPath?: string;
        name?: string;
        headline?: string;
        description?: string;
        datePublished?: SeoDateInput;
        dateModified?: SeoDateInput;
        about?: Thing;
        articleSection?: string;
        keywords?: string;
    }): IPageBuilder;
    setFaqPage(spec: FaqPageSpec): IPageBuilder;
    contentPage(): ContentPageBuilder;
    emit(): void;
    build(): ISeoPage;
}

interface WebPageInputState {
    canonicalPath?: string;
    name?: string;
    description?: string;
    datePublished?: string;
    dateModified?: string;
    breadcrumb?: boolean;
    mainEntity?: Thing | Thing[];
}

interface ArticleInputState {
    canonicalPath?: string;
    name?: string;
    headline?: string;
    description?: string;
    datePublished?: string;
    dateModified?: string;
    about?: Thing;
    articleSection?: string;
    keywords?: string;
}

interface BuilderState {
    title?: string;
    description?: string;
    url?: string;
    canonicalPath?: string;
    ogType?: "article" | "website";
    image?: string;
    keywords?: string[];
    breadcrumbs?: BreadcrumbItem[];
    noIndex?: boolean;
    statusCode?: number;
    responseHttpStatus?: number;
    twitter?: TwitterSpec;
    webPage?: WebPageInputState;
    article?: ArticleInputState;
    faqPage?: FaqPageSpec;
}

export class ContentPageBuilder {
    private readonly _parent: SeoPageBuilder;
    private readonly _state: BuilderState;

    constructor(parent: SeoPageBuilder, state: BuilderState) {
        this._parent = parent;
        this._state = state;
    }

    public setDates(dates: {published?: SeoDateInput; modified?: SeoDateInput}): ContentPageBuilder {
        if (dates.published !== undefined) {
            this._ensureWebPage().datePublished = normalizeSeoDate(dates.published);
            this._ensureArticle().datePublished = normalizeSeoDate(dates.published);
        }
        if (dates.modified !== undefined) {
            this._ensureWebPage().dateModified = normalizeSeoDate(dates.modified);
            this._ensureArticle().dateModified = normalizeSeoDate(dates.modified);
        }
        return this;
    }

    public setAbout(about: string | Thing): ContentPageBuilder {
        const article = this._ensureArticle();
        if (typeof about === "string") {
            article.about = {"@type": "Thing", "name": about} as Thing;
            article.articleSection = about;
        } else {
            article.about = about;
        }
        return this;
    }

    public setSection(section: string): ContentPageBuilder {
        this._ensureArticle().articleSection = section;
        return this;
    }

    public setQuestion(question: {
        name: string;
        answerText: string;
        answerUrl?: string;
    }): ContentPageBuilder {
        const resolvedUrl = question.answerUrl;
        const answer: Record<string, unknown> = {
            "@type": "Answer",
            "text": question.answerText,
        };
        if (resolvedUrl) {
            answer["url"] = resolvedUrl;
        }
        this._ensureWebPage().mainEntity = {
            "@type": "Question",
            "name": question.name,
            "acceptedAnswer": answer,
        } as unknown as Thing;
        return this;
    }

    public setTitle(title: string): ContentPageBuilder {
        this._parent.setTitle(title);
        return this;
    }

    public setDescription(description: string): ContentPageBuilder {
        this._parent.setDescription(description);
        return this;
    }

    public setUrl(url: string): ContentPageBuilder {
        this._parent.setUrl(url);
        return this;
    }

    public setCanonicalPath(path: string): ContentPageBuilder {
        this._parent.setCanonicalPath(path);
        return this;
    }

    public setOgType(type: "article" | "website"): ContentPageBuilder {
        this._parent.setOgType(type);
        return this;
    }

    public setImage(image: string): ContentPageBuilder {
        this._parent.setImage(image);
        return this;
    }

    public setKeywords(...keywords: (string | string[])[]): ContentPageBuilder {
        this._parent.setKeywords(...keywords);
        return this;
    }

    public appendKeywords(...keywords: (string | string[])[]): ContentPageBuilder {
        this._parent.appendKeywords(...keywords);
        return this;
    }

    public setBreadcrumbs(items: readonly BreadcrumbItem[]): ContentPageBuilder {
        this._parent.setBreadcrumbs(items);
        return this;
    }

    public appendBreadcrumbs(items: readonly BreadcrumbItem[]): ContentPageBuilder {
        this._parent.appendBreadcrumbs(items);
        return this;
    }

    public setNoIndex(): ContentPageBuilder {
        this._parent.setNoIndex();
        return this;
    }

    public setStatusCode(code: number): ContentPageBuilder {
        this._parent.setStatusCode(code);
        return this;
    }

    public setResponseHttpStatus(code: number): ContentPageBuilder {
        this._parent.setResponseHttpStatus(code);
        return this;
    }

    public setTwitter(options: TwitterSpec): ContentPageBuilder {
        this._parent.setTwitter(options);
        return this;
    }

    public setWebPage(spec: {
        canonicalPath?: string;
        name?: string;
        description?: string;
        datePublished?: SeoDateInput;
        dateModified?: SeoDateInput;
        breadcrumb?: boolean;
        mainEntity?: Thing | Thing[];
    }): ContentPageBuilder {
        this._parent.setWebPage(spec);
        return this;
    }

    public setArticle(spec: {
        canonicalPath?: string;
        name?: string;
        headline?: string;
        description?: string;
        datePublished?: SeoDateInput;
        dateModified?: SeoDateInput;
        about?: Thing;
        articleSection?: string;
        keywords?: string;
    }): ContentPageBuilder {
        this._parent.setArticle(spec);
        return this;
    }

    public setFaqPage(spec: FaqPageSpec): ContentPageBuilder {
        this._parent.setFaqPage(spec);
        return this;
    }

    public emit(): void {
        this._parent.emit();
    }

    public build(): ISeoPage {
        return this._parent.build();
    }

    public end(): SeoPageBuilder {
        return this._parent;
    }

    private _ensureWebPage(): WebPageInputState {
        if (!this._state.webPage) {
            this._state.webPage = {};
        }
        return this._state.webPage;
    }

    private _ensureArticle(): ArticleInputState {
        if (!this._state.article) {
            this._state.article = {};
        }
        return this._state.article;
    }
}

export class SeoPageBuilder implements IPageBuilder {
    private readonly _state: BuilderState = {};
    private readonly _target: ISeoBuilderTarget;

    constructor(target: ISeoBuilderTarget) {
        this._target = target;
    }

    public setTitle(title: string): this {
        this._state.title = title;
        return this;
    }

    public setDescription(description: string): this {
        this._state.description = description;
        return this;
    }

    public setUrl(url: string): this {
        this._guardUrl(url);
        this._state.url = url;
        return this;
    }

    public setCanonicalPath(path: string): this {
        this._guardUrl(path);
        this._state.canonicalPath = path;
        return this;
    }

    public setOgType(type: "article" | "website"): this {
        this._state.ogType = type;
        return this;
    }

    public setImage(image: string): this {
        this._state.image = image;
        return this;
    }

    public setKeywords(...keywords: (string | string[])[]): this {
        this._state.keywords = [...new Set([...(this._state.keywords ?? []), ...keywords.flat()])];
        return this;
    }

    public appendKeywords(...keywords: (string | string[])[]): this {
        return this.setKeywords(...keywords);
    }

    public setBreadcrumbs(items: readonly BreadcrumbItem[]): this {
        this._state.breadcrumbs = [...items];
        return this;
    }

    public appendBreadcrumbs(items: readonly BreadcrumbItem[]): this {
        this._state.breadcrumbs = [...(this._state.breadcrumbs ?? []), ...items];
        return this;
    }

    public setNoIndex(): this {
        this._state.noIndex = true;
        return this;
    }

    public setStatusCode(code: number): this {
        this._state.statusCode = code;
        return this;
    }

    public setResponseHttpStatus(code: number): this {
        this._state.responseHttpStatus = code;
        return this;
    }

    public setTwitter(options: TwitterSpec): this {
        this._state.twitter = options;
        return this;
    }

    public setWebPage(spec: {
        canonicalPath?: string;
        name?: string;
        description?: string;
        datePublished?: SeoDateInput;
        dateModified?: SeoDateInput;
        breadcrumb?: boolean;
        mainEntity?: Thing | Thing[];
    }): this {
        if (spec.canonicalPath) this._guardUrl(spec.canonicalPath);
        if (!this._state.webPage) {
            this._state.webPage = {};
        }
        if (spec.canonicalPath !== undefined) this._state.webPage.canonicalPath = spec.canonicalPath;
        if (spec.name !== undefined) this._state.webPage.name = spec.name;
        if (spec.description !== undefined) this._state.webPage.description = spec.description;
        if (spec.datePublished !== undefined) this._state.webPage.datePublished = normalizeSeoDate(spec.datePublished);
        if (spec.dateModified !== undefined) this._state.webPage.dateModified = normalizeSeoDate(spec.dateModified);
        if (spec.breadcrumb !== undefined) this._state.webPage.breadcrumb = spec.breadcrumb;
        if (spec.mainEntity !== undefined) this._state.webPage.mainEntity = spec.mainEntity;
        return this;
    }

    public setArticle(spec: {
        canonicalPath?: string;
        name?: string;
        headline?: string;
        description?: string;
        datePublished?: SeoDateInput;
        dateModified?: SeoDateInput;
        about?: Thing;
        articleSection?: string;
        keywords?: string;
    }): this {
        if (spec.canonicalPath) this._guardUrl(spec.canonicalPath);
        if (!this._state.article) {
            this._state.article = {};
        }
        if (spec.canonicalPath !== undefined) this._state.article.canonicalPath = spec.canonicalPath;
        if (spec.name !== undefined) this._state.article.name = spec.name;
        if (spec.headline !== undefined) this._state.article.headline = spec.headline;
        if (spec.description !== undefined) this._state.article.description = spec.description;
        if (spec.datePublished !== undefined) this._state.article.datePublished = normalizeSeoDate(spec.datePublished);
        if (spec.dateModified !== undefined) this._state.article.dateModified = normalizeSeoDate(spec.dateModified);
        if (spec.about !== undefined) this._state.article.about = spec.about;
        if (spec.articleSection !== undefined) this._state.article.articleSection = spec.articleSection;
        if (spec.keywords !== undefined) this._state.article.keywords = spec.keywords;
        return this;
    }

    public setFaqPage(spec: FaqPageSpec): this {
        if (spec.canonicalPath) this._guardUrl(spec.canonicalPath);
        this._state.faqPage = spec;
        return this;
    }

    public contentPage(): ContentPageBuilder {
        if (!this._state.webPage) {
            this._state.webPage = {breadcrumb: true};
        }
        if (!this._state.article) {
            this._state.article = {};
        }
        this._state.ogType = "article";
        return new ContentPageBuilder(this, this._state);
    }

    public emit(): void {
        this._target.emit(this.build());
    }

    public build(): ISeoPage {
        const s = this._state;
        const effectiveUrl = s.url;
        const effectiveCanonicalPath = s.canonicalPath
            ?? (effectiveUrl && !/^https?:\/\//i.test(effectiveUrl) ? effectiveUrl : undefined)
            ?? (s.webPage?.canonicalPath)
            ?? (s.article?.canonicalPath);

        let webPageSpec: WebPageSpec | undefined;
        const webPageCp = effectiveCanonicalPath ?? effectiveUrl;
        if (webPageCp || (s.webPage && (s.webPage.breadcrumb !== undefined || s.webPage.mainEntity !== undefined || s.webPage.datePublished !== undefined || s.webPage.dateModified !== undefined))) {
            const s2 = s.webPage ?? {};
            webPageSpec = {
                canonicalPath: s2.canonicalPath ?? webPageCp ?? "",
                name: s2.name ?? s.title,
                description: s2.description ?? s.description ?? "",
                datePublished: s2.datePublished ?? "",
                dateModified: s2.dateModified ?? "",
                breadcrumb: s2.breadcrumb,
                mainEntity: s2.mainEntity,
            };
        }

        let articleSpec: ArticleSpec | undefined;
        if (s.article !== undefined) {
            const articleCp = effectiveCanonicalPath ?? effectiveUrl;
            const s2 = s.article;
            const articleKeywords = s2.keywords ?? (s.keywords ? s.keywords.join(", ") : undefined);
            articleSpec = {
                canonicalPath: s2.canonicalPath ?? articleCp ?? "",
                name: s2.name ?? s.title,
                headline: s2.headline ?? s.title,
                description: s2.description ?? s.description ?? "",
                datePublished: s2.datePublished ?? "",
                dateModified: s2.dateModified ?? "",
                about: s2.about,
                articleSection: s2.articleSection,
                keywords: articleKeywords,
            };
        }

        const spec: ISeoPage = {};
        if (s.title !== undefined) spec.title = s.title;
        if (s.description !== undefined) spec.description = s.description;
        if (effectiveUrl !== undefined) spec.url = effectiveUrl;
        if (s.canonicalPath !== undefined) {
            spec.canonicalPath = s.canonicalPath;
        }
        if (s.ogType !== undefined) spec.ogType = s.ogType;
        if (s.image !== undefined) spec.image = s.image;
        if (s.keywords !== undefined) spec.keywords = s.keywords;
        if (s.breadcrumbs !== undefined) spec.breadcrumbs = s.breadcrumbs;
        if (s.noIndex !== undefined) spec.noIndex = s.noIndex;
        if (s.statusCode !== undefined) spec.statusCode = s.statusCode;
        if (s.responseHttpStatus !== undefined) spec.responseHttpStatus = s.responseHttpStatus;
        if (s.twitter !== undefined) spec.twitter = s.twitter;
        if (webPageSpec !== undefined) spec.webPage = webPageSpec as WebPageSpec;
        if (articleSpec !== undefined) spec.article = articleSpec as ArticleSpec;
        if (s.faqPage !== undefined) spec.faqPage = s.faqPage;
        return spec;
    }

    private _guardUrl(pathOrUrl: string): void {
        if (/^https?:\/\//i.test(pathOrUrl)) {
            try {
                const origin = new URL(pathOrUrl).origin;
                const rootOrigin = new URL(this._target.rootUrl).origin;
                if (origin === rootOrigin) {
                    throw new Error(
                        `Use relative url when referring to same website. If you mean to set to another site's root url, it cannot match the value of '${this._target.rootUrl}'.`
                    );
                }
            } catch (e) {
                if (e instanceof TypeError) return;
                throw e;
            }
        }
    }
}

export function createBuilder(target: ISeoBuilderTarget): IPageBuilder {
    return new SeoPageBuilder(target);
}
