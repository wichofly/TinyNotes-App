# TinyNotes Roadmap

`SPEC.md` is the stable product contract. This roadmap tracks engineering work without expanding the v1 feature set.

## Stabilization

- Keep unit and component tests reliable on Windows and CI.
- Prove authentication, ownership, validation, and public-link rotation against an isolated PostgreSQL database.
- Cover authentication/CRUD and public-link revocation in Chromium.

## Deployment Readiness

- Produce one image that serves the API and compiled SPA from the same origin.
- Keep migrations as an explicit pre-start release step.
- Validate `/api/health`, SPA fallback behavior, security headers, and required environment variables.

## Deferred

Autosave, search, pagination, tags, collaboration, Redis, analytics, and provider-specific deployment remain out of scope. Revisit them only after the current verification and packaging gates remain green.
