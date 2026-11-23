# Baseline normalization rules

The baseline capture (`npm run capture-baseline`) must be idempotent: two
consecutive runs against the same production state produce byte-identical
fixture files. Volatile values produced from `new Date()` at runtime are
replaced with the token `{{NOW}}`. This module (`scripts/normalize.ts`) is
the single source of truth for the rules; the synthesis tests (#6) reuse it.

## Rules

### Rule 1: runtime-now ISO datetimes

Any substring matching `YYYY-MM-DDT{HH}:{MM}(:{SS})?(.fff)?(Z|±HH:MM)?`
whose date part equals the capture date is replaced with `{{NOW}}`.

Why: pages that default a date to "now" when no real date exists (the search
page's `dateModified`, bill details with missing dates) render the wall-clock
instant of the capturing browser, e.g. `2026-11-23T14:03:22.481Z`.

### Rule 2: runtime-now bare dates

Any bare `YYYY-MM-DD` string equal to the capture date is replaced with
`{{NOW}}`.

Why: some fields are rendered as date-only defaults of "now".

### Rule 3: attribute-less metas

Meta tags without attributes, e.g. `<meta charset="utf-8">`, are captured
with `name`, `property`, and `content` keys set to `null`. Extraction always
records `name`, `property`, and `content` for every meta, using `null` when
the attribute is absent.

## Known non-volatile dates

Dates that happen to equal the capture date but come from real data (e.g. a
sitemap `lastmod` of today, or a bill genuinely modified today) are
indistinguishable from runtime-now values and are also tokenized. This is the
accepted trade-off of content-based detection; the fixture's `sitemap.lastmod`
metadata keeps the original value.

## What is NOT normalized

- Everything else must be byte-stable across runs: titles, descriptions,
  canonicals, robots directives, OG/Twitter metas, all other JSON-LD fields.
- The search page keyword list ends in `", "` with no active query; if a
  future capture embeds a query term, that is a production change and goes
  through a `baseline: recapture` PR, not a normalization rule.
- Capture metadata (`capturedAt` uses date-only resolution, `sourceSha`,
  `sitemap`) is stable within a capture day and never tokenized.

## Settle-wait

Instability from timing (not content) is handled by the capture harness, not
normalization: after `networkidle`, the head is polled every 250 ms until its
fingerprint is unchanged for 5 consecutive polls (20 s cap); a route that
never settles fails the run instead of writing a fixture.
