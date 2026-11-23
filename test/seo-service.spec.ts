import {describe, expect, it, vi, beforeEach, afterEach} from "vitest";
import {SeoService} from "../src/index.js";
import type {JsonLdObject} from "schema-dts";

import {JSDOM} from "jsdom";

function createDocumentNoGraph() {
    const dom = new JSDOM(`<!DOCTYPE html>
<html lang="en">
<head>
    <title>No Graph Loader</title>
    <meta charset="utf-8"/>
    <meta content="width=device-width, initial-scale=1" name="viewport"/>
    <meta content="desc" name="description"/>
    <meta content="index, follow" name="robots"/>
    <meta content="Test" property="og:site_name"/>
    <meta content="website" property="og:type"/>
    <meta content="https://billgrokker.com/" property="og:url"/>
    <meta content="summary" name="twitter:card"/>
</head>
<body>
<my-app></my-app>
</body>
</html>`, {
        url: "https://billgrokker.com/",
        runScripts: "dangerously",
        pretendToBeVisual: true,
    });
    return dom.window.document;
}

type GraphDocument = {"@context": string, "@graph": JsonLdObject[]};

function getGraph(doc: Document): GraphDocument | null {
    const script = doc.querySelector('script[data-id="https://billgrokker.com/#graph"]');
    if (!script?.textContent) return null;
    try {
        return JSON.parse(script.textContent) as GraphDocument;
    } catch {
        return null;
    }
}

function findNodeById(graph: GraphDocument, id: string): JsonLdObject | undefined {
    return graph["@graph"].find(n => n?.["@id"] === id);
}

function createDocument() {

    const dom = new JSDOM(`<!DOCTYPE html>
<html lang="en">
<head>
    <title>AI-Powered Legislative Summaries | Bill Grokker</title>
    <meta charset="utf-8"/>
    <meta content="width=device-width, initial-scale=1" name="viewport"/>

    <meta content="Bill Grokker offers AI-powered legislative summaries for bills and executive orders. Understand bills or laws with analysis and bias scoring."
          name="description"/>
    <meta content="legislation, bill summaries, executive orders, AI analysis, bias scoring, government, policy, law"
          name="keywords"/>
    <meta content="index, follow" name="robots"/>

    <meta content="Bill Grokker: AI-Powered Legislative Summaries" property="og:title"/>
    <meta content="Bill Grokker" property="og:site_name"/>
    <meta content="website" property="og:type"/>
    <meta content="en" property="og:locale"/>
    <meta content="Bill Grokker offers AI-powered legislative summaries for bills and executive orders. Understand bills or laws with analysis and bias scoring."
          property="og:description"/>
    <meta content="https://billgrokker.com/" property="og:url"/>
    <meta content="https://billgrokker.com/images/logo-color.png" property="og:image"/>
    <meta content="https://billgrokker.com/images/logo-color.png" property="og:logo"/>
    <meta content="300" property="og:image:width"/>
    <meta content="68" property="og:image:height"/>
    <meta content="legislation, bill summaries, executive orders, AI analysis, bias scoring, government, policy, law"
          property="og:keywords"/>

    <meta content="summary" name="twitter:card"/>
    <meta content="@BillGrokker" name="twitter:site"/>
    <meta content="billgrokker.com" property="twitter:domain"/>
    <meta content="https://billgrokker.com/" property="twitter:url"/>
    <meta content="Bill Grokker: AI-Powered Legislative Summaries" name="twitter:title"/>
    <meta content="Analyze US legislation with AI summaries, multi-perspective analysis, and bias scoring on Bill Grokker."
          name="twitter:description"/>
    <meta content="https://billgrokker.com/images/logo-color.png" name="twitter:image"/>

    <meta content="Bill Grokker" name="apple-mobile-web-app-title"/>
    <base href="/"/>
    <link href="https://billgrokker.com/" rel="canonical"/>

    <script data-id="https://billgrokker.com/#graph" type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "ImageObject",
                "@id": "https://billgrokker.com/#logo",
                "url": "https://billgrokker.com/images/logo-color.png",
                "caption": "Bill Grokker",
                "width": 300,
                "height": 68
            },
            {
                "@type": "Organization",
                "@id": "https://billgrokker.com/#organization",
                "name": "Bill Grokker",
                "url": "https://billgrokker.com/",
                "sameAs": [
                    "https://x.com/billgrokker",
                    "https://www.facebook.com/billgrokker",
                    "https://www.instagram.com/billgrokker",
                    "https://www.linkedin.com/company/billgrokker",
                    "https://github.com/billgrokker"
                ],
                "logo": {"@id": "https://billgrokker.com/#logo"},
                "image": {"@id": "https://billgrokker.com/#logo"},
                "contactPoint": {"@type": "ContactPoint", "contactType": "customer service", "url": "mailto:support@expertvision.software"}
            },
            {
                "@type": ["WebApplication", "SoftwareApplication"],
                "@id": "https://billgrokker.com/#webapplication",
                "name": "Bill Grokker",
                "url": "https://billgrokker.com",
                "description": "Bill Grokker offers AI-powered legislative summaries for bills and executive orders. Understand bills or laws with analysis and bias scoring.",
                "softwareVersion": "1.0.0",
                "applicationCategory": "Government",
                "operatingSystem": "All",
                "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD"
                },
                "publisher": {"@id": "https://billgrokker.com/#organization"}
            }
        ]
    }
    </script>
</head>
<body>
<my-app></my-app>
</body>
</html>`, {
        url: "https://billgrokker.com/",
        runScripts: "dangerously",
        pretendToBeVisual: true,
    });
    return dom.window.document;
}

describe("SeoService", () => {
    let seoService: SeoService;

    beforeEach(() => {
        const document = createDocument();
        Object.defineProperty(globalThis, "document", {value: document, configurable: true, writable: true});
        Object.defineProperty(globalThis, "window", {value: document.defaultView as unknown as Window & typeof globalThis, configurable: true, writable: true});

        seoService = new SeoService();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe("initialize", () => {
        it("reads from index.html defaults and sets up base configuration", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});

            const defaults = seoService.getDefaults();
            expect(defaults.title).toBe("AI-Powered Legislative Summaries | Bill Grokker");
            expect(defaults.description).toBe("Bill Grokker offers AI-powered legislative summaries for bills and executive orders. Understand bills or laws with analysis and bias scoring.");
            expect(defaults.keywords).toEqual(["legislation", "bill summaries", "executive orders", "AI analysis", "bias scoring", "government", "policy", "law"]);
            expect(defaults.siteName).toBe("Bill Grokker");
            expect(defaults.robots).toBe("index, follow");
            expect(defaults.og?.type).toBe("website");
        });

        it("returns early if already initialized", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            const defaults1 = seoService.getDefaults();

            seoService.initialize({rootUrl: "https://different.com"});
            const defaults2 = seoService.getDefaults();

            expect(defaults1.title).toBe("AI-Powered Legislative Summaries | Bill Grokker");
            expect(defaults2.title).toBe("AI-Powered Legislative Summaries | Bill Grokker");
        });
    });

    describe("getDefaults", () => {
        it("returns the base configuration", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            const defaults = seoService.getDefaults();
            expect(defaults).toBeDefined();
            expect(defaults.siteName).toBe("Bill Grokker");
        });
    });

