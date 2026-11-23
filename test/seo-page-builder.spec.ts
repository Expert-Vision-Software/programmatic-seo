import {describe, expect, it, beforeEach} from "vitest";
import {SeoPageBuilder, ContentPageBuilder, createBuilder} from "../src/index.js";
import type {ISeoBuilderTarget, IPageBuilder} from "../src/index.js";
import type {ISeoPage} from "../src/index.js";
import type {WebPageSpec, ArticleSpec} from "../src/index.js";

describe("SeoPageBuilder", () => {
    let emittedSpecs: ISeoPage[] = [];

    const target: ISeoBuilderTarget = {
        rootUrl: "https://billgrokker.com",
        emit: (spec: ISeoPage) => { emittedSpecs.push(spec); },
    };

    beforeEach(() => {
        emittedSpecs = [];
    });

    describe("URL guard", () => {
        it("throws when same-site absolute URL is passed to setUrl", () => {
            const builder = createBuilder(target);
            expect(() => builder.setUrl("https://billgrokker.com/bills/hr-1")).toThrow(
                /Use relative url when referring to same website/
            );
        });

        it("throws when same-site absolute URL is passed to setCanonicalPath", () => {
            const builder = createBuilder(target);
            expect(() => builder.setCanonicalPath("https://billgrokker.com/bills/hr-1")).toThrow(
                /Use relative url when referring to same website/
            );
        });

        it("throws when same-site absolute URL is passed to setWebPage", () => {
            const builder = createBuilder(target);
            expect(() => builder.setWebPage({canonicalPath: "https://billgrokker.com/bills/hr-1"})).toThrow(
                /Use relative url when referring to same website/
            );
        });

        it("throws when same-site absolute URL is passed to setArticle", () => {
            const builder = createBuilder(target);
            expect(() => builder.setArticle({canonicalPath: "https://billgrokker.com/bills/hr-1"})).toThrow(
                /Use relative url when referring to same website/
            );
        });

        it("allows off-site absolute URL in setUrl", () => {
            const builder = createBuilder(target);
            expect(() => builder.setUrl("https://other-site.com/page")).not.toThrow();
        });

        it("allows relative URL in setUrl", () => {
            const builder = createBuilder(target);
            expect(() => builder.setUrl("/bills/hr-1")).not.toThrow();
        });

        it("allows relative URL in setCanonicalPath", () => {
            const builder = createBuilder(target);
            expect(() => builder.setCanonicalPath("/bills/hr-1")).not.toThrow();
        });

        it("does not guard setImage (og:image accepts absolute URLs)", () => {
            const builder = createBuilder(target);
            expect(() => builder.setImage("https://other-site.com/image.png")).not.toThrow();
        });
    });

    describe("ContentPageBuilder URL guard", () => {
        it("throws when same-site absolute URL is passed to setUrl", () => {
            const builder = createBuilder(target);
            const cp = builder.contentPage();
            expect(() => cp.setUrl("https://billgrokker.com/bills/hr-1")).toThrow(
                /Use relative url when referring to same website/
            );
        });

        it("throws when same-site absolute URL is passed to setCanonicalPath", () => {
            const builder = createBuilder(target);
            const cp = builder.contentPage();
            expect(() => cp.setCanonicalPath("https://billgrokker.com/bills/hr-1")).toThrow(
                /Use relative url when referring to same website/
            );
        });

        it("throws when same-site absolute URL is passed to setWebPage", () => {
            const builder = createBuilder(target);
            const cp = builder.contentPage();
            expect(() => cp.setWebPage({canonicalPath: "https://billgrokker.com/bills/hr-1"})).toThrow(
                /Use relative url when referring to same website/
            );
        });

        it("throws when same-site absolute URL is passed to setArticle", () => {
            const builder = createBuilder(target);
            const cp = builder.contentPage();
            expect(() => cp.setArticle({canonicalPath: "https://billgrokker.com/bills/hr-1"})).toThrow(
                /Use relative url when referring to same website/
            );
        });

        it("throws when same-site absolute URL is passed to setFaqPage", () => {
            const builder = createBuilder(target);
            const cp = builder.contentPage();
            expect(() => cp.setFaqPage({canonicalPath: "https://billgrokker.com/bills/hr-1"})).toThrow(
                /Use relative url when referring to same website/
            );
        });

        it("does not guard setImage (og:image accepts absolute URLs)", () => {
            const builder = createBuilder(target);
            const cp = builder.contentPage();
            expect(() => cp.setImage("https://other-site.com/image.png")).not.toThrow();
        });
    });

    describe("chainability", () => {
        it("setTitle returns same builder instance", () => {
            const builder = createBuilder(target);
            const result = builder.setTitle("Test");
            expect(result).toBe(builder);
        });

        it("setDescription returns same builder instance", () => {
            const builder = createBuilder(target);
            const result = builder.setDescription("Description");
            expect(result).toBe(builder);
        });

        it("setUrl returns same builder instance", () => {
            const builder = createBuilder(target);
            const result = builder.setUrl("/page");
            expect(result).toBe(builder);
        });

        it("setKeywords returns same builder instance", () => {
            const builder = createBuilder(target);
            const result = builder.setKeywords("a", "b");
            expect(result).toBe(builder);
        });

        it("appendKeywords returns same builder instance", () => {
            const builder = createBuilder(target);
            const result = builder.appendKeywords("a", "b");
            expect(result).toBe(builder);
        });
    });

    describe("build() output shape", () => {
        it("returns empty ISeoPage when nothing set", () => {
            const builder = createBuilder(target);
            const spec = builder.build();
            expect(spec).toEqual({});
        });

        it("includes title when set", () => {
            const builder = createBuilder(target);
            builder.setTitle("Test Title");
            expect(builder.build().title).toBe("Test Title");
        });

        it("includes description when set", () => {
            const builder = createBuilder(target);
            builder.setDescription("Test description");
            expect(builder.build().description).toBe("Test description");
        });

        it("includes url when set with relative path", () => {
            const builder = createBuilder(target);
            builder.setUrl("/bills/hr-1");
            expect(builder.build().url).toBe("/bills/hr-1");
        });

        it("includes canonicalPath when set", () => {
            const builder = createBuilder(target);
            builder.setCanonicalPath("/bills/hr-1");
            expect(builder.build().canonicalPath).toBe("/bills/hr-1");
        });

        it("does not include url when canonicalPath is set without url", () => {
            const builder = createBuilder(target);
            builder.setCanonicalPath("/bills/hr-1");
            const spec = builder.build();
            expect(spec.url).toBeUndefined();
            expect(spec.canonicalPath).toBe("/bills/hr-1");
        });

        it("includes ogType when set", () => {
            const builder = createBuilder(target);
            builder.setOgType("article");
            expect(builder.build().ogType).toBe("article");
        });

        it("includes image when set", () => {
            const builder = createBuilder(target);
            builder.setImage("https://other.com/img.png");
            expect(builder.build().image).toBe("https://other.com/img.png");
        });

        it("includes keywords when set", () => {
            const builder = createBuilder(target);
            builder.setKeywords("a", "b");
            expect(builder.build().keywords).toEqual(["a", "b"]);
        });

        it("deduplicates keywords", () => {
            const builder = createBuilder(target);
            builder.setKeywords("a", "a", "b");
            expect(builder.build().keywords).toEqual(["a", "b"]);
        });

        it("includes noIndex when set", () => {
            const builder = createBuilder(target);
            builder.setNoIndex();
            expect(builder.build().noIndex).toBe(true);
        });

        it("includes statusCode when set", () => {
            const builder = createBuilder(target);
            builder.setStatusCode(404);
            expect(builder.build().statusCode).toBe(404);
        });

        it("includes breadcrumbs when set", () => {
            const builder = createBuilder(target);
            builder.setBreadcrumbs([{name: "Home", url: "/"}]);
            expect(builder.build().breadcrumbs).toEqual([{name: "Home", url: "/"}]);
        });

        it("setBreadcrumbs replaces breadcrumbs", () => {
            const builder = createBuilder(target);
            builder.setBreadcrumbs([{name: "A", url: "/a"}]);
            builder.setBreadcrumbs([{name: "B", url: "/b"}]);
            expect(builder.build().breadcrumbs).toEqual([{name: "B", url: "/b"}]);
        });

        it("appendBreadcrumbs adds to existing breadcrumbs", () => {
            const builder = createBuilder(target);
            builder.setBreadcrumbs([{name: "A", url: "/a"}]);
            builder.appendBreadcrumbs([{name: "B", url: "/b"}]);
            expect(builder.build().breadcrumbs).toEqual([{name: "A", url: "/a"}, {name: "B", url: "/b"}]);
        });
    });

    describe("root-value inheritance", () => {
        it("title falls through to webPage.name", () => {
            const builder = createBuilder(target);
            builder.setTitle("Page Title").setUrl("/page").setDescription("desc");
            const spec = builder.build();
            expect(spec.webPage).toMatchObject({name: "Page Title"});
        });

        it("title falls through to article.name and article.headline", () => {
            const builder = createBuilder(target);
            builder.setTitle("Page Title").setUrl("/page").setDescription("desc").setArticle({});
            const spec = builder.build();
            expect(spec.article).toMatchObject({name: "Page Title", headline: "Page Title"});
        });

        it("description falls through to webPage.description", () => {
            const builder = createBuilder(target);
            builder.setUrl("/page").setDescription("SEO Description").setWebPage({});
            const spec = builder.build();
            expect(spec.webPage).toMatchObject({description: "SEO Description"});
        });

        it("url falls through to webPage.canonicalPath", () => {
            const builder = createBuilder(target);
            builder.setUrl("/bills/hr-1").setDescription("desc");
            const spec = builder.build();
            expect(spec.webPage).toMatchObject({canonicalPath: "/bills/hr-1"});
        });

        it("url falls through to article.canonicalPath", () => {
            const builder = createBuilder(target);
            builder.setUrl("/bills/hr-1").setDescription("desc").setArticle({});
            const spec = builder.build();
            expect(spec.article).toMatchObject({canonicalPath: "/bills/hr-1"});
        });

        it("setCanonicalPath sets canonicalPath without affecting url", () => {
            const builder = createBuilder(target);
            builder.setUrl("/page").setCanonicalPath("/canonical-page").setDescription("desc");
            const spec = builder.build();
            expect(spec.url).toBe("/page");
            expect(spec.canonicalPath).toBe("/canonical-page");
        });

        it("webPage.name overrides inherited title", () => {
            const builder = createBuilder(target);
            builder.setTitle("Page Title").setUrl("/page").setDescription("desc")
                .setWebPage({name: "Custom WebPage Name"});
            const spec = builder.build();
            expect(spec.webPage).toMatchObject({name: "Custom WebPage Name"});
            expect(spec.article).toBeUndefined();
        });

        it("explicit webPage.canonicalPath overrides inherited url", () => {
            const builder = createBuilder(target);
            builder.setUrl("/page").setDescription("desc")
                .setWebPage({canonicalPath: "/explicit-page"});
            const spec = builder.build();
            expect(spec.webPage).toMatchObject({canonicalPath: "/explicit-page"});
        });
    });

    describe("webPage spec", () => {
        it("setWebPage sets breadcrumb flag", () => {
            const builder = createBuilder(target);
            builder.setWebPage({breadcrumb: true});
            expect(builder.build().webPage).toMatchObject({breadcrumb: true});
        });

        it("setWebPage sets datePublished normalized from DateOnly", () => {
            const builder = createBuilder(target);
            builder.setWebPage({datePublished: "2025-08-01"});
            const spec = builder.build() as ISeoPage & {webPage: WebPageSpec};
            expect(spec.webPage.datePublished).toBe("2025-08-01T00:00:00+00:00");
        });

        it("setWebPage passes dateModified", () => {
            const builder = createBuilder(target);
            builder.setWebPage({dateModified: "2025-08-05"});
            const spec = builder.build() as ISeoPage & {webPage: WebPageSpec};
            expect(spec.webPage.dateModified).toBe("2025-08-05T00:00:00+00:00");
        });
    });

    describe("article spec", () => {
        it("setArticle sets article properties", () => {
            const builder = createBuilder(target);
            builder.setArticle({
                headline: "Article Headline",
                description: "Article desc",
                datePublished: "2025-08-01",
                dateModified: "2025-08-05",
            });
            const spec = builder.build() as ISeoPage & {article: ArticleSpec};
            expect(spec.article.headline).toBe("Article Headline");
            expect(spec.article.description).toBe("Article desc");
            expect(spec.article.datePublished).toBe("2025-08-01T00:00:00+00:00");
            expect(spec.article.dateModified).toBe("2025-08-05T00:00:00+00:00");
        });

        it("article requires content (headline/about) to be included", () => {
            const builder = createBuilder(target);
            builder.setArticle({headline: "Headline"});
            const spec = builder.build();
            expect(spec.article).toBeDefined();
            expect((spec.article as ArticleSpec).headline).toBe("Headline");
        });

        it("article is included when url is set", () => {
            const builder = createBuilder(target);
            builder.setUrl("/article").setArticle({headline: "Headline"});
            const spec = builder.build();
            expect(spec.article).toBeDefined();
        });
    });

    describe("faqPage spec", () => {
        it("setFaqPage sets faqPage", () => {
            const builder = createBuilder(target);
            builder.setFaqPage({mainEntity: []});
            expect(builder.build().faqPage).toEqual({mainEntity: []});
        });
    });

    describe("twitter", () => {
        it("setTwitter sets twitter options", () => {
            const builder = createBuilder(target);
            builder.setTwitter({card: "summary", handle: "@test"});
            const spec = builder.build();
            expect(spec.twitter).toEqual({card: "summary", handle: "@test"});
        });
    });

    describe("emit()", () => {
        it("calls target.emit with built spec", () => {
            const builder = createBuilder(target);
            builder.setTitle("Emit Test").emit();
            expect(emittedSpecs).toHaveLength(1);
            expect(emittedSpecs[0].title).toBe("Emit Test");
        });

        it("emit is idempotent — build does not emit", () => {
            const builder = createBuilder(target);
            builder.setTitle("No Emit");
            builder.build();
            expect(emittedSpecs).toHaveLength(0);
        });

        it("calling emit twice emits twice", () => {
            const builder = createBuilder(target);
            builder.setTitle("First").emit();
            builder.setTitle("Second").emit();
            expect(emittedSpecs).toHaveLength(2);
            expect(emittedSpecs[0].title).toBe("First");
            expect(emittedSpecs[1].title).toBe("Second");
        });
    });

    describe("contentPage()", () => {
        it("returns ContentPageBuilder instance", () => {
            const builder = createBuilder(target);
            const cp = builder.contentPage();
            expect(cp).toBeInstanceOf(ContentPageBuilder);
        });

        it("sets ogType to article on the builder", () => {
            const builder = createBuilder(target);
            builder.contentPage();
            expect(builder.build().ogType).toBe("article");
        });

        it("seeds webPage with breadcrumb: true", () => {
            const builder = createBuilder(target);
            builder.contentPage();
            expect(builder.build().webPage).toMatchObject({breadcrumb: true});
        });

        it("seeds article when url is set", () => {
            const builder = createBuilder(target);
            builder.setUrl("/page").contentPage();
            expect(builder.build().article).toBeDefined();
        });

        it("end() returns SeoPageBuilder", () => {
            const builder = createBuilder(target);
            const cp = builder.contentPage();
            expect(cp.end()).toBeInstanceOf(SeoPageBuilder);
        });
    });

    describe("ContentPageBuilder.setDates", () => {
        it("fans published date to both webPage and article", () => {
            const builder = createBuilder(target);
            builder.setUrl("/page").contentPage().setDates({published: "2025-08-01"});
            const spec = builder.build() as ISeoPage & {webPage: WebPageSpec; article: ArticleSpec};
            expect(spec.webPage.datePublished).toBe("2025-08-01T00:00:00+00:00");
            expect(spec.article.datePublished).toBe("2025-08-01T00:00:00+00:00");
        });

        it("fans modified date to both webPage and article", () => {
            const builder = createBuilder(target);
            builder.setUrl("/page").contentPage().setDates({modified: "2025-08-05"});
            const spec = builder.build() as ISeoPage & {webPage: WebPageSpec; article: ArticleSpec};
            expect(spec.webPage.dateModified).toBe("2025-08-05T00:00:00+00:00");
            expect(spec.article.dateModified).toBe("2025-08-05T00:00:00+00:00");
        });

        it("normalizes DateOnly to ISO format", () => {
            const builder = createBuilder(target);
            builder.setUrl("/page").contentPage().setDates({published: "2025-08-01"});
            const spec = builder.build() as ISeoPage & {webPage: WebPageSpec; article: ArticleSpec};
            expect(spec.webPage.datePublished).toBe("2025-08-01T00:00:00+00:00");
        });
    });

    describe("ContentPageBuilder.setAbout", () => {
        it("wraps string in Thing for article.about", () => {
            const builder = createBuilder(target);
            builder.setUrl("/page").setDescription("desc").contentPage().setAbout("Politics");
            const spec = builder.build() as ISeoPage & {article: ArticleSpec};
            expect(spec.article.about).toEqual({"@type": "Thing", "name": "Politics"});
        });

        it("passes object through directly", () => {
            const builder = createBuilder(target);
            const aboutObj = {"@type": "Thing", "name": "Test"};
            builder.setUrl("/page").setDescription("desc").contentPage().setAbout(aboutObj);
            const spec = builder.build() as ISeoPage & {article: ArticleSpec};
            expect(spec.article.about).toEqual(aboutObj);
        });

        it("sets articleSection from string", () => {
            const builder = createBuilder(target);
            builder.setUrl("/page").setDescription("desc").contentPage().setAbout("Politics");
            const spec = builder.build() as ISeoPage & {article: ArticleSpec};
            expect(spec.article.articleSection).toBe("Politics");
        });
    });

    describe("ContentPageBuilder.setQuestion", () => {
        it("sets webPage.mainEntity to Question", () => {
            const builder = createBuilder(target);
            builder.setUrl("/page").contentPage().setQuestion({
                name: "What is HR-1?",
                answerText: "It is a bill.",
            });
            const spec = builder.build() as ISeoPage & {webPage: WebPageSpec};
            expect(spec.webPage.mainEntity!["@type"]).toBe("Question");
            expect(spec.webPage.mainEntity.name).toBe("What is HR-1?");
            expect(spec.webPage.mainEntity.acceptedAnswer["@type"]).toBe("Answer");
            expect(spec.webPage.mainEntity.acceptedAnswer.text).toBe("It is a bill.");
        });

        it("includes answerUrl when provided", () => {
            const builder = createBuilder(target);
            builder.setUrl("/page").contentPage().setQuestion({
                name: "What is HR-1?",
                answerText: "It is a bill.",
                answerUrl: "https://example.com/answer",
            });
            const spec = builder.build() as ISeoPage & {webPage: WebPageSpec};
            const mainEntity = spec.webPage.mainEntity as {acceptedAnswer: {url: string}};
            expect(mainEntity.acceptedAnswer.url).toBe("https://example.com/answer");
        });
    });

    describe("ContentPageBuilder chain returns", () => {
        it("setDates returns ContentPageBuilder", () => {
            const builder = createBuilder(target);
            const cp = builder.contentPage();
            expect(cp.setDates({})).toBe(cp);
        });

        it("setAbout returns ContentPageBuilder", () => {
            const builder = createBuilder(target);
            const cp = builder.contentPage();
            expect(cp.setAbout("Politics")).toBe(cp);
        });

        it("setSection returns ContentPageBuilder", () => {
            const builder = createBuilder(target);
            const cp = builder.contentPage();
            expect(cp.setSection("Politics")).toBe(cp);
        });

        it("setQuestion returns ContentPageBuilder", () => {
            const builder = createBuilder(target);
            const cp = builder.contentPage();
            expect(cp.setQuestion({name: "Q", answerText: "A"})).toBe(cp);
        });

        it("setWebPage on ContentPageBuilder returns ContentPageBuilder", () => {
            const builder = createBuilder(target);
            const cp = builder.contentPage();
            expect(cp.setWebPage({name: "Test"})).toBe(cp);
        });

        it("setArticle on ContentPageBuilder returns ContentPageBuilder", () => {
            const builder = createBuilder(target);
            const cp = builder.contentPage();
            expect(cp.setArticle({headline: "Headline"})).toBe(cp);
        });

        it("setBreadcrumbs on ContentPageBuilder returns ContentPageBuilder", () => {
            const builder = createBuilder(target);
            const cp = builder.contentPage();
            expect(cp.setBreadcrumbs([{name: "Home", url: "/"}])).toBe(cp);
        });

        it("appendBreadcrumbs on ContentPageBuilder returns ContentPageBuilder", () => {
            const builder = createBuilder(target);
            const cp = builder.contentPage();
            expect(cp.appendBreadcrumbs([{name: "Home", url: "/"}])).toBe(cp);
        });

        it("setTitle on ContentPageBuilder returns ContentPageBuilder", () => {
            const builder = createBuilder(target);
            const cp = builder.contentPage();
            expect(cp.setTitle("Title")).toBe(cp);
        });

        it("setDescription on ContentPageBuilder returns ContentPageBuilder", () => {
            const builder = createBuilder(target);
            const cp = builder.contentPage();
            expect(cp.setDescription("Desc")).toBe(cp);
        });

        it("setUrl on ContentPageBuilder returns ContentPageBuilder", () => {
            const builder = createBuilder(target);
            const cp = builder.contentPage();
            expect(cp.setUrl("/page")).toBe(cp);
        });

        it("setCanonicalPath on ContentPageBuilder returns ContentPageBuilder", () => {
            const builder = createBuilder(target);
            const cp = builder.contentPage();
            expect(cp.setCanonicalPath("/canonical")).toBe(cp);
        });

        it("setOgType on ContentPageBuilder returns ContentPageBuilder", () => {
            const builder = createBuilder(target);
            const cp = builder.contentPage();
            expect(cp.setOgType("article")).toBe(cp);
        });

        it("setImage on ContentPageBuilder returns ContentPageBuilder", () => {
            const builder = createBuilder(target);
            const cp = builder.contentPage();
            expect(cp.setImage("https://img.png")).toBe(cp);
        });

        it("setKeywords on ContentPageBuilder returns ContentPageBuilder", () => {
            const builder = createBuilder(target);
            const cp = builder.contentPage();
            expect(cp.setKeywords("a")).toBe(cp);
        });

        it("setNoIndex on ContentPageBuilder returns ContentPageBuilder", () => {
            const builder = createBuilder(target);
            const cp = builder.contentPage();
            expect(cp.setNoIndex()).toBe(cp);
        });

        it("setStatusCode on ContentPageBuilder returns ContentPageBuilder", () => {
            const builder = createBuilder(target);
            const cp = builder.contentPage();
            expect(cp.setStatusCode(404)).toBe(cp);
        });

        it("setResponseHttpStatus on ContentPageBuilder returns ContentPageBuilder", () => {
            const builder = createBuilder(target);
            const cp = builder.contentPage();
            expect(cp.setResponseHttpStatus(404)).toBe(cp);
        });

        it("setTwitter on ContentPageBuilder returns ContentPageBuilder", () => {
            const builder = createBuilder(target);
            const cp = builder.contentPage();
            expect(cp.setTwitter({card: "summary"})).toBe(cp);
        });
    });

    describe("SeoPageBuilder implements IPageBuilder", () => {
        it("SeoPageBuilder is IPageBuilder", () => {
            const builder: IPageBuilder = createBuilder(target);
            expect(builder.setTitle("t")).toBe(builder);
            expect(builder.setDescription("d")).toBe(builder);
            expect(builder.setUrl("/p")).toBe(builder);
            expect(builder.setCanonicalPath("/p")).toBe(builder);
            expect(builder.setOgType("article")).toBe(builder);
            expect(builder.setImage("https://img.png")).toBe(builder);
            expect(builder.setKeywords("k")).toBe(builder);
            expect(builder.appendKeywords("k")).toBe(builder);
            expect(builder.setBreadcrumbs([{name: "H", url: "/"}])).toBe(builder);
            expect(builder.appendBreadcrumbs([{name: "H", url: "/"}])).toBe(builder);
            expect(builder.setNoIndex()).toBe(builder);
            expect(builder.setStatusCode(404)).toBe(builder);
            expect(builder.setResponseHttpStatus(404)).toBe(builder);
            expect(builder.setTwitter({card: "summary"})).toBe(builder);
            expect(builder.setWebPage({})).toBe(builder);
            expect(builder.setArticle({})).toBe(builder);
            expect(builder.setFaqPage({mainEntity: []})).toBe(builder);
            expect(builder.contentPage()).toBeInstanceOf(ContentPageBuilder);
            expect(builder.emit()).toBeUndefined();
        });
    });
});
