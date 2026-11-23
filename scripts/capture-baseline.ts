import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Page } from "playwright";
import { fingerprint, normalizeHead, type RawHead } from "./normalize";

const ORIGIN = "https://billgrokker.com";

interface RouteSpec {
  route: string;
  slug: string;
  bill?: boolean;
}

const ROUTES: RouteSpec[] = [
  { route: "/", slug: "home" },
  { route: "/bills/search", slug: "bills-search" },
  { route: "/faq", slug: "faq" },
  { route: "/faq/companion-bills", slug: "faq-companion-bills" },
  { route: "/bills/119/hr/1", slug: "bill-119-hr-1", bill: true },
  { route: "/bills/119/s/5653", slug: "bill-119-s-5653", bill: true },
  { route: "/not-found", slug: "not-found" },
  { route: "/account/login", slug: "account-login" },
  { route: "/account/signup", slug: "account-signup" },
];

const SETTLE_POLLS = 5;
const SETTLE_INTERVAL_MS = 250;
const SETTLE_TIMEOUT_MS = 20000;

async function readHead(page: Page): Promise<RawHead> {
  return page.evaluate(() => {
    const metaNodes = Array.from(document.head.querySelectorAll("meta"));
    return {
      title: document.title,
      metas: metaNodes.map((m) => ({
        name: m.getAttribute("name"),
        property: m.getAttribute("property"),
        content: m.getAttribute("content"),
      })),
      canonical: document.head.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? null,
      jsonLd: Array.from(document.head.querySelectorAll('script[type="application/ld+json"]')).map((s) => JSON.parse(s.textContent ?? "null")),
    };
  });
}

async function captureRoute(browser: Awaited<ReturnType<typeof chromium.launch>>, spec: RouteSpec, today: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const response = await page.goto(ORIGIN + spec.route, { waitUntil: "networkidle", timeout: 60000 });
  if (!response) throw new Error(`${spec.route}: navigation failed (no response)`);

  const start = Date.now();
  let stableCount = 0;
  let head = await readHead(page);
  let mark = fingerprint(head);
  while (stableCount < SETTLE_POLLS) {
    await page.waitForTimeout(SETTLE_INTERVAL_MS);
    const next = await readHead(page);
    const nextMark = fingerprint(next);
    if (nextMark === mark) {
      stableCount += 1;
    } else {
      stableCount = 0;
      head = next;
      mark = nextMark;
    }
    if (Date.now() - start > SETTLE_TIMEOUT_MS) {
      throw new Error(`${spec.route}: head did not settle within ${SETTLE_TIMEOUT_MS}ms`);
    }
  }

  const normalized = normalizeHead(head, today);
  return {
    route: spec.route,
    capturedAt: today,
    sourceSha: sourceSha(),
    sitemap: sitemapIndex[spec.route] ?? null,
    httpStatus: response.status(),
    head: normalized,
    bill: spec.bill ? extractBill(normalized.jsonLd, spec.route) : null,
  };
}

interface BillContent {
  title: string;
  dates: { datePublished: string; dateModified: string };
  policyArea: string;
  breadcrumbs: string[];
}

function extractBill(jsonLd: Array<unknown>, route: string): BillContent {
  const nodes = extractPageNodes(jsonLd);
  const article = nodes.find((n) => Array.isArray(n["@type"]) ? n["@type"].includes("Article") : n["@type"] === "Article");
  const breadcrumb = nodes.find((n) => n["@type"] === "BreadcrumbList");
  if (!article || !breadcrumb) throw new Error(`${route}: article or breadcrumb JSON-LD node missing`);
  const items = (breadcrumb["itemListElement"] as Array<{ item: { name?: string } }>).map((i) => i.item?.name ?? "");
  return {
    title: String(article["name"]),
    dates: {
      datePublished: String(article["datePublished"]),
      dateModified: String(article["dateModified"]),
    },
    policyArea: String(article["articleSection"] ?? (article["about"] as { name?: string } | undefined)?.name ?? ""),
    breadcrumbs: items,
  };
}

const SITE_WIDE_ID_SUFFIXES = ["#logo", "#organization", "#webapplication"];

interface GraphNode {
  "@id"?: string;
  "@type"?: string | string[];
  [key: string]: unknown;
}

function extractPageNodes(jsonLd: Array<unknown>): Array<GraphNode> {
  const out: Array<GraphNode> = [];
  for (const block of jsonLd) {
    const graph = (block as { "@graph"?: Array<GraphNode> })["@graph"];
    if (!graph) continue;
    for (const node of graph) {
      const id = node["@id"];
      if (id && SITE_WIDE_ID_SUFFIXES.some((s) => String(id).endsWith(s))) continue;
      out.push(node);
    }
  }
  return out;
}

function sourceSha(): string {
  return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
}

interface SitemapEntry {
  lastmod: string;
  changefreq: string;
  priority: string;
}

const sitemapIndex: Record<string, SitemapEntry> = {};

async function loadSitemap(): Promise<void> {
  const res = await fetch(ORIGIN + "/sitemap.xml");
  if (!res.ok) throw new Error(`sitemap fetch failed: ${res.status}`);
  const xml = await res.text();
  const urlRe = /<url>([\s\S]*?)<\/url>/g;
  const tag = (name: string, block: string): string =>
    block.match(new RegExp(`<${name}>\\s*([\\s\\S]*?)\\s*</${name}>`))?.[1]?.trim() ?? "";
  for (const match of xml.matchAll(urlRe)) {
    const loc = tag("loc", match[1]);
    const path = new URL(loc).pathname;
    sitemapIndex[path] = {
      lastmod: tag("lastmod", match[1]),
      changefreq: tag("changefreq", match[1]),
      priority: tag("priority", match[1]),
    };
  }
}

async function main(): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  await loadSitemap();
  const browser = await chromium.launch();
  const outDir = join(process.cwd(), "fixtures", "baseline");
  mkdirSync(outDir, { recursive: true });
  for (const spec of ROUTES) {
    const record = await captureRoute(browser, spec, today);
    const file = join(outDir, `${spec.slug}.json`);
    writeFileSync(file, JSON.stringify(record, null, 2) + "\n", "utf8");
    console.log(`captured ${spec.route} -> fixtures/baseline/${spec.slug}.json`);
  }
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