describe("setTitle", () => {
        it("updates document.title with | Bill Grokker suffix", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({title: "Test Page Title"});
            expect(document.title).toBe("Test Page Title | Bill Grokker");
        });

        it("sets og:title and twitter:title meta tags", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({title: "Test Page Title"});

            const ogTitle = document.querySelector('meta[property="og:title"]') as HTMLMetaElement;
            const twitterTitle = document.querySelector('meta[name="twitter:title"]') as HTMLMetaElement;

            expect(ogTitle?.content).toBe("Test Page Title");
            expect(twitterTitle?.content).toBe("Test Page Title");
        });
    });

    describe("setDescription", () => {
        it("sets meta description", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({description: "New description for the page"});

            const description = document.querySelector('meta[name="description"]') as HTMLMetaElement;
            expect(description?.content).toBe("New description for the page");
        });

        it("sets og:description and twitter:description meta tags", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({description: "New description for the page"});

            const ogDescription = document.querySelector('meta[property="og:description"]') as HTMLMetaElement;
            const twitterDescription = document.querySelector('meta[name="twitter:description"]') as HTMLMetaElement;

            expect(ogDescription?.content).toBe("New description for the page");
            expect(twitterDescription?.content).toBe("New description for the page");
        });
    });

    describe("setSiteName", () => {
        it("sets og:site_name and apple-mobile-web-app-title meta tags", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.setSiteName("My Custom Site");

            const ogSiteName = document.querySelector('meta[property="og:site_name"]') as HTMLMetaElement;
            const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]') as HTMLMetaElement;

            expect(ogSiteName?.content).toBe("My Custom Site");
            expect(appleTitle?.content).toBe("My Custom Site");
        });
    });

    describe("setImage", () => {
        it("sets og:image and twitter:image meta tags", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({image: "https://example.com/image.png"});

            const ogImage = document.querySelector('meta[property="og:image"]') as HTMLMetaElement;
            const twitterImage = document.querySelector('meta[name="twitter:image"]') as HTMLMetaElement;

            expect(ogImage?.content).toBe("https://example.com/image.png");
            expect(twitterImage?.content).toBe("https://example.com/image.png");
        });
    });

    describe("setOgType", () => {
        it("sets og:type meta tag", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({ogType: "article"});

            const ogType = document.querySelector('meta[property="og:type"]') as HTMLMetaElement;
            expect(ogType?.content).toBe("article");
        });
    });

    describe("setUrl", () => {
        it("sets og:url and twitter:url meta tags", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.setUrl("https://billgrokker.com/bills/hr-1234");

            const ogUrl = document.querySelector('meta[property="og:url"]') as HTMLMetaElement;
            const twitterUrl = document.querySelector('meta[property="twitter:url"]') as HTMLMetaElement;

            expect(ogUrl?.content).toBe("https://billgrokker.com/bills/hr-1234");
            expect(twitterUrl?.content).toBe("https://billgrokker.com/bills/hr-1234");
        });

        it("sets canonical link", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.setUrl("https://billgrokker.com/bills/hr-1234");

            const canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
            expect(canonical?.href).toBe("https://billgrokker.com/bills/hr-1234");
        });

        it("throws on invalid URL", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            expect(() => seoService.setUrl("not-a-valid-url")).toThrow("Invalid URL: not-a-valid-url");
        });
    });

    describe("setKeywords", () => {
        it("sets meta keywords and og:keywords", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({keywords: ["legislation", "bills", "AI analysis"]});

            const keywords = document.querySelector('meta[name="keywords"]') as HTMLMetaElement;
            const ogKeywords = document.querySelector('meta[property="og:keywords"]') as HTMLMetaElement;

            expect(keywords?.content).toBe("legislation, bills, AI analysis");
            expect(ogKeywords?.content).toBe("legislation, bills, AI analysis");
        });

        it("flattens nested arrays", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({keywords: ["legislation", "bills", "AI analysis", "nested"]});

            const keywords = document.querySelector('meta[name="keywords"]') as HTMLMetaElement;
            expect(keywords?.content).toBe("legislation, bills, AI analysis, nested");
        });
    });

    describe("setWebPage", () => {
        it("creates a WebPage node with canonical URL-based @id", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({webPage: {canonicalPath: "https://billgrokker.com/bills/118/hr/1", name: "Test Page", description: "Test description"}});

            const graph = getGraph(document);
            const node = findNodeById(graph!, "https://billgrokker.com/bills/118/hr/1#webpage");
            expect(node).toBeDefined();
            expect(node?.["@type"]).toBe("WebPage");
        });

        it("includes boilerplate isPartOf, image, primaryImageOfPage, and inLanguage", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({webPage: {canonicalPath: "https://billgrokker.com/page", name: "Test", description: "Desc"}});

            const graph = getGraph(document);
            const node = findNodeById(graph!, "https://billgrokker.com/page#webpage") as Record<string, unknown>;
            expect(node.inLanguage).toBe("en-US");
            expect((node.isPartOf as Record<string, unknown>)["@id"]).toBe("https://billgrokker.com/#webapplication");
            expect((node.image as Record<string, unknown>)["@id"]).toBe("https://billgrokker.com/#logo");
            expect((node.primaryImageOfPage as Record<string, unknown>)["@id"]).toBe("https://billgrokker.com/#logo");
        });

        it("includes datePublished and dateModified when provided", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({webPage: {canonicalPath: "https://billgrokker.com/page", name: "Test", description: "Desc", datePublished: "2025-01-01T00:00:00.000Z", dateModified: "2025-07-01T00:00:00.000Z"}});

            const graph = getGraph(document);
            const node = findNodeById(graph!, "https://billgrokker.com/page#webpage") as Record<string, unknown>;
            expect(node.datePublished).toBe("2025-01-01T00:00:00.000Z");
            expect(node.dateModified).toBe("2025-07-01T00:00:00.000Z");
        });

        it("omits datePublished and dateModified when not provided", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({webPage: {canonicalPath: "https://billgrokker.com/page", name: "Test", description: "Desc"}});

            const graph = getGraph(document);
            const node = findNodeById(graph!, "https://billgrokker.com/page#webpage") as Record<string, unknown>;
            expect(node).not.toHaveProperty("datePublished");
            expect(node).not.toHaveProperty("dateModified");
        });

        it("includes breadcrumb reference when breadcrumb option is true", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({webPage: {canonicalPath: "https://billgrokker.com/page", name: "Test", description: "Desc", breadcrumb: true}});

            const graph = getGraph(document);
            const node = findNodeById(graph!, "https://billgrokker.com/page#webpage") as Record<string, unknown>;
            expect((node.breadcrumb as Record<string, unknown>)["@id"]).toBe("https://billgrokker.com/page#breadcrumb");
        });

        it("omits breadcrumb reference when breadcrumb option is not set", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({webPage: {canonicalPath: "https://billgrokker.com/page", name: "Test", description: "Desc"}});

            const graph = getGraph(document);
            const node = findNodeById(graph!, "https://billgrokker.com/page#webpage") as Record<string, unknown>;
            expect(node).not.toHaveProperty("breadcrumb");
        });

        it("sets _activePageNodeId for setUrl updates", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({webPage: {canonicalPath: "https://billgrokker.com/page", name: "Test", description: "Desc"}});

            expect((seoService as unknown as {_activePageNodeId: string | null})._activePageNodeId).toBe("https://billgrokker.com/page#webpage");
        });

        it("updates existing WebPage when called with same canonicalUrl", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({webPage: {canonicalPath: "https://billgrokker.com/page", name: "Old", description: "Old desc"}});

            seoService.emit({webPage: {canonicalPath: "https://billgrokker.com/page", name: "New", description: "New desc"}});

            const graph = getGraph(document);
            const nodes = graph!["@graph"].filter(n => n?.["@id"] === "https://billgrokker.com/page#webpage");
            expect(nodes).toHaveLength(1);
            expect((nodes[0] as Record<string, unknown>).name).toBe("New");
        });
    });

    describe("setBreadcrumb", () => {
        it("creates a BreadcrumbList node with canonical URL-based @id", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({
                webPage: {canonicalPath: "https://billgrokker.com/bills/118/hr/1", description: "d", breadcrumb: true},
                breadcrumbs: [
                    { name: "Home", url: "/" },
                    {name: "Search Bills", url: "https://billgrokker.com/bills/search"},
                    {name: "HR. 1 (118th)", url: "https://billgrokker.com/bills/118/hr/1"},
                ],
            });

            const graph = getGraph(document);
            const node = findNodeById(graph!, "https://billgrokker.com/bills/118/hr/1#breadcrumb");
            expect(node).toBeDefined();
            expect(node?.["@type"]).toBe("BreadcrumbList");
        });

        it("maps items to ListItem with sequential 1-based positions", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({
                webPage: {canonicalPath: "https://billgrokker.com/page", description: "d", breadcrumb: true},
                breadcrumbs: [
                    { name: "Home", url: "/" },
                    {name: "Section", url: "https://billgrokker.com/section"},
                    {name: "Current", url: "https://billgrokker.com/page"},
                ],
            });

            const graph = getGraph(document);
            const node = findNodeById(graph!, "https://billgrokker.com/page#breadcrumb");
            const items = (node as Record<string, unknown>)?.itemListElement as Array<Record<string, unknown>>;
            expect(items).toHaveLength(3);
            expect(items[0]).toEqual({"@type": "ListItem", "position": 1, "item": {"@id": "https://billgrokker.com/", "@type": "Thing", "name": "Home"}});
            expect(items[1]).toEqual({"@type": "ListItem", "position": 2, "item": {"@id": "https://billgrokker.com/section", "@type": "Thing", "name": "Section"}});
            expect(items[2]).toEqual({"@type": "ListItem", "position": 3, "item": {"@id": "https://billgrokker.com/page", "@type": "Thing", "name": "Current"}});
        });

        it("handles single-item breadcrumb", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({
                webPage: {canonicalPath: "https://billgrokker.com/page", description: "d", breadcrumb: true},
                breadcrumbs: [
                    { name: "Home", url: "/" },
                ],
            });

            const graph = getGraph(document);
            const node = findNodeById(graph!, "https://billgrokker.com/page#breadcrumb");
            const items = (node as Record<string, unknown>)?.itemListElement as Array<Record<string, unknown>>;
            expect(items).toHaveLength(1);
            expect(items[0]?.position).toBe(1);
        });

        it("updates existing breadcrumb when called with same canonicalUrl", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({
                webPage: {canonicalPath: "https://billgrokker.com/page", description: "d", breadcrumb: true},
                breadcrumbs: [
                    { name: "Home", url: "/" },
                    {name: "Old", url: "https://billgrokker.com/old"},
                ],
            });

            seoService.emit({
                breadcrumbs: [
                    { name: "Home", url: "/" },
                    {name: "New", url: "https://billgrokker.com/new"},
                ],
            });

            const graph = getGraph(document);
            const nodes = graph!["@graph"].filter(n => n?.["@id"] === "https://billgrokker.com/page#breadcrumb");
            expect(nodes).toHaveLength(1);
            const items = (nodes[0] as Record<string, unknown>)?.itemListElement as Array<Record<string, unknown>>;
            expect((items[1] as Record<string, unknown>)?.item).toEqual({"@id": "https://billgrokker.com/new", "@type": "Thing", "name": "New"});
        });

        it("breadcrumb node is removed by prepareToNavigate", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({
                webPage: {canonicalPath: "https://billgrokker.com/page", description: "d", breadcrumb: true},
                breadcrumbs: [
                    { name: "Home", url: "/" },
                ],
            });

            expect(findNodeById(getGraph(document)!, "https://billgrokker.com/page#breadcrumb")).toBeDefined();

            seoService.prepareToNavigate();

            expect(findNodeById(getGraph(document)!, "https://billgrokker.com/page#breadcrumb")).toBeUndefined();
        });
    });

    describe("robotShouldIgnorePage", () => {
        it("sets robots meta to noindex, nofollow", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({noIndex: true});

            const robots = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
            expect(robots?.content).toBe("noindex, nofollow");
        });

        it("does NOT persist into the next prepareToNavigate — singleton must reset robots", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({noIndex: true});

            const robotsBefore = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
            expect(robotsBefore?.content).toBe("noindex, nofollow");

            seoService.prepareToNavigate();

            const robotsAfter = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
            expect(robotsAfter?.content).toBe("index, follow");
            expect(robotsAfter?.content).not.toContain("noindex");
        });

        it("reset works even after multiple noIndex emits", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({noIndex: true});
            seoService.emit({noIndex: true});
            seoService.emit({noIndex: true});

            seoService.prepareToNavigate();

            const robots = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
            expect(robots?.content).toBe("index, follow");
        });
    });

    describe("setTwitterCard", () => {
        it("sets twitter:card meta tag when cardType is provided", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({twitter: {card: "summary_large_image"}});

            const twitterCard = document.querySelector('meta[name="twitter:card"]') as HTMLMetaElement;
            expect(twitterCard?.content).toBe("summary_large_image");
        });
    });

    describe("setTwitterHandle", () => {
        it("sets twitter:site meta tag with @ prefix if not present", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({twitter: {handle: "TestUser"}});

            const twitterSite = document.querySelector('meta[name="twitter:site"]') as HTMLMetaElement;
            expect(twitterSite?.content).toBe("@TestUser");
        });

        it("keeps existing @ prefix", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({twitter: {handle: "@ExistingUser"}});

            const twitterSite = document.querySelector('meta[name="twitter:site"]') as HTMLMetaElement;
            expect(twitterSite?.content).toBe("@ExistingUser");
        });
    });

    describe("setStatusCode", () => {
        it("sets prerender-status-code meta tag", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({statusCode: 404});

            const statusCode = document.querySelector('meta[name="prerender-status-code"]') as HTMLMetaElement;
            expect(statusCode?.content).toBe("404");
        });
    });

    describe("setResponseHttpStatus", () => {
        it("sets response-http-status meta tag with provided status code", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({responseHttpStatus: 404});

            const meta = document.querySelector('meta[name="response-http-status"]') as HTMLMetaElement;
            expect(meta?.content).toBe("404");
        });

        it("does not collide with prerender-status-code when both are emitted", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({statusCode: 404, responseHttpStatus: 404});

            const prerender = document.querySelector('meta[name="prerender-status-code"]') as HTMLMetaElement;
            const response = document.querySelector('meta[name="response-http-status"]') as HTMLMetaElement;
            expect(prerender?.content).toBe("404");
            expect(response?.content).toBe("404");
        });

        it("emits response-http-status independently of statusCode", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({responseHttpStatus: 410});

            const response = document.querySelector('meta[name="response-http-status"]') as HTMLMetaElement;
            const prerender = document.querySelector('meta[name="prerender-status-code"]');
            expect(response?.content).toBe("410");
            expect(prerender).toBeNull();
        });

        it("marks the meta tag as seo-managed via data-seo attribute", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({responseHttpStatus: 404});

            const meta = document.querySelector('meta[name="response-http-status"]') as HTMLMetaElement;
            expect(meta?.getAttribute("data-seo")).toBe("true");
        });

        it("does not write a meta tag when responseHttpStatus is omitted", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({title: "Page"});

            const meta = document.querySelector('meta[name="response-http-status"]');
            expect(meta).toBeNull();
        });
    });

    describe("setArticle", () => {
        it("creates an Article node with canonical URL-based @id", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({article: {canonicalPath: "https://billgrokker.com/bills/118/hr/1", name: "Test Article", headline: "Test Headline", description: "Test description", datePublished: "2025-01-01T00:00:00.000Z", dateModified: "2025-01-01T00:00:00.000Z"}});

            const graph = getGraph(document);
            const node = findNodeById(graph!, "https://billgrokker.com/bills/118/hr/1#article");
            expect(node).toBeDefined();
            expect(node?.["@type"]).toBe("Article");
            expect(node?.name).toBe("Test Article");
            expect(node?.headline).toBe("Test Headline");
            expect(node?.description).toBe("Test description");
            expect(node?.url).toBe("https://billgrokker.com/bills/118/hr/1");
        });

        it("includes author and publisher refs", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({article: {canonicalPath: "https://billgrokker.com/page", name: "Test", headline: "Test", description: "Desc", datePublished: "2025-01-01T00:00:00.000Z", dateModified: "2025-01-01T00:00:00.000Z"}});

            const graph = getGraph(document);
            const node = findNodeById(graph!, "https://billgrokker.com/page#article") as Record<string, unknown>;
            expect((node.author as Record<string, unknown>)["@id"]).toBe("https://billgrokker.com/#organization");
            expect((node.publisher as Record<string, unknown>)["@id"]).toBe("https://billgrokker.com/#organization");
            expect((node.image as Record<string, unknown>)["@id"]).toBe("https://billgrokker.com/#logo");
        });

        it("includes mainEntityOfPage pointing to WebPage node", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({article: {canonicalPath: "https://billgrokker.com/page", name: "Test", headline: "Test", description: "Desc", datePublished: "2025-01-01T00:00:00.000Z", dateModified: "2025-01-01T00:00:00.000Z"}});

            const graph = getGraph(document);
            const node = findNodeById(graph!, "https://billgrokker.com/page#article") as Record<string, unknown>;
            const mainEntity = node.mainEntityOfPage as Record<string, unknown>;
            expect(mainEntity["@type"]).toBe("WebPage");
            expect(mainEntity["@id"]).toBe("https://billgrokker.com/page#webpage");
        });

        it("includes optional about, articleSection, and keywords", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({article: {canonicalPath: "https://billgrokker.com/page", name: "Test", headline: "Test", description: "Desc", datePublished: "2025-01-01T00:00:00.000Z", dateModified: "2025-01-01T00:00:00.000Z", about: {"@type": "Thing", "name": "Policy"} as never, articleSection: "Government", keywords: "bills, legislation"}});

            const graph = getGraph(document);
            const node = findNodeById(graph!, "https://billgrokker.com/page#article") as Record<string, unknown>;
            expect((node.about as Record<string, unknown>).name).toBe("Policy");
            expect(node.articleSection).toBe("Government");
            expect(node.keywords).toBe("bills, legislation");
        });

        it("omits optional fields when not provided", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({article: {canonicalPath: "https://billgrokker.com/page", name: "Test", headline: "Test", description: "Desc", datePublished: "2025-01-01T00:00:00.000Z", dateModified: "2025-01-01T00:00:00.000Z"}});

            const graph = getGraph(document);
            const node = findNodeById(graph!, "https://billgrokker.com/page#article") as Record<string, unknown>;
            expect(node).not.toHaveProperty("about");
            expect(node).not.toHaveProperty("articleSection");
            expect(node).not.toHaveProperty("keywords");
        });

        it("sets _activeArticleNodeId for setUrl and setKeywords updates", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({article: {canonicalPath: "https://billgrokker.com/page", name: "Test", headline: "Test", description: "Desc", datePublished: "2025-01-01T00:00:00.000Z", dateModified: "2025-01-01T00:00:00.000Z"}});

            expect((seoService as unknown as {_activeArticleNodeId: string | null})._activeArticleNodeId).toBe("https://billgrokker.com/page#article");
        });

        it("updates existing Article when called with same canonicalUrl", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({article: {canonicalPath: "https://billgrokker.com/page", name: "Old", headline: "Old", description: "Old desc", datePublished: "2025-01-01T00:00:00.000Z", dateModified: "2025-01-01T00:00:00.000Z"}});

            seoService.emit({article: {canonicalPath: "https://billgrokker.com/page", name: "New", headline: "New", description: "New desc", datePublished: "2025-01-01T00:00:00.000Z", dateModified: "2025-01-01T00:00:00.000Z"}});

            const graph = getGraph(document);
            const nodes = graph!["@graph"].filter(n => n?.["@id"] === "https://billgrokker.com/page#article");
            expect(nodes).toHaveLength(1);
            expect((nodes[0] as Record<string, unknown>).name).toBe("New");
        });
    });

    describe("setFaqPage", () => {
        it("creates a FAQPage node with canonical URL-based @id", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({faqPage: {canonicalPath: "https://billgrokker.com/faq", mainEntity: [
                    {
                        "@type": "Question",
                        "name": "What is Bill Grokker?",
                        "answerCount": 1,
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "A platform for understanding legislation.",
                        }
                    }
                ]}});

            const graph = getGraph(document);
            const node = findNodeById(graph!, "https://billgrokker.com/faq#faqpage");
            expect(node).toBeDefined();
            expect(node?.["@type"]).toBe("FAQPage");
            expect((node as Record<string, unknown>).mainEntity).toHaveLength(1);
        });

        it("updates existing FAQPage when called with same canonicalUrl", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({faqPage: {canonicalPath: "https://billgrokker.com/faq", mainEntity: [
                    {
                        "@type": "Question",
                        "name": "Original question?",
                        "answerCount": 1,
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Original answer.",
                        }
                    }
                ]}});

            seoService.emit({faqPage: {canonicalPath: "https://billgrokker.com/faq", mainEntity: [
                    {
                        "@type": "Question",
                        "name": "Updated question?",
                        "answerCount": 1,
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "A platform for understanding legislation.",
                        }
                    }
                ]}});

            const graph = getGraph(document);
            const node = findNodeById(graph!, "https://billgrokker.com/faq#faqpage");
            expect(node).toBeDefined();
            expect(node?.["@type"]).toBe("FAQPage");
            expect((node as Record<string, unknown>).mainEntity).toHaveLength(1);
        });

        it("updates existing FAQPage when called with same canonicalUrl", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({faqPage: {canonicalPath: "https://billgrokker.com/faq", mainEntity: [
                    {
                        "@type": "Question",
                        "name": "Original question?",
                        "answerCount": 1,
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Original answer.",
                        }
                    }
                ]}});

            seoService.emit({faqPage: {canonicalPath: "https://billgrokker.com/faq", mainEntity: [
                    {
                        "@type": "Question",
                        "name": "Updated question?",
                        "answerCount": 1,
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Updated answer.",
                        }
                    }
                ]}});

            const graph = getGraph(document);
            const faqNode = findNodeById(graph!, "https://billgrokker.com/faq#faqpage");
            expect(faqNode).toBeDefined();
            expect(faqNode).toHaveProperty("@type", "FAQPage");
            expect((faqNode as Record<string, unknown>).mainEntity).toHaveLength(1);

            const mainEntity = (faqNode as Record<string, unknown>).mainEntity as Record<string, unknown>[];
            expect(mainEntity[0]).toHaveProperty("name", "Updated question?");
        });
    });

    describe("prepareToNavigate", () => {
        it("clears page-specific SEO data but preserves base JSON-LD nodes from index.html", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.siteWide.setOrganization({name: "Test Org"});
            seoService.siteWide.setWebApplication({name: "Test App"});
            seoService.siteWide.setLogo({url: "https://example.com/logo.png", width: 300, height: 68});
            seoService.emit({title: "Page Title", description: "Page description"});
            seoService.emit({webPage: {canonicalPath: "https://example.com/page", name: "Test", description: "Desc"}});

            seoService.prepareToNavigate();

            const graph = getGraph(document);
            expect(graph).not.toBeNull();
            expect(findNodeById(graph!, "https://example.com/page#webpage")).toBeUndefined();
            expect(findNodeById(graph!, "https://billgrokker.com/#organization")).toBeDefined();
            expect(findNodeById(graph!, "https://billgrokker.com/#webapplication")).toBeDefined();
        });

        it("clears page-specific SEO meta/link tags and rebuilds base nodes into the graph", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.siteWide.setOrganization({name: "Test Org"});
            seoService.siteWide.setWebApplication({name: "Test App"});
            seoService.emit({title: "Test Page"});
            seoService.emit({webPage: {canonicalPath: "https://example.com/page", name: "Test", description: "Desc"}});

            seoService.prepareToNavigate();

            const graph = getGraph(document);
            expect(findNodeById(graph!, "https://example.com/page#webpage")).toBeUndefined();
            expect(findNodeById(graph!, "https://billgrokker.com/#organization")).toBeDefined();
            expect(findNodeById(graph!, "https://billgrokker.com/#webapplication")).toBeDefined();

            const graphScript = document.querySelector('script[data-id="https://billgrokker.com/#graph"]');
            expect(graphScript).not.toBeNull();

            const seoScripts = document.querySelectorAll('script[data-seo="true"]');
            expect(seoScripts.length).toBe(0);
        });

        it("reapplies base configuration after clearing", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({title: "Custom Title"});

            seoService.prepareToNavigate();

            expect(document.title).toContain("| Bill Grokker");
            const ogTitle = document.querySelector('meta[property="og:title"]') as HTMLMetaElement;
            expect(ogTitle).not.toBeNull();
        });
    });

    describe("edge cases", () => {
        it("handles empty content in _setMeta gracefully", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            expect(() => (seoService as unknown as {
                _setMeta: (name: string, content: string, isProperty?: boolean) => void
            })._setMeta.call(seoService, "test", "", false)).not.toThrow();
        });

        it("handles URL with query parameters in setUrl", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.setUrl("https://billgrokker.com/bills/search?q=HR1234&exec=1");

            const ogUrl = document.querySelector('meta[property="og:url"]') as HTMLMetaElement;
            expect(ogUrl?.content).toBe("https://billgrokker.com/bills/search?q=hr1234&exec=1");
        });
    });

    describe("graph model", () => {
        it("renders nodes into the @graph array of the single graph script", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({article: {canonicalPath: "https://example.com/page", name: "Test", headline: "Test", description: "Desc", datePublished: "2025-01-01T00:00:00.000Z", dateModified: "2025-01-01T00:00:00.000Z"}});

            const separateScript = document.querySelector('script[data-id="https://example.com/page#article"]');
            expect(separateScript).toBeNull();

            const graph = getGraph(document);
            expect(graph).not.toBeNull();
            const node = findNodeById(graph!, "https://example.com/page#article");
            expect(node).toBeDefined();
            expect(node?.["@type"]).toBe("Article");
        });

        it("strips @context from page-emitted data", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({article: {canonicalPath: "https://example.com/page", name: "Test", headline: "Test", description: "Desc", datePublished: "2025-01-01T00:00:00.000Z", dateModified: "2025-01-01T00:00:00.000Z"}});

            const graph = getGraph(document);
            const node = findNodeById(graph!, "https://example.com/page#article");
            expect(node).toBeDefined();
            expect(node).not.toHaveProperty("@context");
            expect(node).toHaveProperty("@type", "Article");
            expect(node).toHaveProperty("name", "Test");
        });

        it("graph script has @context at document level only", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({article: {canonicalPath: "https://example.com/page", name: "Test", headline: "Test", description: "Desc", datePublished: "2025-01-01T00:00:00.000Z", dateModified: "2025-01-01T00:00:00.000Z"}});

            const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
            expect(jsonLdScripts.length).toBe(1);

            const graph = getGraph(document);
            expect(graph?.["@context"]).toBe("https://schema.org");
            expect(Array.isArray(graph?.["@graph"])).toBe(true);
            expect((graph?.["@graph"] ?? []).length).toBeGreaterThan(0);

            const nodes = graph?.["@graph"] ?? [];
            nodes.forEach(node => {
                expect(node).not.toHaveProperty("@context");
            });
        });

        it("multiple page nodes coexist in the graph", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({webPage: {canonicalPath: "https://example.com/page", name: "Page", description: "Desc"}});
            seoService.emit({article: {canonicalPath: "https://example.com/page", name: "Article", headline: "Article", description: "Desc", datePublished: "2025-01-01T00:00:00.000Z", dateModified: "2025-01-01T00:00:00.000Z"}});

            const graph = getGraph(document);
            expect(findNodeById(graph!, "https://example.com/page#webpage")).toBeDefined();
            expect(findNodeById(graph!, "https://example.com/page#article")).toBeDefined();
        });

        it("merges partial update into existing node by @id via private _updateRenderedJsonLdBlock", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({article: {canonicalPath: "https://example.com/page", name: "Test", headline: "Test", description: "Desc", datePublished: "2025-01-01T00:00:00.000Z", dateModified: "2025-01-01T00:00:00.000Z", keywords: "original"}});

            (seoService as unknown as {
                _updateRenderedJsonLdBlock: (id: string, partial: Record<string, string>) => void
            })._updateRenderedJsonLdBlock("https://example.com/page#article", {updated: "data"});

            const graph = getGraph(document);
            const node = findNodeById(graph!, "https://example.com/page#article");
            expect(node?.updated).toBe("data");
        });

        it("setUrl updates active page node url without touching base nodes", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({webPage: {canonicalPath: "https://example.com/page", name: "Test", description: "Desc"}});

            const webAppBefore = getGraph(document)?.["@graph"].find(n => n?.["@id"] === "https://billgrokker.com/#webapplication");

            seoService.setUrl("https://billgrokker.com/bills/hr-1234");

            const graph = getGraph(document);
            const pageNode = findNodeById(graph!, "https://example.com/page#webpage");
            expect(pageNode?.url).toBe("https://billgrokker.com/bills/hr-1234");

            const webAppAfter = findNodeById(graph!, "https://billgrokker.com/#webapplication");
            expect(webAppAfter).toEqual(webAppBefore);
            expect((webAppAfter as unknown as {url: string}).url).toBe("https://billgrokker.com");
        });

        it("emit keywords updates active article node keywords", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({article: {canonicalPath: "https://example.com/page", name: "Test", headline: "Test", description: "Desc", datePublished: "2025-01-01T00:00:00.000Z", dateModified: "2025-01-01T00:00:00.000Z", keywords: "old"}});

            seoService.emit({keywords: ["new", "keywords"]});

            const graph = getGraph(document);
            const articleNode = findNodeById(graph!, "https://example.com/page#article");
            expect(articleNode?.keywords).toBe("new, keywords");
        });

        it("prepareToNavigate removes page-specific nodes from graph but preserves base nodes", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.siteWide.setOrganization({name: "Test Org"});
            seoService.siteWide.setWebApplication({name: "Test App"});
            seoService.siteWide.setLogo({url: "https://example.com/logo.png", width: 300, height: 68});
            seoService.emit({webPage: {canonicalPath: "https://example.com/page", name: "Page", description: "Desc"}});
            seoService.emit({article: {canonicalPath: "https://example.com/page", name: "Article", headline: "Article", description: "Desc", datePublished: "2025-01-01T00:00:00.000Z", dateModified: "2025-01-01T00:00:00.000Z"}});

            seoService.prepareToNavigate();

            const graph = getGraph(document);
            expect(findNodeById(graph!, "https://example.com/page#webpage")).toBeUndefined();
            expect(findNodeById(graph!, "https://example.com/page#article")).toBeUndefined();
            expect(findNodeById(graph!, "https://billgrokker.com/#organization")).toBeDefined();
            expect(findNodeById(graph!, "https://billgrokker.com/#webapplication")).toBeDefined();
            expect(findNodeById(graph!, "https://billgrokker.com/#logo")).toBeDefined();
        });

        it("tracks _activePageNodeId and _activeArticleNodeId via setWebPage and setArticle", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({webPage: {canonicalPath: "https://example.com/page", name: "Page", description: "Desc"}});
            seoService.emit({article: {canonicalPath: "https://example.com/page", name: "Article", headline: "Article", description: "Desc", datePublished: "2025-01-01T00:00:00.000Z", dateModified: "2025-01-01T00:00:00.000Z"}});

            expect((seoService as unknown as {_activePageNodeId: string | null})._activePageNodeId).toBe("https://example.com/page#webpage");
            expect((seoService as unknown as {_activeArticleNodeId: string | null})._activeArticleNodeId).toBe("https://example.com/page#article");
        });
    });

    describe("FAQPage JSON-LD", () => {
        it("renders FAQPage with mainEntity containing Question and Answer nodes", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({faqPage: {canonicalPath: "https://billgrokker.com/faq", mainEntity: [
                    {
                        "@type": "Question",
                        "name": "What is Bill Grokker?",
                        "answerCount": 1,
                        "upvoteCount": 1,
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Bill Grokker is a platform for understanding legislation.",
                            "url": "https://billgrokker.com/faq#what-is-bill-grokker",
                            "upvoteCount": 1
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "How does it work?",
                        "answerCount": 1,
                        "upvoteCount": 1,
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "It uses AI to analyze bills and provide summaries.",
                            "url": "https://billgrokker.com/faq#how-does-it-work",
                            "upvoteCount": 1
                        }
                    }
                ]}});

            const graph = getGraph(document);
            const faqNode = findNodeById(graph!, "https://billgrokker.com/faq#faqpage");

            expect(faqNode).toBeDefined();
            expect(faqNode).toHaveProperty("@type", "FAQPage");
            expect(faqNode).toHaveProperty("mainEntity");
            expect((faqNode as Record<string, unknown>).mainEntity).toHaveLength(2);

            const mainEntity = (faqNode as Record<string, unknown>).mainEntity as Record<string, unknown>[];
            expect(mainEntity[0]).toHaveProperty("@type", "Question");
            expect(mainEntity[0]).toHaveProperty("name", "What is Bill Grokker?");
            expect(mainEntity[0]).toHaveProperty("answerCount", 1);
            expect(mainEntity[0]).toHaveProperty("upvoteCount", 1);
            expect(mainEntity[0]).toHaveProperty("acceptedAnswer");
            expect((mainEntity[0] as Record<string, unknown>).acceptedAnswer).toHaveProperty("@type", "Answer");
            expect((mainEntity[0] as Record<string, unknown>).acceptedAnswer).toHaveProperty("text", "Bill Grokker is a platform for understanding legislation.");
            expect((mainEntity[0] as Record<string, unknown>).acceptedAnswer).toHaveProperty("url", "https://billgrokker.com/faq#what-is-bill-grokker");
            expect((mainEntity[0] as Record<string, unknown>).acceptedAnswer).toHaveProperty("upvoteCount", 1);

            expect(mainEntity[1]).toHaveProperty("@type", "Question");
            expect(mainEntity[1]).toHaveProperty("name", "How does it work?");
            expect(mainEntity[1]).toHaveProperty("answerCount", 1);
            expect(mainEntity[1]).toHaveProperty("upvoteCount", 1);
            expect(mainEntity[1]).toHaveProperty("acceptedAnswer");
            expect((mainEntity[1] as Record<string, unknown>).acceptedAnswer).toHaveProperty("@type", "Answer");
            expect((mainEntity[1] as Record<string, unknown>).acceptedAnswer).toHaveProperty("url", "https://billgrokker.com/faq#how-does-it-work");
        });

        it("allows FAQPage and WebPage to coexist in the same graph", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({webPage: {canonicalPath: "https://billgrokker.com/faq", name: "FAQ Page", description: "Desc"}});
            seoService.emit({faqPage: {canonicalPath: "https://billgrokker.com/faq", mainEntity: [
                    {
                        "@type": "Question",
                        "name": "Test question?",
                        "answerCount": 1,
                        "upvoteCount": 1,
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Test answer.",
                            "url": "https://billgrokker.com/faq#test-question",
                            "upvoteCount": 1
                        }
                    }
                ]}});

            const graph = getGraph(document);
            const webPageNode = findNodeById(graph!, "https://billgrokker.com/faq#webpage");
            const faqNode = findNodeById(graph!, "https://billgrokker.com/faq#faqpage");

            expect(webPageNode).toBeDefined();
            expect(webPageNode).toHaveProperty("@type", "WebPage");

            expect(faqNode).toBeDefined();
            expect(faqNode).toHaveProperty("@type", "FAQPage");
            expect((faqNode as Record<string, unknown>).mainEntity).toHaveLength(1);
        });

        it("updates existing FAQPage node when re-rendered", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({faqPage: {canonicalPath: "https://billgrokker.com/faq", mainEntity: [
                    {
                        "@type": "Question",
                        "name": "Original question?",
                        "answerCount": 1,
                        "upvoteCount": 1,
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Original answer.",
                            "url": "https://billgrokker.com/faq#original-question",
                            "upvoteCount": 1
                        }
                    }
                ]}});

            seoService.emit({faqPage: {canonicalPath: "https://billgrokker.com/faq", mainEntity: [
                    {
                        "@type": "Question",
                        "name": "Updated question?",
                        "answerCount": 1,
                        "upvoteCount": 1,
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Updated answer.",
                            "url": "https://billgrokker.com/faq#updated-question",
                            "upvoteCount": 1
                        }
                    }
                ]}});

            const graph = getGraph(document);
            const faqNode = findNodeById(graph!, "https://billgrokker.com/faq#faqpage");

            expect(faqNode).toBeDefined();
            expect(faqNode).toHaveProperty("@type", "FAQPage");
            expect((faqNode as Record<string, unknown>).mainEntity).toHaveLength(1);

            const mainEntity = (faqNode as Record<string, unknown>).mainEntity as Record<string, unknown>[];
            expect(mainEntity[0]).toHaveProperty("name", "Updated question?");
        });
    });

    describe("siteWide builder", () => {
        describe("setBaseGraphNode", () => {
            it("adds a node to the graph", () => {
                seoService.initialize({rootUrl: "https://billgrokker.com"});
                seoService.siteWide.setBaseGraphNode({
                    "@id": "https://billgrokker.com/#custom",
                    "@type": "Thing",
                    "name": "Custom Node",
                } as unknown as JsonLdObject);

                const graph = getGraph(document);
                const node = findNodeById(graph!, "https://billgrokker.com/#custom");
                expect(node).toBeDefined();
                expect(node?.["@type"]).toBe("Thing");
                expect(node?.name).toBe("Custom Node");
            });

            it("persists across prepareToNavigate", () => {
                seoService.initialize({rootUrl: "https://billgrokker.com"});
                seoService.siteWide.setBaseGraphNode({
                    "@id": "https://billgrokker.com/#custom",
                    "@type": "Thing",
                    "name": "Custom Node",
                } as unknown as JsonLdObject);

                seoService.prepareToNavigate();

                const graph = getGraph(document);
                const node = findNodeById(graph!, "https://billgrokker.com/#custom");
                expect(node).toBeDefined();
                expect(node?.name).toBe("Custom Node");
            });

            it("updates existing node when called with same @id", () => {
                seoService.initialize({rootUrl: "https://billgrokker.com"});
                seoService.siteWide.setBaseGraphNode({
                    "@id": "https://billgrokker.com/#custom",
                    "@type": "Thing",
                    "name": "Original",
                } as unknown as JsonLdObject);
                seoService.siteWide.setBaseGraphNode({
                    "@id": "https://billgrokker.com/#custom",
                    "@type": "Thing",
                    "name": "Updated",
                } as unknown as JsonLdObject);

                const graph = getGraph(document);
                const node = findNodeById(graph!, "https://billgrokker.com/#custom");
                expect(node?.name).toBe("Updated");
            });
        });

        describe("setLogo", () => {
            it("creates or updates the ImageObject base node", () => {
                seoService.initialize({rootUrl: "https://billgrokker.com"});
                seoService.siteWide.setLogo({url: "https://billgrokker.com/logo.png", width: 200, height: 60, caption: "Test"});

                const graph = getGraph(document);
                const logoNode = findNodeById(graph!, "https://billgrokker.com/#logo") as Record<string, unknown>;
                expect(logoNode).toBeDefined();
                expect(logoNode["@type"]).toBe("ImageObject");
                expect(logoNode.url).toBe("https://billgrokker.com/logo.png");
                expect(logoNode.width).toBe(200);
                expect(logoNode.height).toBe(60);
                expect(logoNode.caption).toBe("Test");
            });

            it("sets organization.logo ref when org exists and logo is unset", () => {
                seoService.initialize({rootUrl: "https://billgrokker.com"});
                seoService.siteWide.setLogo({url: "https://billgrokker.com/logo.png", width: 200, height: 60});

                const graph = getGraph(document);
                const orgNode = findNodeById(graph!, "https://billgrokker.com/#organization") as Record<string, unknown>;
                expect((orgNode.logo as Record<string, unknown>)["@id"]).toBe("https://billgrokker.com/#logo");
            });

            it("persists across prepareToNavigate", () => {
                seoService.initialize({rootUrl: "https://billgrokker.com"});
                seoService.siteWide.setLogo({url: "https://billgrokker.com/logo.png", width: 200, height: 60});

                seoService.prepareToNavigate();

                const graph = getGraph(document);
                const logoNode = findNodeById(graph!, "https://billgrokker.com/#logo") as Record<string, unknown>;
                expect(logoNode).toBeDefined();
                expect(logoNode.url).toBe("https://billgrokker.com/logo.png");
                expect(logoNode.width).toBe(200);
            });
        });

        describe("setOrganization", () => {
            it("creates or updates the Organization base node", () => {
                seoService.initialize({rootUrl: "https://billgrokker.com"});
                seoService.siteWide.setOrganization({
                    name: "Test Org",
                    url: "https://example.com",
                    sameAs: ["https://x.com/test"],
                });

                const graph = getGraph(document);
                const orgNode = findNodeById(graph!, "https://billgrokker.com/#organization") as Record<string, unknown>;
                expect(orgNode).toBeDefined();
                expect(orgNode["@type"]).toBe("Organization");
                expect(orgNode.name).toBe("Test Org");
                expect(orgNode.url).toBe("https://example.com");
                expect(orgNode.sameAs).toEqual(["https://x.com/test"]);
            });

            it("defaults url to rootUrl when not provided", () => {
                seoService.initialize({rootUrl: "https://billgrokker.com"});
                seoService.siteWide.setOrganization({name: "NoUrl Org"});

                const graph = getGraph(document);
                const orgNode = findNodeById(graph!, "https://billgrokker.com/#organization") as Record<string, unknown>;
                expect(orgNode.url).toBe("https://billgrokker.com");
            });

            it("sets webApplication.publisher ref when app exists and publisher is unset", () => {
                seoService.initialize({rootUrl: "https://billgrokker.com"});
                seoService.siteWide.setOrganization({name: "Pub Org"});

                const graph = getGraph(document);
                const appNode = findNodeById(graph!, "https://billgrokker.com/#webapplication") as Record<string, unknown>;
                expect((appNode.publisher as Record<string, unknown>)["@id"]).toBe("https://billgrokker.com/#organization");
            });

            it("persists across prepareToNavigate", () => {
                seoService.initialize({rootUrl: "https://billgrokker.com"});
                seoService.siteWide.setOrganization({name: "Persistent Org"});

                seoService.prepareToNavigate();

                const graph = getGraph(document);
                const orgNode = findNodeById(graph!, "https://billgrokker.com/#organization") as Record<string, unknown>;
                expect(orgNode).toBeDefined();
                expect(orgNode.name).toBe("Persistent Org");
            });
        });

        describe("setWebApplication", () => {
            it("creates or updates the WebApplication base node", () => {
                seoService.initialize({rootUrl: "https://billgrokker.com"});
                seoService.siteWide.setWebApplication({
                    name: "Test App",
                    description: "Test description",
                    softwareVersion: "2.0.0",
                    applicationCategory: "Education",
                });

                const graph = getGraph(document);
                const appNode = findNodeById(graph!, "https://billgrokker.com/#webapplication") as Record<string, unknown>;
                expect(appNode).toBeDefined();
                expect(appNode["@type"]).toEqual(["WebApplication", "SoftwareApplication"]);
                expect(appNode.name).toBe("Test App");
                expect(appNode.description).toBe("Test description");
                expect(appNode.softwareVersion).toBe("2.0.0");
                expect(appNode.applicationCategory).toBe("Education");
                expect(appNode.operatingSystem).toBe("All");
                expect((appNode.offers as Record<string, unknown>)?.price).toBe("0");
                expect((appNode.offers as Record<string, unknown>)?.priceCurrency).toBe("USD");
            });

            it("defaults url to rootUrl when not provided", () => {
                seoService.initialize({rootUrl: "https://billgrokker.com"});
                seoService.siteWide.setWebApplication({name: "NoUrl App"});

                const graph = getGraph(document);
                const appNode = findNodeById(graph!, "https://billgrokker.com/#webapplication") as Record<string, unknown>;
                expect(appNode.url).toBe("https://billgrokker.com");
            });

            it("persists across prepareToNavigate", () => {
                seoService.initialize({rootUrl: "https://billgrokker.com"});
                seoService.siteWide.setWebApplication({name: "Persistent App", softwareVersion: "3.0.0"});

                seoService.prepareToNavigate();

                const graph = getGraph(document);
                const appNode = findNodeById(graph!, "https://billgrokker.com/#webapplication") as Record<string, unknown>;
                expect(appNode).toBeDefined();
                expect(appNode.name).toBe("Persistent App");
                expect(appNode.softwareVersion).toBe("3.0.0");
            });
        });
    });

    describe("in-memory graph store", () => {
        it("seeds _graphNodes from loader output on initialize", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});

            const graph = getGraph(document);
            expect(graph).not.toBeNull();
            expect(findNodeById(graph!, "https://billgrokker.com/#logo")).toBeDefined();
            expect(findNodeById(graph!, "https://billgrokker.com/#organization")).toBeDefined();
            expect(findNodeById(graph!, "https://billgrokker.com/#webapplication")).toBeDefined();
        });

        it("does not call _readGraphDocument on subsequent graph mutations", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});

            const readSpy = vi.spyOn(seoService as unknown as {_readGraphDocument: () => unknown}, "_readGraphDocument");

            seoService.emit({webPage: {canonicalPath: "/test", description: "Test page"}});
            seoService.emit({article: {canonicalPath: "/test", description: "Test article", datePublished: "2024-01-01", dateModified: "2024-01-01"}});
            seoService.siteWide.setBaseGraphNode({
                "@id": "https://billgrokker.com/#extra",
                "@type": "Thing",
                "name": "Extra",
            } as unknown as JsonLdObject);

            expect(readSpy).not.toHaveBeenCalled();

            readSpy.mockRestore();
        });

        it("flushes the graph after each mutation", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});

            const serializeSpy = vi.spyOn(seoService as unknown as {_serializeGraph: () => void}, "_serializeGraph");
            const baseline = serializeSpy.mock.calls.length;

            seoService.emit({webPage: {canonicalPath: "/a", description: "A"}});
            const afterWebPage = serializeSpy.mock.calls.length;
            expect(afterWebPage).toBeGreaterThan(baseline);

            seoService.emit({article: {canonicalPath: "/a", description: "A", datePublished: "2024-01-01", dateModified: "2024-01-01"}});
            const afterArticle = serializeSpy.mock.calls.length;
            expect(afterArticle).toBeGreaterThan(afterWebPage);

            seoService.emit({keywords: ["foo", "bar"]});
            const afterKeywords = serializeSpy.mock.calls.length;
            expect(afterKeywords).toBeGreaterThan(afterArticle);

            serializeSpy.mockRestore();
        });

        it("does not serialize when graph is not dirty", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});

            const serializeSpy = vi.spyOn(seoService as unknown as {_serializeGraph: () => void}, "_serializeGraph");
            const baseline = serializeSpy.mock.calls.length;

            seoService.emit({title: "New Title"});
            seoService.emit({description: "New Desc"});
            seoService.emit({image: "https://billgrokker.com/img.png"});

            expect(serializeSpy.mock.calls.length).toBe(baseline);

            serializeSpy.mockRestore();
        });

        it("falls back to _readGraphDocument when loader produced no jsonLd", () => {
            const originalDoc = globalThis.document;
            Object.defineProperty(globalThis, "document", {value: createDocumentNoGraph() as unknown as Document, configurable: true, writable: true});

            try {
                const freshService = new SeoService();
                const readSpy = vi.spyOn(freshService as unknown as {_readGraphDocument: () => unknown}, "_readGraphDocument");

                freshService.initialize({rootUrl: "https://billgrokker.com"});

                expect(readSpy).toHaveBeenCalled();

                readSpy.mockRestore();
            } finally {
                Object.defineProperty(globalThis, "document", {value: originalDoc, configurable: true, writable: true});
            }
        });

        it("preserves loader-seeded nodes across prepareToNavigate when no manual override", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});

            seoService.emit({webPage: {canonicalPath: "/page1", description: "Page 1"}});

            seoService.prepareToNavigate();

            const graph = getGraph(document);
            expect(findNodeById(graph!, "https://billgrokker.com/page1#webpage")).toBeUndefined();
            expect(findNodeById(graph!, "https://billgrokker.com/#logo")).toBeDefined();
            expect(findNodeById(graph!, "https://billgrokker.com/#organization")).toBeDefined();
            expect(findNodeById(graph!, "https://billgrokker.com/#webapplication")).toBeDefined();
        });

        it("prepareToNavigate flushes the cleared state before next observation", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.siteWide.setOrganization({name: "Test Org"});
            seoService.siteWide.setWebApplication({name: "Test App"});
            seoService.siteWide.setLogo({url: "https://billgrokker.com/logo.png", width: 300, height: 68});

            seoService.emit({webPage: {canonicalPath: "/page1", description: "Page 1"}});
            seoService.emit({article: {canonicalPath: "/page1", description: "Article 1", datePublished: "2024-01-01", dateModified: "2024-01-01"}});

            let graph = getGraph(document);
            expect(findNodeById(graph!, "https://billgrokker.com/page1#webpage")).toBeDefined();
            expect(findNodeById(graph!, "https://billgrokker.com/page1#article")).toBeDefined();

            seoService.prepareToNavigate();

            graph = getGraph(document);
            expect(findNodeById(graph!, "https://billgrokker.com/page1#webpage")).toBeUndefined();
            expect(findNodeById(graph!, "https://billgrokker.com/page1#article")).toBeUndefined();
            expect(findNodeById(graph!, "https://billgrokker.com/#logo")).toBeDefined();
            expect(findNodeById(graph!, "https://billgrokker.com/#organization")).toBeDefined();
            expect(findNodeById(graph!, "https://billgrokker.com/#webapplication")).toBeDefined();
        });
    });

    describe("emit()", () => {
        it("renders a complete page in one atomic commit", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});

            seoService.emit({
                title: "Emit Title",
                description: "Emit description",
                url: "/emit-page",
                ogType: "article",
                image: "https://example.com/img.png",
                keywords: ["emit", "seo"],
                breadcrumbs: [{name: "Home", url: "/"}, {name: "Emit", url: "/emit-page"}],
                noIndex: true,
                statusCode: 404,
                twitter: {card: "summary_large_image", handle: "@emit"},
                webPage: {canonicalPath: "/emit-page", description: "Emit description", breadcrumb: true},
            });

            expect(document.title).toBe("Emit Title | Bill Grokker");
            const meta = (name: string) => document.querySelector(`meta[name="${name}"]`)?.getAttribute("content")
                ?? document.querySelector(`meta[property="${name}"]`)?.getAttribute("content");
            expect(meta("description")).toBe("Emit description");
            expect(meta("og:title")).toBe("Emit Title");
            expect(meta("og:url")).toBe("https://billgrokker.com/emit-page");
            expect(meta("og:type")).toBe("article");
            expect(meta("og:image")).toBe("https://example.com/img.png");
            expect(meta("keywords")).toBe("emit, seo");
            expect(meta("robots")).toBe("noindex, nofollow");
            expect(meta("prerender-status-code")).toBe("404");
            expect(meta("twitter:card")).toBe("summary_large_image");
            expect(meta("twitter:site")).toBe("@emit");

            const graph = getGraph(document)!;
            const webPage = findNodeById(graph, "https://billgrokker.com/emit-page#webpage");
            expect(webPage).toBeDefined();
            expect(webPage?.["@type"]).toBe("WebPage");
            const breadcrumb = findNodeById(graph, "https://billgrokker.com/emit-page#breadcrumb");
            expect(breadcrumb).toBeDefined();
            expect(breadcrumb?.["@type"]).toBe("BreadcrumbList");
        });

        it("replaces page-state list when keywords is a bare array", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({keywords: ["a", "b", "c"]});
            expect((document.querySelector('meta[name="keywords"]') as HTMLMetaElement).content).toBe("a, b, c");

            seoService.emit({keywords: ["x"]});
            expect((document.querySelector('meta[name="keywords"]') as HTMLMetaElement).content).toBe("x");
        });

        it("appends page-state list when keywords uses {append: [...}]", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({keywords: ["a", "b"]});
            seoService.emit({keywords: {append: ["c", "d"]}});
            expect((document.querySelector('meta[name="keywords"]') as HTMLMetaElement).content).toBe("a, b, c, d");
        });

        it("appends to breadcrumbs via {append: [...}] without resetting", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({
                webPage: {canonicalPath: "/p", description: "d", breadcrumb: true},
                breadcrumbs: [{name: "Home", url: "/"}],
            });

            seoService.emit({
                breadcrumbs: {append: [{name: "Sub", url: "/p/sub"}]},
            });

            const graph = getGraph(document)!;
            const bc = findNodeById(graph, "https://billgrokker.com/p#breadcrumb");
            const items = (bc?.itemListElement as Array<{item: {name: string}}>) ?? [];
            expect(items.map(i => i.item.name)).toEqual(["Home", "Sub"]);
        });

        it("partial emit: omitted fields leave page-state untouched", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({title: "First", description: "First desc"});
            expect(document.title).toBe("First | Bill Grokker");
            expect((document.querySelector('meta[name="description"]') as HTMLMetaElement).content).toBe("First desc");

            seoService.emit({title: "Second"});
            expect(document.title).toBe("Second | Bill Grokker");
            expect((document.querySelector('meta[name="description"]') as HTMLMetaElement).content).toBe("First desc");
        });

        it("layered emit: wrapper appends keywords, page omits — wrapper persists alongside site defaults", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            const before = (document.querySelector('meta[name="keywords"]') as HTMLMetaElement).content;
            expect(before).not.toContain("wrapper-tag");

            seoService.emit({keywords: {append: ["wrapper-tag"]}});

            seoService.emit({
                title: "Layered",
                webPage: {canonicalPath: "/layered", description: "L"},
            });

            const kw = (document.querySelector('meta[name="keywords"]') as HTMLMetaElement).content;
            expect(kw.split(", ")).toContain("wrapper-tag");
            expect(kw.split(", ")).toContain("policy");
            const graph = getGraph(document)!;
            expect(findNodeById(graph, "https://billgrokker.com/layered#webpage")).toBeDefined();
        });

        it("emitting the same webPage twice with the same canonicalPath updates in place", () => {
            seoService.initialize({rootUrl: "https://billgrokker.com"});
            seoService.emit({webPage: {canonicalPath: "/same", description: "v1"}});
            const graph1 = getGraph(document)!;
            const node1 = findNodeById(graph1, "https://billgrokker.com/same#webpage") as {description: string} | undefined;
            expect(node1?.description).toBe("v1");

            seoService.emit({webPage: {canonicalPath: "/same", description: "v2"}});
            const graph2 = getGraph(document)!;
            const node2 = findNodeById(graph2, "https://billgrokker.com/same#webpage") as {description: string} | undefined;
            expect(node2?.description).toBe("v2");
            const sameIdNodes = graph2["@graph"].filter(n => n?.["@id"] === "https://billgrokker.com/same#webpage");
            expect(sameIdNodes).toHaveLength(1);
        });
    });
});
