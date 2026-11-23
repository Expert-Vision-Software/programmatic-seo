import {describe, expect, it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {JSDOM} from "jsdom";
import type {Thing} from "schema-dts";
import {SeoService} from "../src/index.js";
import type {BreadcrumbItem} from "../src/seo-page.js";
import {normalizeHead, type RawHead} from "../scripts/normalize.js";

const ROOT_URL = "https://billgrokker.com";
const FIXTURES_DIR = join(process.cwd(), "fixtures", "baseline");

interface Fixture {
    route: string;
    capturedAt: string;
    head: RawHead;
    bill: {
        title: string;
        dates: {datePublished: string; dateModified: string};
        policyArea: string;
        breadcrumbs: string[];
    } | null;
}

interface GraphNode {
    "@id"?: string;
    "@type"?: string | string[];
    mainEntity?: unknown;
    [key: string]: unknown;
}

function loadFixture(slug: string): Fixture {
    return JSON.parse(readFileSync(join(FIXTURES_DIR, `${slug}.json`), "utf8")) as Fixture;
}

const STATIC_HEAD = `<head>
    <title>AI-Powered Legislative Summaries | Bill Grokker</title>
    <meta charset="utf-8"/>
    <meta content="width=device-width, initial-scale=1" name="viewport"/>
    <meta content="Bill Grokker offers AI-powered legislative summaries for bills and executive orders. Understand bills or laws with analysis and bias scoring." name="description"/>
    <meta content="legislation, bill summaries, executive orders, AI analysis, bias scoring, government, policy, law" name="keywords"/>
    <meta content="index, follow" name="robots"/>
    <meta content="Bill Grokker: AI-Powered Legislative Summaries" property="og:title"/>
    <meta content="Bill Grokker" property="og:site_name"/>
    <meta content="website" property="og:type"/>
    <meta content="en" property="og:locale"/>
    <meta content="Bill Grokker offers AI-powered legislative summaries for bills and executive orders. Understand bills or laws with analysis and bias scoring." property="og:description"/>
    <meta content="https://billgrokker.com/images/logo-color.png" property="og:image"/>
    <meta content="https://billgrokker.com/images/logo-color.png" property="og:logo"/>
    <meta content="300" property="og:image:width"/>
    <meta content="68" property="og:image:height"/>
    <meta content="legislation, bill summaries, executive orders, AI analysis, bias scoring, government, policy, law" property="og:keywords"/>
    <meta content="summary" name="twitter:card"/>
    <meta content="@BillGrokker" name="twitter:site"/>
    <meta content="billgrokker.com" property="twitter:domain"/>
    <meta content="Bill Grokker: AI-Powered Legislative Summaries" name="twitter:title"/>
    <meta content="Analyze US legislation with AI summaries, multi-perspective analysis, and bias scoring on Bill Grokker." name="twitter:description"/>
    <meta content="https://billgrokker.com/images/logo-color.png" name="twitter:image"/>
    <meta content="yes" name="mobile-web-app-capable"/>
    <meta content="Bill Grokker" name="apple-mobile-web-app-title"/>
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
                "contactPoint": {
                    "@type": "ContactPoint",
                    "contactType": "customer service",
                    "url": "mailto:support@expertvision.software"
                }
            },
            {
                "@id": "https://billgrokker.com/#webapplication",
                "@type": "WebApplication",
                "name": "Bill Grokker",
                "url": "https://billgrokker.com",
                "description": "Bill Grokker offers AI-powered legislative summaries for bills and executive orders. Understand bills or laws with analysis and bias scoring.",
                "keywords": [
                    "legislation",
                    "bill summaries",
                    "executive orders",
                    "AI analysis",
                    "bias scoring",
                    "government",
                    "policy",
                    "law"
                ],
                "applicationCategory": "Government",
                "applicationSubCategory": "Legislative Analysis",
                "operatingSystem": "All",
                "browserRequirements": "Requires JavaScript, HTML5",
                "softwareVersion": "1.0.0",
                "publisher": {"@id": "https://billgrokker.com/#organization"},
                "sameAs": [
                    "https://x.com/billgrokker",
                    "https://github.com/billgrokker"
                ],
                "potentialAction": [
                    {
                        "@type": "SearchAction",
                        "target": {
                            "@type": "EntryPoint",
                            "urlTemplate": "https://billgrokker.com/bills/search?q={search_term_string}&exec=1"
                        },
                        "query-input": "required name=search_term_string"
                    },
                    {
                        "@type": "SearchAction",
                        "target": {
                            "@type": "EntryPoint",
                            "urlTemplate": "https://billgrokker.com/bills/search?bill_number={search_bill_number}&exec=1"
                        },
                        "query-input": "required name=search_bill_number"
                    }
                ]
            }
        ]
    }
    </script>
</head>`;

const HOME_BREADCRUMB: BreadcrumbItem = {name: "Home", url: "/"};
const FAQ_BREADCRUMB: BreadcrumbItem = {name: "FAQ", url: "/faq/"};
const SEARCH_DEFAULT_BREADCRUMB: BreadcrumbItem = {name: "Search Bills", url: "/bills/search"};

const SITE_DEFAULT_DESCRIPTION =
    "Bill Grokker offers AI-powered legislative summaries for bills and executive orders. Understand bills or laws with analysis and bias scoring.";

interface RoutePlan {
    slug: string;
    browserLocation: string;
    routerTitleChain?: string[];
    synthesize: (service: SeoService, fixture: Fixture) => void;
}

function siteWideSetup(service: SeoService): void {
    service.siteWide.setBreadcrumb([HOME_BREADCRUMB]);
    service.siteWide.setLogo({
        url: `${ROOT_URL}/images/logo-color.png`,
        width: 300,
        height: 68,
        caption: "Bill Grokker",
    });
    service.siteWide.setOrganization({
        name: "Bill Grokker",
        url: ROOT_URL,
        sameAs: [
            "https://x.com/billgrokker",
            "https://www.facebook.com/billgrokker",
            "https://www.instagram.com/billgrokker",
            "https://www.linkedin.com/company/billgrokker",
            "https://github.com/billgrokker",
        ],
        contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer service",
            url: "mailto:support@expertvision.software",
        },
    });
    service.siteWide.setWebApplication({
        name: "Bill Grokker",
        description: SITE_DEFAULT_DESCRIPTION,
        softwareVersion: "1.0.0",
        applicationCategory: "Government",
    });
}

