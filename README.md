# ILLEGANT — Shopify theme source

`theme/` mirrors the Shopify theme of the store `wzghvi-w0.myshopify.com`.

- **Live theme:** ILLEGANT — Launch pass 16 Nov (`191313772924`), published 21 November 2026.
- **The one development theme:** ILLEGANT — Development (unpublished) (`191499600252`).

- The first commit is an exact snapshot of the theme that was live on 2026-11-03 (text files only; the
  `assets/illegant-real-*.jpg` photos are not mirrored).
- `docs/` holds the audits, issue registers and launch checklists; the latest is `docs/2026-11-16-launch-pass.md`.
- `tools/preview/` renders the theme locally without Shopify; `tests/qa/` holds the browser tests that run against it.
- Rollback point for the 16 November pass: tag `rollback/2026-11-16-before-launch-pass` (commit `c604087`).

## Rule: one development theme (owner's request, 22 November 2026)
- All theme work goes into **ILLEGANT — Development (unpublished)**. Do not duplicate the live theme or create new
  themes for a task, sprint or backup: git is the history and the rollback.
- Changes are committed to git first, then uploaded to the development theme and checked by MD5.
- When the owner publishes the development theme, the previous live theme becomes unpublished: sync it from git and
  reuse it as the next development theme, renamed, instead of making a new copy.
- Old themes are deleted only by the owner (the connector cannot delete themes).
