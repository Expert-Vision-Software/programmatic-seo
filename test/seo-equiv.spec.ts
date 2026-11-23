import {describe, expect, it, afterEach, vi} from "vitest";
import {SeoService} from "../src/index.js";
import type {JsonLdObject} from "schema-dts";

import {JSDOM} from "jsdom";

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
    <meta content="https://billgrokker.com/" property="og:url"/>
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

describe("SeoService L0 emit API", () => {
    afterEach(() => {
        vi.resetAllMocks();
    });

    function createSeoService(doc: Document): SeoService {
        Object.defineProperty(globalThis, "document", {value: doc, configurable: true, writable: true});
        Object.defineProperty(globalThis, "window", {value: doc.defaultView as unknown as Window & typeof globalThis, configurable: true, writable: true});
        return new SeoService();
    }

    function extractGraph(doc: Document): GraphDocument {
        const graph = getGraph(doc);
        if (!graph) {
            return {"@context": "https://schema.org", "@graph": []};
        }
        return graph;
    }

    describe("Scenario 1: Detail page with article", () => {
        it("L0 plain object emit produces correct JSON-LD graph", () => {
            const doc = createDocument();
            const seo = createSeoService(doc);
            seo.initialize({rootUrl: "https://billgrokker.com"});

            seo.emit({
                title: "H.R. 1",
                description: "Test bill",
                url: "/bills/119/hr-1",
                ogType: "article",
                webPage: { canonicalPath: "/bills/119/hr-1", name: "H.R. 1", description: "Test bill", datePublished: "2025-08-01T00:00:00+00:00", dateModified: "2025-08-05T00:00:00+00:00", breadcrumb: true },
                article: { canonicalPath: "/bills/119/hr-1", name: "H.R. 1", headline: "H.R. 1", description: "Test bill", datePublished: "2025-08-01T00:00:00+00:00", dateModified: "2025-08-05T00:00:00+00:00", about: { "@type": "Thing", name: "Policy Area" }, articleSection: "Policy Area", keywords: "bills,legislation" },
                breadcrumbs: [{ name: "Home", url: "/" }, { name: "119th Congress", url: "/bills/119/search" }],
                keywords: ["bills", "legislation"]
            });

            const graph = extractGraph(doc);

            const webpageNode = graph["@graph"].find(n => n?.["@id"] === "https://billgrokker.com/bills/119/hr-1#webpage");
            const articleNode = graph["@graph"].find(n => n?.["@id"] === "https://billgrokker.com/bills/119/hr-1#article");
            const breadcrumbNode = graph["@graph"].find(n => n?.["@id"] === "https://billgrokker.com/bills/119/hr-1#breadcrumb");

            expect(webpageNode).toBeDefined();
            expect(webpageNode?.["@type"]).toBe("WebPage");
            expect((webpageNode as Record<string, unknown>).name).toBe("H.R. 1");
            expect((webpageNode as Record<string, unknown>).description).toBe("Test bill");
            expect((webpageNode as Record<string, unknown>).datePublished).toBe("2025-08-01T00:00:00+00:00");
            expect((webpageNode as Record<string, unknown>).dateModified).toBe("2025-08-05T00:00:00+00:00");

            expect(articleNode).toBeDefined();
            expect(articleNode?.["@type"]).toBe("Article");
            expect((articleNode as Record<string, unknown>).name).toBe("H.R. 1");
            expect((articleNode as Record<string, unknown>).headline).toBe("H.R. 1");
            expect((articleNode as Record<string, unknown>).description).toBe("Test bill");
            expect((articleNode as Record<string, unknown>).datePublished).toBe("2025-08-01T00:00:00+00:00");
            expect((articleNode as Record<string, unknown>).dateModified).toBe("2025-08-05T00:00:00+00:00");
            expect((articleNode as Record<string, unknown>).articleSection).toBe("Policy Area");
            expect((articleNode as Record<string, unknown>).keywords).toBe("bills, legislation");

            expect(breadcrumbNode).toBeDefined();
            expect(breadcrumbNode?.["@type"]).toBe("BreadcrumbList");
        });
    });

    describe("Scenario 2: Search page (website, no article)", () => {
        it("L0 plain object emit produces correct JSON-LD graph", () => {
            const doc = createDocument();
            const seo = createSeoService(doc);
            seo.initialize({rootUrl: "https://billgrokker.com"});

            seo.emit({
                title: "Search",
                description: "Search legislation",
                url: "/search",
                ogType: "website",
                webPage: { canonicalPath: "/search", name: "Search", description: "Search legislation", datePublished: "2025-08-01T00:00:00+00:00", dateModified: "2025-08-05T00:00:00+00:00", breadcrumb: true },
                breadcrumbs: [{ name: "Home", url: "/" }],
                keywords: ["legislation", "bills"]
            });

            const graph = extractGraph(doc);

            const webpageNode = graph["@graph"].find(n => n?.["@id"] === "https://billgrokker.com/search#webpage");
            const breadcrumbNode = graph["@graph"].find(n => n?.["@id"] === "https://billgrokker.com/search#breadcrumb");

            expect(webpageNode).toBeDefined();
            expect(webpageNode?.["@type"]).toBe("WebPage");
            expect((webpageNode as Record<string, unknown>).name).toBe("Search");
            expect((webpageNode as Record<string, unknown>).description).toBe("Search legislation");
            expect((webpageNode as Record<string, unknown>).datePublished).toBe("2025-08-01T00:00:00+00:00");
            expect((webpageNode as Record<string, unknown>).dateModified).toBe("2025-08-05T00:00:00+00:00");

            expect(breadcrumbNode).toBeDefined();
            expect(breadcrumbNode?.["@type"]).toBe("BreadcrumbList");

            const articleNode = graph["@graph"].find(n => (n as Record<string, unknown>)?.["@type"] === "Article");
            expect(articleNode).toBeUndefined();
        });
    });

    describe("Scenario 3: FAQ index (webPage + faqPage)", () => {
        it("L0 plain object emit produces correct JSON-LD graph", () => {
            const doc = createDocument();
            const seo = createSeoService(doc);
            seo.initialize({rootUrl: "https://billgrokker.com"});

            seo.emit({
                title: "FAQ",
                description: "Frequently asked questions",
                url: "/faq",
                ogType: "website",
                webPage: { canonicalPath: "/faq", name: "FAQ", description: "Frequently asked questions", datePublished: "2025-08-01T00:00:00+00:00", dateModified: "2025-08-05T00:00:00+00:00", breadcrumb: true },
                faqPage: { canonicalPath: "/faq", mainEntity: [{ "@type": "Question", "name": "Why are bills duplicated?", "acceptedAnswer": { "@type": "Answer", "text": "Because both chambers must pass identical text." } }] },
                breadcrumbs: [{ name: "Home", url: "/" }, { name: "FAQ", url: "/faq" }],
                keywords: ["faq", "questions"]
            });

            const graph = extractGraph(doc);

            const webpageNode = graph["@graph"].find(n => n?.["@id"] === "https://billgrokker.com/faq#webpage");
            const faqNode = graph["@graph"].find(n => n?.["@id"] === "https://billgrokker.com/faq#faqpage");
            const breadcrumbNode = graph["@graph"].find(n => n?.["@id"] === "https://billgrokker.com/faq#breadcrumb");

            expect(webpageNode).toBeDefined();
            expect(webpageNode?.["@type"]).toBe("WebPage");
            expect((webpageNode as Record<string, unknown>).name).toBe("FAQ");

            expect(faqNode).toBeDefined();
            expect(faqNode?.["@type"]).toBe("FAQPage");
            expect((faqNode as Record<string, unknown>).mainEntity).toHaveLength(1);
            expect(((faqNode as Record<string, unknown>).mainEntity as Record<string, unknown>[])[0]?.name).toBe("Why are bills duplicated?");

            expect(breadcrumbNode).toBeDefined();

            const articleNode = graph["@graph"].find(n => (n as Record<string, unknown>)?.["@type"] === "Article");
            expect(articleNode).toBeUndefined();
        });
    });

    describe("Scenario 4: Companion bills (WebPage with Question mainEntity, no Article)", () => {
        it("L0 plain object emit produces correct JSON-LD graph", () => {
            const doc = createDocument();
            const seo = createSeoService(doc);
            seo.initialize({rootUrl: "https://billgrokker.com"});

            seo.emit({
                title: "Companion Bills",
                description: "FAQ about companion bills",
                url: "/faq/companion-bills",
                ogType: "article",
                webPage: { canonicalPath: "/faq/companion-bills", name: "Companion Bills", description: "FAQ about companion bills", datePublished: "2025-07-25T00:00:00+00:00", dateModified: "2025-07-25T00:00:00+00:00", breadcrumb: true, mainEntity: { "@type": "Question", "name": "Why are bills duplicated?", "acceptedAnswer": { "@type": "Answer", "text": "Because both chambers must pass identical text.", "url": "https://billgrokker.com/faq#why-are-bills-duplicated" } } },
                breadcrumbs: [{ name: "Home", url: "/" }, { name: "FAQ", url: "/faq" }, { name: "Companion Bills", url: "/faq/companion-bills" }],
                keywords: ["companion bills", "legislation"]
            });

            const graph = extractGraph(doc);

            const webpageNode = graph["@graph"].find(n => n?.["@id"] === "https://billgrokker.com/faq/companion-bills#webpage");
            const articleNode = graph["@graph"].find(n => n?.["@id"] === "https://billgrokker.com/faq/companion-bills#article");
            const breadcrumbNode = graph["@graph"].find(n => n?.["@id"] === "https://billgrokker.com/faq/companion-bills#breadcrumb");

            expect(webpageNode).toBeDefined();
            expect(webpageNode?.["@type"]).toBe("WebPage");
            expect((webpageNode as Record<string, unknown>).name).toBe("Companion Bills");
            expect((webpageNode as Record<string, unknown>).mainEntity).toBeDefined();

            expect(articleNode).toBeUndefined();

            expect(breadcrumbNode).toBeDefined();
        });
    });

    describe("Builder API vs L0 emit equivalence", () => {
        function normalizeGraph(graph: GraphDocument): GraphDocument {
            const sorted = [...graph["@graph"]].sort((a, b) => {
                const aId = (a as Record<string, unknown>)["@id"] as string ?? "";
                const bId = (b as Record<string, unknown>)["@id"] as string ?? "";
                return aId.localeCompare(bId);
            });
            return {"@context": graph["@context"], "@graph": sorted};
        }

        function emitL0(scenario: "details" | "search" | "faq" | "companion"): GraphDocument {
            const doc = createDocument();
            const seo = createSeoService(doc);
            seo.initialize({rootUrl: "https://billgrokker.com"});

            if (scenario === "details") {
                seo.emit({
                    title: "H.R. 1",
                    description: "Test bill",
                    url: "/bills/119/hr-1",
                    ogType: "article",
                    webPage: { canonicalPath: "/bills/119/hr-1", name: "H.R. 1", description: "Test bill", datePublished: "2025-08-01T00:00:00+00:00", dateModified: "2025-08-05T00:00:00+00:00", breadcrumb: true },
                    article: { canonicalPath: "/bills/119/hr-1", name: "H.R. 1", headline: "H.R. 1", description: "Test bill", datePublished: "2025-08-01T00:00:00+00:00", dateModified: "2025-08-05T00:00:00+00:00", about: { "@type": "Thing", name: "Policy Area" }, articleSection: "Policy Area", keywords: "bills, legislation" },
                    breadcrumbs: [{ name: "Home", url: "/" }, { name: "119th Congress", url: "/bills/119/search" }],
                    keywords: ["bills", "legislation"],
                });
            } else if (scenario === "search") {
                seo.emit({
                    title: "Search",
                    description: "Search legislation",
                    url: "/search",
                    ogType: "website",
                    webPage: { canonicalPath: "/search", name: "Search", description: "Search legislation", datePublished: "2025-08-01T00:00:00+00:00", dateModified: "2025-08-05T00:00:00+00:00", breadcrumb: true },
                    breadcrumbs: [{ name: "Home", url: "/" }],
                    keywords: ["legislation", "bills"],
                });
            } else if (scenario === "faq") {
                seo.emit({
                    title: "FAQ",
                    description: "Frequently asked questions",
                    url: "/faq",
                    ogType: "website",
                    webPage: { canonicalPath: "/faq", name: "FAQ", description: "Frequently asked questions", datePublished: "2025-08-01T00:00:00+00:00", dateModified: "2025-08-05T00:00:00+00:00", breadcrumb: true },
                    faqPage: { canonicalPath: "/faq", mainEntity: [{ "@type": "Question", "name": "Why are bills duplicated?", "acceptedAnswer": { "@type": "Answer", "text": "Because both chambers must pass identical text." } }] },
                    breadcrumbs: [{ name: "Home", url: "/" }, { name: "FAQ", url: "/faq" }],
                    keywords: ["faq", "questions"],
                });
            } else {
                seo.emit({
                    title: "Companion Bills",
                    description: "FAQ about companion bills",
                    url: "/faq/companion-bills",
                    ogType: "article",
                    webPage: { canonicalPath: "/faq/companion-bills", name: "Companion Bills", description: "FAQ about companion bills", datePublished: "2025-07-25T00:00:00+00:00", dateModified: "2025-07-25T00:00:00+00:00", breadcrumb: true, mainEntity: { "@type": "Question", "name": "Why are bills duplicated?", "acceptedAnswer": { "@type": "Answer", "text": "Because both chambers must pass identical text.", "url": "https://billgrokker.com/faq#why-are-bills-duplicated" } } },
                    breadcrumbs: [{ name: "Home", url: "/" }, { name: "FAQ", url: "/faq" }, { name: "Companion Bills", url: "/faq/companion-bills" }],
                    keywords: ["companion bills", "legislation"],
                });
            }

            return normalizeGraph(extractGraph(doc));
        }

        function emitBuilder(scenario: "details" | "search" | "faq" | "companion"): GraphDocument {
            const doc = createDocument();
            const seo = createSeoService(doc);
            seo.initialize({rootUrl: "https://billgrokker.com"});

            if (scenario === "details") {
                const cp = seo.page()
                    .setTitle("H.R. 1")
                    .setDescription("Test bill")
                    .setUrl("/bills/119/hr-1")
                    .contentPage()
                    .setDates({published: "2025-08-01", modified: "2025-08-05"})
                    .setKeywords("bills", "legislation")
                    .setBreadcrumbs([{ name: "Home", url: "/" }, { name: "119th Congress", url: "/bills/119/search" }]);
                cp.setAbout("Policy Area").setSection("Policy Area");
                cp.emit();
            } else if (scenario === "search") {
                seo.page()
                    .setTitle("Search")
                    .setDescription("Search legislation")
                    .setUrl("/search")
                    .setWebPage({ description: "Search legislation", datePublished: "2025-08-01", dateModified: "2025-08-05", breadcrumb: true })
                    .setBreadcrumbs([{ name: "Home", url: "/" }])
                    .setKeywords("legislation", "bills")
                    .setOgType("website")
                    .emit();
            } else if (scenario === "faq") {
                seo.page()
                    .setTitle("FAQ")
                    .setDescription("Frequently asked questions")
                    .setUrl("/faq")
                    .setWebPage({ description: "Frequently asked questions", datePublished: "2025-08-01", dateModified: "2025-08-05", breadcrumb: true })
                    .setFaqPage({ canonicalPath: "/faq", mainEntity: [{ "@type": "Question", "name": "Why are bills duplicated?", "acceptedAnswer": { "@type": "Answer", "text": "Because both chambers must pass identical text." } }] })
                    .setBreadcrumbs([{ name: "Home", url: "/" }, { name: "FAQ", url: "/faq" }])
                    .setKeywords("faq", "questions")
                    .setOgType("website")
                    .emit();
            } else {
                seo.page()
                    .setTitle("Companion Bills")
                    .setDescription("FAQ about companion bills")
                    .setUrl("/faq/companion-bills")
                    .setWebPage({ description: "FAQ about companion bills", datePublished: "2025-07-25", dateModified: "2025-07-25", breadcrumb: true, mainEntity: { "@type": "Question", "name": "Why are bills duplicated?", "acceptedAnswer": { "@type": "Answer", "text": "Because both chambers must pass identical text.", "url": "https://billgrokker.com/faq#why-are-bills-duplicated" } } })
                    .setBreadcrumbs([{ name: "Home", url: "/" }, { name: "FAQ", url: "/faq" }, { name: "Companion Bills", url: "/faq/companion-bills" }])
                    .setKeywords("companion bills", "legislation")
                    .setOgType("article")
                    .emit();
            }

            return normalizeGraph(extractGraph(doc));
        }

        for (const scenario of ["details", "search", "faq", "companion"] as const) {
            it(`${scenario} page: builder API produces identical JSON-LD to L0 emit`, () => {
                const l0Graph = emitL0(scenario);
                const builderGraph = emitBuilder(scenario);
                expect(builderGraph).toEqual(l0Graph);
            });
        }
    });
});