function fixtureGraphNode(fixture: Fixture, idSuffix: string): GraphNode {
    const block = fixture.head.jsonLd[0] as {"@graph": GraphNode[]};
    const node = block["@graph"].find((n) => typeof n["@id"] === "string" && String(n["@id"]).endsWith(idSuffix));
    if (!node) throw new Error(`${fixture.route}: no JSON-LD node ending in ${idSuffix}`);
    return node;
}

function fixtureDescription(fixture: Fixture): string {
    const meta = fixture.head.metas.find((m) => m.name === "description");
    if (!meta?.content) throw new Error(`${fixture.route}: no description meta in fixture`);
    return meta.content;
}

function parseBillRoute(route: string): {congress: string; type: string; number: string} {
    const match = route.match(/^\/bills\/(\d+)\/([a-z]+)\/(\d+)$/);
    if (!match) throw new Error(`unparseable bill route: ${route}`);
    const [, congress, type, number] = match;
    return {congress: congress as string, type: type as string, number: number as string};
}

const ROUTE_PLANS: RoutePlan[] = [
    {
        slug: "home",
        browserLocation: `${ROOT_URL}/`,
        routerTitleChain: ["AI-Powered Legislative Summaries"],
        synthesize: () => undefined,
    },
    {
        slug: "bills-search",
        browserLocation: `${ROOT_URL}/bills/search`,
        synthesize: (service) => {
            const pageDesc = "Legislation bills related to a search term.";
            service.page()
                .setTitle("Search Bills")
                .setDescription(pageDesc)
                .setUrl("/bills/search")
                .setWebPage({
                    description: pageDesc,
                    datePublished: "2025-08-01",
                    dateModified: new Date().toISOString(),
                    breadcrumb: true,
                })
                .setBreadcrumbs([SEARCH_DEFAULT_BREADCRUMB])
                .setKeywords("legislation", "bills", "congress", "bill grokker", "search legislation", "")
                .setOgType("website")
                .emit();
        },
    },
    {
        slug: "faq",
        browserLocation: `${ROOT_URL}/faq/index`,
        routerTitleChain: ["FAQ", "Frequently Asked Questions"],
        synthesize: (service, fixture) => {
            const pageDesc = "Frequently asked questions about Bill Grokker and how it works.";
            const mainEntity = fixtureGraphNode(fixture, "#faqpage")["mainEntity"] as Thing[];
            service.page()
                .setTitle("Frequently Asked Questions")
                .setDescription(pageDesc)
                .setUrl("/faq")
                .setWebPage({
                    description: pageDesc,
                    datePublished: "2025-08-01",
                    dateModified: "2025-08-05",
                    breadcrumb: true,
                })
                .setFaqPage({canonicalPath: "/faq", mainEntity})
                .setBreadcrumbs([FAQ_BREADCRUMB])
                .setKeywords("legislation", "bills", "congress", "bill grokker", "frequent questions", "common questions", "explanation")
                .emit();
        },
    },
    {
        slug: "faq-companion-bills",
        browserLocation: `${ROOT_URL}/faq/companion-bills`,
        routerTitleChain: ["Companion Bills Explained", "Frequently Asked Questions"],
        synthesize: (service, fixture) => {
            const pageDesc =
                "Companion bills are identical or nearly identical bills introduced in both the House and Senate simultaneously to accelerate the legislative process.";
            const mainEntity = fixtureGraphNode(fixture, "#webpage")["mainEntity"] as Thing;
            service.page()
                .setTitle("Companion Bills Explained")
                .setDescription(pageDesc)
                .setUrl("/faq/companion-bills")
                .setWebPage({
                    description: pageDesc,
                    datePublished: "2025-07-25",
                    dateModified: "2025-07-25",
                    breadcrumb: true,
                    mainEntity,
                })
                .setKeywords("companion bills", "legislation", "congress", "house", "senate", "bicameral", "bill duplication")
                .setBreadcrumbs([
                    FAQ_BREADCRUMB,
                    {name: "Companion Bills", url: "/faq/companion-bills"},
                ])
                .setOgType("article")
                .emit();
        },
    },
    {
        slug: "bill-119-hr-1",
        browserLocation: `${ROOT_URL}/bills/119/hr/1`,
        synthesize: (service, fixture) => {
            synthesizeBillDetail(service, fixture);
        },
    },
    {
        slug: "bill-119-s-5653",
        browserLocation: `${ROOT_URL}/bills/119/s/5653`,
        synthesize: (service, fixture) => {
            synthesizeBillDetail(service, fixture);
        },
    },
    {
        slug: "not-found",
        browserLocation: `${ROOT_URL}/not-found`,
        routerTitleChain: ["Not Found"],
        synthesize: (service) => {
            service.emit({
                description: "The page you requested could not be found.",
                noIndex: true,
                statusCode: 404,
                responseHttpStatus: 404,
            });
        },
    },
    {
        slug: "account-login",
        browserLocation: `${ROOT_URL}/account/login`,
        routerTitleChain: ["Login"],
        synthesize: (service) => {
            service.emit({noIndex: true});
        },
    },
    {
        slug: "account-signup",
        browserLocation: `${ROOT_URL}/account/signup`,
        routerTitleChain: ["Register for an Account"],
        synthesize: (service) => {
            service.emit({noIndex: true});
        },
    },
];

