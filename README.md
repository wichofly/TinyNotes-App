# TinyNotes

TinyNotes is a deliberately small full-stack note-taking application. Users can write rich-text notes, keep them private, or publish one through a revocable, opaque URL.

## Stack

- React 19, TypeScript, Vite, Tailwind CSS 4, TipTap 3
- Express 5, Better Auth, Drizzle ORM
- PostgreSQL
- TanStack Query, React Hook Form, Zod
- Vitest and Testing Library

## Requirements

- Node.js 22.22 or newer
- npm 11 or newer
- PostgreSQL 15 or newer, or Docker

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and replace `BETTER_AUTH_SECRET` with a random value containing at least 32 characters. For example:

   ```bash
   openssl rand -base64 32
   ```

3. Start PostgreSQL:

   ```bash
   docker compose up -d postgres
   ```

4. Apply the committed database migration:

   ```bash
   npm run db:migrate
   ```

5. Start the API and web client:

   ```bash
   npm run dev
   ```

Open `http://localhost:5173`. Vite proxies `/api` to the Express server at `http://localhost:3000`.

## Commands

| Command                | Purpose                                   |
| ---------------------- | ----------------------------------------- |
| `npm run dev`          | Run API and web development servers       |
| `npm run build`        | Build both applications                   |
| `npm run typecheck`    | Run strict TypeScript checks              |
| `npm test`             | Run unit and component tests              |
| `npm run lint`         | Run the repository's static checks        |
| `npm run format:check` | Verify Prettier formatting                |
| `npm run db:migrate`   | Apply pending migrations                  |
| `npm run db:studio`    | Explain how to inspect the local database |

## Environment variables

| Variable             | Description                                          |
| -------------------- | ---------------------------------------------------- |
| `NODE_ENV`           | `development`, `test`, or `production`               |
| `PORT`               | Express port; defaults to `3000`                     |
| `DATABASE_URL`       | PostgreSQL connection URL                            |
| `BETTER_AUTH_SECRET` | High-entropy secret of at least 32 characters        |
| `BETTER_AUTH_URL`    | Trusted public URL of the authentication server      |
| `WEB_ORIGIN`         | Exact allowed browser origin                         |
| `PUBLIC_APP_URL`     | Trusted base URL used to construct share links       |
| `LOG_LEVEL`          | Pino logging level                                   |
| `TRUST_PROXY`        | Set to `true` only behind a configured reverse proxy |

The API validates these values and fails immediately when required configuration is invalid.

Database migrations are committed SQL managed by Drizzle ORM's migrator. Add reviewed SQL migrations under `apps/api/src/db/migrations` when the schema changes.

## Production

`npm run build` creates the API bundle in `apps/api/dist` and the SPA in `apps/web/dist`. When `NODE_ENV=production`, Express serves the compiled SPA and API from one origin. Use HTTPS, keep `TRUST_PROXY` disabled unless the deployment has a trusted reverse proxy, and run migrations before starting the new release.

Public-note responses and SPA routes send `X-Robots-Tag: noindex, nofollow, noarchive`. This reduces accidental indexing but does not turn public links into authenticated resources; anyone possessing an enabled link can read its note.

## Design constraints

- Note ownership is checked in every private database query.
- TipTap JSON is the source of truth; arbitrary HTML is never stored or inserted.
- Public tokens contain 192 bits of randomness and are deleted on revocation.
- Editing uses explicit saves and last-write-wins semantics.
- The initial list returns the 100 most recently updated notes. Pagination is intentionally deferred for this demo.
