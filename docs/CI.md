# CI / Release

Two GitHub Actions workflows:

- **ci.yml** — runs on every PR and on pushes to `main`. Bun install, then lint, typecheck, and tests. All gates must pass.
- **release.yml** — runs when a `v*` tag is pushed. Bun install, build, test, then `npm publish --provenance` (npm, not bun, so provenance attestation works). Any failure turns the tag run red; there are no silent successes.

## Human prerequisites (before the first publish, ticket #9)

1. The npm org **`expert-vision-software`** must exist on npmjs.com (the unscoped `programmatic-seo` name is already taken on the registry, hence the scope).
2. An org member must add the npm automation token as the repository secret **`NPM_TOKEN`**.

Until both are done, release runs will fail at the publish step — the workflows themselves are valid regardless.