function synthesizeBillDetail(service: SeoService, fixture: Fixture): void {
    const bill = fixture.bill;
    if (!bill) throw new Error(`${fixture.route}: fixture has no bill metadata block`);
    const {congress, type, number} = parseBillRoute(fixture.route);
    const billIdentifier = `${type}${number}`;
    const formattedBillId = `${type.toUpperCase()}. ${number} (${congress}th)`;
    const canonicalPath = `/bills/${congress}/${type.toLowerCase()}/${number}`;

    const cp = service.page()
        .setTitle(bill.title)
        .setDescription(fixtureDescription(fixture))
        .setUrl(canonicalPath)
        .contentPage()
        .setDates({
            published: bill.dates.datePublished,
            modified: bill.dates.dateModified,
        })
        .setKeywords(`bills, legislation, congress, government, politics, ${billIdentifier}`)
        .setBreadcrumbs([
            SEARCH_DEFAULT_BREADCRUMB,
            {name: `${congress}th Congress`, url: `/bills/${congress}/search`},
            {name: formattedBillId, url: canonicalPath},
        ]);
    if (bill.policyArea) {
        cp.setAbout(bill.policyArea).setSection(bill.policyArea);
    }
    cp.emit();
}

function createDom(location: string): {dom: JSDOM; service: SeoService} {
    const dom = new JSDOM(`<!DOCTYPE html><html lang="en">${STATIC_HEAD}<body><my-app></my-app></body></html>`, {
        url: location,
    });
    Object.defineProperty(globalThis, "document", {
        value: dom.window.document,
        configurable: true,
        writable: true,
    });
    Object.defineProperty(globalThis, "window", {
        value: dom.window,
        configurable: true,
        writable: true,
    });
    const service = new SeoService();
    service.initialize({rootUrl: ROOT_URL});
    return {dom, service};
}

function readHead(dom: JSDOM): RawHead {
    const doc = dom.window.document;
    const metaNodes = Array.from(doc.head.querySelectorAll("meta"));
    return {
        title: doc.title,
        metas: metaNodes.map((m) => ({
            name: m.getAttribute("name"),
            property: m.getAttribute("property"),
            content: m.getAttribute("content"),
        })),
        canonical: doc.head.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? null,
        jsonLd: Array.from(doc.head.querySelectorAll('script[type="application/ld+json"]')).map((s) =>
            JSON.parse(s.textContent ?? "null")
        ),
    };
}

function applyRouterTitle(dom: JSDOM, chain: string[]): void {
    const titlePart = chain.join(" | ");
    const baseTitle = [...chain, "Bill Grokker"].join(" | ");
    dom.window.document.title = `${titlePart} | ${baseTitle}`;
}

describe("baseline synthesis (fixtures vs public API)", () => {
    for (const plan of ROUTE_PLANS) {
        it(`reproduces ${plan.slug} (${loadFixture(plan.slug).route})`, () => {
            const fixture = loadFixture(plan.slug);
            const {dom, service} = createDom(plan.browserLocation);
            try {
                siteWideSetup(service);
                plan.synthesize(service, fixture);
                service.setUrl(plan.browserLocation);
                if (plan.routerTitleChain) {
                    applyRouterTitle(dom, plan.routerTitleChain);
                }
                const today = new Date().toISOString().slice(0, 10);
                const synthesized = normalizeHead(readHead(dom), today);
                expect(synthesized).toEqual(fixture.head);
            } finally {
                dom.window.close();
            }
        });
    }
});
