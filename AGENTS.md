# Repository Guidelines

## Project Structure & Module Organization

TinyNotes is an npm-workspaces TypeScript monorepo. `apps/web` contains the React 19/Vite client; keep route-level UI in `src/pages`, reusable UI in `src/components`, and browser integrations in `src/lib`. `apps/api` contains the Express API. Feature code lives under `src/modules`, while authentication, middleware, configuration, and database code have dedicated directories. `packages/shared/src` holds Zod schemas and types shared across client and server. Tests are colocated with implementation as `*.test.ts` or `*.test.tsx`. Database migrations belong in `apps/api/src/db/migrations` and should be committed. See `SPEC.md` for product behavior and `README.md` for setup details.

## Build, Test, and Development Commands

- `npm install`: install all workspace dependencies (Node.js 22.22+ and npm 11+).
- `docker compose up -d postgres`: start the local PostgreSQL service.
- `npm run db:migrate`: apply committed database migrations.
- `npm run dev`: run the API on port 3000 and Vite on port 5173.
- `npm run build`: build every applicable workspace into its `dist` directory.
- `npm test`: run all Vitest unit and component tests once.
- `npm run typecheck`: run strict TypeScript checks across workspaces.
- `npm run lint`: run ESLint with zero warnings allowed.
- `npm run format:check`: verify Prettier formatting; use `npm run format` to fix it.

## Coding Style & Naming Conventions

Use TypeScript ES modules and follow the existing two-space indentation. Prettier enforces semicolons, single quotes, trailing commas, and a 100-character line width. React components and pages use PascalCase filenames (`EditorForm.tsx`); utilities, middleware, and module layers use kebab-case or descriptive suffixes (`error-handler.ts`, `notes.repository.ts`). Use camelCase for functions and variables. Keep shared API contracts in `@tinynotes/shared`, not duplicated between apps.

## Testing Guidelines

Use Vitest; web component tests use Testing Library and the setup in `apps/web/src/test/setup.ts`. Name tests `*.test.ts(x)` beside the code they cover. Add tests for validation boundaries, authorization-sensitive behavior, and user-visible state changes. No numeric coverage threshold is configured, but every behavior change should include focused regression coverage. Run `npm test`, `npm run typecheck`, and `npm run lint` before submitting.

## Commit & Pull Request Guidelines

History currently follows Conventional Commit syntax, for example `feat: initialize monorepo...`. Use an imperative, scoped summary such as `fix: reject unsafe public-note links`. Keep commits focused. Pull requests should explain the change and verification performed, link relevant issues, call out migrations or environment changes, and include screenshots for visible UI updates. Never commit `.env` or secrets; update `.env.example` when configuration requirements change.
