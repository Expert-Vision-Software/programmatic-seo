import type {JsonLdObject} from "schema-dts";

function getMetaContent(name: string): string {
    let element = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;

    if (!element) {
        element = document.querySelector(`meta[property="${name}"]`) as HTMLMetaElement | null;
    }

    return element?.content || '';
}

function getKeywords(): string[] {
    const keywordsMeta = document.querySelector('meta[name="keywords"]') as HTMLMetaElement | null;
    if (!keywordsMeta?.content) return [];

    return keywordsMeta.content
        .split(',')
        .map(k => k.trim())
        .filter(Boolean);
}

export type GraphDocument = {
    "@context": string | string[] | Record<string, unknown>;
    "@graph": JsonLdObject[];
};

function getGraphNodes(selectorParam: string | HTMLScriptElement): JsonLdObject[] | null {
    const script = typeof selectorParam === 'string'
        ? document.querySelector(`script[data-id="${selectorParam}"]`) as HTMLScriptElement | null
        : selectorParam;

    if (!script?.textContent) return null;

    try {
        const doc = JSON.parse(script.textContent) as GraphDocument;
        return Array.isArray(doc["@graph"]) ? doc["@graph"] : null;
    } catch (e) {
        console.error('Failed to parse JSON-LD graph', e);
        return null;
    }
}

export type JsonLdScript = {
    id: string;
    data: JsonLdObject;
}

export type SeoConfig = {
    title: string;
    description: string;
    keywords: string[];
    siteName: string;
    locale: string;
    robots: string;
    pageUrl: string;
    logoUrl: string;
    og: { type: string; imageUrl: string; imageWidth: number; imageHeight: number };
    twitter: { cardType: "summary" | "summary_large_image" | "app" | "player"; handleId: string; domain: string };
    jsonLd?: JsonLdScript[] | JsonLdScript | undefined;
};

export function HtmlSeoConfigParser(rootDomain: string, graphScriptDomId?: string): SeoConfig {

    const pageTitle = document.title || '';

    const description = getMetaContent('description');
    const keywords = getKeywords();
    const robots = getMetaContent('robots') || 'index, follow';

    const ogSiteName = getMetaContent('og:site_name');
    const ogType = getMetaContent('og:type');
    const ogUrl = getMetaContent('og:url');
    const ogLocale = document.documentElement.lang || "en";
    const ogLogo = getMetaContent('og:logo');
    const ogImageWidth = parseInt(getMetaContent('og:image:width'));
    const ogImageHeight = parseInt(getMetaContent('og:image:height'));

    const twitterCardType = getMetaContent('twitter:card') as 'summary' | 'summary_large_image' | 'app' | 'player';
    const twitterHandleId = getMetaContent('twitter:site');
    const twitterDomain = rootDomain;

    let jsonLd: JsonLdScript[] | JsonLdScript | null = null;
    const graphScriptId = graphScriptDomId ?? `https://${rootDomain}/#graph`;
    const graphScript = document.querySelector(`script[data-id="${graphScriptId}"][type="application/ld+json"]`) as HTMLScriptElement | null;
    if (graphScript) {
        const nodes = getGraphNodes(graphScript);
        if (nodes && nodes.length > 0) {
            const items: JsonLdScript[] = nodes
                .filter(node => typeof node?.["@id"] === 'string')
                .map(node => ({id: node["@id"] as string, data: node}));
            if (items.length === 1) {
                jsonLd = items[0] ?? null;
            } else if (items.length > 1) {
                jsonLd = items;
            }
        }
    }

    return {
        title: pageTitle,
        description: description,
        keywords: keywords,
        siteName: ogSiteName,
        locale: ogLocale,
        robots: robots,
        pageUrl: ogUrl,
        logoUrl: ogLogo,

        og: {
            type: ogType,
            imageUrl: ogLogo,
            imageWidth: ogImageWidth,
            imageHeight: ogImageHeight
        },

        twitter: {
            cardType: twitterCardType,
            handleId: twitterHandleId,
            domain: twitterDomain
        },

        jsonLd: jsonLd ?? undefined
    };
}
