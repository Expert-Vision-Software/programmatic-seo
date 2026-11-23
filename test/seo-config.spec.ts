import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {HtmlSeoConfigParser} from "../src/index.js";
import type {JsonLdScript} from "../src/index.js";

function addMeta(attrs: Record<string, string>): void {
    const meta = document.createElement("meta");
    for (const [key, value] of Object.entries(attrs)) {
        meta.setAttribute(key, value);
    }
    document.head.appendChild(meta);
}

function addGraphScript(dataId: string, content: string): void {
    const script = document.createElement("script");
    script.setAttribute("type", "application/ld+json");
    script.setAttribute("data-id", dataId);
    script.textContent = content;
    document.head.appendChild(script);
}

describe("HtmlSeoConfigParser", () => {
    beforeEach(() => {
        document.head.innerHTML = "";
        document.body.innerHTML = "";
        document.title = "";
        document.documentElement.removeAttribute("lang");
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("parses meta, og and twitter tags from the document", () => {
        document.title = "H.R. 1 | Bill Grokker";
        document.documentElement.setAttribute("lang", "fr");
        addMeta({name: "description", content: "Test bill description"});
        addMeta({name: "keywords", content: "bills, legislation , , law"});
        addMeta({name: "robots", content: "noindex"});
        addMeta({property: "og:site_name", content: "Bill Grokker"});
        addMeta({name: "og:type", content: "article"});
        addMeta({name: "og:url", content: "https://billgrokker.com/bills/1"});
        addMeta({name: "og:logo", content: "https://billgrokker.com/logo.png"});
        addMeta({name: "og:image:width", content: "1200"});
        addMeta({name: "og:image:height", content: "630"});
        addMeta({name: "twitter:card", content: "summary_large_image"});
        addMeta({name: "twitter:site", content: "@billgrokker"});

        const config = HtmlSeoConfigParser("billgrokker.com");

        expect(config.title).toBe("H.R. 1 | Bill Grokker");
        expect(config.description).toBe("Test bill description");
        expect(config.keywords).toEqual(["bills", "legislation", "law"]);
        expect(config.robots).toBe("noindex");
        expect(config.siteName).toBe("Bill Grokker");
        expect(config.locale).toBe("fr");
        expect(config.pageUrl).toBe("https://billgrokker.com/bills/1");
        expect(config.logoUrl).toBe("https://billgrokker.com/logo.png");
        expect(config.og).toEqual({type: "article", imageUrl: "https://billgrokker.com/logo.png", imageWidth: 1200, imageHeight: 630});
        expect(config.twitter).toEqual({cardType: "summary_large_image", handleId: "@billgrokker", domain: "billgrokker.com"});
    });

    it("falls back to defaults when meta tags are absent", () => {
        const config = HtmlSeoConfigParser("billgrokker.com");

        expect(config.title).toBe("");
        expect(config.description).toBe("");
        expect(config.keywords).toEqual([]);
        expect(config.robots).toBe("index, follow");
        expect(config.locale).toBe("en");
        expect(config.og.type).toBe("");
        expect(Number.isNaN(config.og.imageWidth)).toBe(true);
        expect(Number.isNaN(config.og.imageHeight)).toBe(true);
        expect(config.twitter.cardType).toBe("");
        expect(config.jsonLd).toBeUndefined();
    });

    it("collects jsonLd as a single object for one graph node", () => {
        addGraphScript("https://billgrokker.com/#graph", JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [{"@type": "WebPage", "@id": "https://billgrokker.com/#webpage"}]
        }));

        const config = HtmlSeoConfigParser("billgrokker.com");

        expect(Array.isArray(config.jsonLd)).toBe(false);
        expect(config.jsonLd).toEqual({
            id: "https://billgrokker.com/#webpage",
            data: {"@type": "WebPage", "@id": "https://billgrokker.com/#webpage"}
        });
    });

    it("collects jsonLd as an array for multiple graph nodes using the explicit dom id", () => {
        addGraphScript("custom-graph", JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
                {"@type": "WebPage", "@id": "https://billgrokker.com/#webpage"},
                {"@type": "Organization", "@id": "https://billgrokker.com/#organization"}
            ]
        }));

        const config = HtmlSeoConfigParser("billgrokker.com", "custom-graph");

        expect(Array.isArray(config.jsonLd)).toBe(true);
        const scripts = config.jsonLd as JsonLdScript[];
        expect(scripts.map(script => script.id)).toEqual([
            "https://billgrokker.com/#webpage",
            "https://billgrokker.com/#organization"
        ]);
    });

    it("filters graph nodes without a string @id", () => {
        addGraphScript("https://billgrokker.com/#graph", JSON.stringify({
            "@graph": [
                {"@type": "WebPage"},
                {"@type": "Organization", "@id": "https://billgrokker.com/#organization"}
            ]
        }));

        const config = HtmlSeoConfigParser("billgrokker.com");

        expect(config.jsonLd).toEqual({
            id: "https://billgrokker.com/#organization",
            data: {"@type": "Organization", "@id": "https://billgrokker.com/#organization"}
        });
    });

    it("returns undefined jsonLd when the graph has no nodes", () => {
        addGraphScript("https://billgrokker.com/#graph", JSON.stringify({"@graph": []}));

        const config = HtmlSeoConfigParser("billgrokker.com");

        expect(config.jsonLd).toBeUndefined();
    });

    it("returns undefined jsonLd when @graph is not an array", () => {
        addGraphScript("https://billgrokker.com/#graph", JSON.stringify({"@context": "https://schema.org"}));

        const config = HtmlSeoConfigParser("billgrokker.com");

        expect(config.jsonLd).toBeUndefined();
    });

    it("returns undefined jsonLd when the graph script has no content", () => {
        addGraphScript("https://billgrokker.com/#graph", "");

        const config = HtmlSeoConfigParser("billgrokker.com");

        expect(config.jsonLd).toBeUndefined();
    });

    it("logs and returns undefined jsonLd when the graph script is invalid JSON", () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        addGraphScript("https://billgrokker.com/#graph", "{invalid");

        const config = HtmlSeoConfigParser("billgrokker.com");

        expect(consoleError).toHaveBeenCalledWith("Failed to parse JSON-LD graph", expect.any(Error));
        expect(config.jsonLd).toBeUndefined();
    });

    it("ignores graph scripts without the ld+json type", () => {
        const script = document.createElement("script");
        script.setAttribute("data-id", "https://billgrokker.com/#graph");
        script.textContent = "";
        document.head.appendChild(script);

        const config = HtmlSeoConfigParser("billgrokker.com");

        expect(config.jsonLd).toBeUndefined();
    });
});
