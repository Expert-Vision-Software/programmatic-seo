export const NOW_TOKEN = "{{NOW}}";

export interface RawHead {
  title: string;
  metas: Array<{ name: string | null; property: string | null; content: string | null }>;
  canonical: string | null;
  jsonLd: Array<unknown>;
}

const isoDateTimeRe = (day: string): RegExp =>
  new RegExp(`${day}T\\d{2}:\\d{2}(:\\d{2})?(\\.\\d+)?(Z|[+-]\\d{2}:\\d{2})?`, "g");

const isoDateRe = (day: string): RegExp =>
  new RegExp(`(?<![\\d-])${day}(?![\\d-])`, "g");

export function normalizeString(value: string, today: string): string {
  return value.replace(isoDateTimeRe(today), NOW_TOKEN).replace(isoDateRe(today), NOW_TOKEN);
}

export function normalizeDeep(value: unknown, today: string): unknown {
  if (typeof value === "string") return normalizeString(value, today);
  if (Array.isArray(value)) return value.map((item) => normalizeDeep(item, today));
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      out[key] = normalizeDeep(entry, today);
    }
    return out;
  }
  return value;
}

export function normalizeHead(head: RawHead, today: string): RawHead {
  return {
    title: normalizeString(head.title, today),
    metas: head.metas.map((meta) => ({
      name: meta.name,
      property: meta.property,
      content: meta.content === null ? null : normalizeString(meta.content, today),
    })),
    canonical: head.canonical === null ? null : normalizeString(head.canonical, today),
    jsonLd: head.jsonLd.map((block) => normalizeDeep(block, today)),
  };
}

export function fingerprint(value: unknown): string {
  return JSON.stringify(value);
}
