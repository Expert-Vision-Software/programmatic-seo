# AGENTS.md

## Agent skills

### Issue tracker

Issues live in GitHub Issues for `Expert-Vision-Software/programmatic-seo`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Defaults: the five canonical role names are used as-is. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## House rules

- No code comments anywhere; express intent through self-documenting code. Compiler/linter directives are the only exception.
- Never commit to `main` directly; work on feature branches or worktrees.
- Claim tickets by self-assignment before starting work.
- Keep commits small and focused, one concern per commit.
- Use conventional-commit messages (`feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`, `build:`, `ci:`).
