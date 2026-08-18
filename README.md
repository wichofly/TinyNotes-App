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

2. Copy `.env.example` to `.env` and set `BETTER_AUTH_SECRET` to a random value containing at least 32 characters. For example:

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

| Command                    | Purpose                                   |
| -------------------------- | ----------------------------------------- |
| `npm run dev`              | Run API and web development servers       |
| `npm run build`            | Build both applications                   |
| `npm run typecheck`        | Run strict TypeScript checks              |
| `npm test`                 | Run unit and component tests              |
| `npm run test:integration` | Run API tests against isolated PostgreSQL |
| `npm run test:e2e`         | Run the two Chromium browser journeys     |
| `npm run lint`             | Run the repository's static checks        |
| `npm run format:check`     | Verify Prettier formatting                |
| `npm run db:migrate`       | Apply pending migrations                  |
| `npm run db:migrate:prod`  | Apply migrations from a production build  |
| `npm run smoke:prod`       | Check a running production container      |
| `npm run db:studio`        | Explain how to inspect the local database |

## Test suites

Unit and component tests do not require PostgreSQL:

```bash
npm test
```

Integration and end-to-end tests use the disposable `tinynotes_test` database on port `5433`. The test harness refuses to run against any other database name.

```bash
npm run db:test:up
npm run test:integration
npx playwright install chromium
npm run test:e2e
npm run db:test:down
```

The Playwright suite starts the API and Vite automatically, resets the test database, and runs only Chromium. It covers authentication/CRUD and anonymous public-link revocation. Cross-user ownership attacks remain in the faster API integration suite.

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

The multi-stage `Dockerfile` packages both artifacts. The Compose production profile reads
`BETTER_AUTH_SECRET` from the environment or root `.env` file and refuses to start when it is
missing or empty. To exercise the production image locally:

```bash
docker compose up -d --wait postgres
docker compose --profile production build app
docker compose --profile production run --rm app npm run db:migrate:prod
docker compose --profile production up -d --wait app
npm run smoke:prod
```

If port `5432` is already in use, set `POSTGRES_PORT` to a free host port before these Docker Compose commands. Container-to-container database traffic continues to use port `5432`.

Migration is intentionally separate from application startup so a deployment can run it before replacing the application instance. TinyNotes currently uses in-memory rate limiters and therefore supports exactly one production API instance per database. The API holds a PostgreSQL advisory lock for its lifetime and fails fast if a second instance starts. Add a shared rate-limit store before enabling multiple replicas or overlapping rolling deployments.

Supply `BETTER_AUTH_SECRET` through the deployment platform's secret manager and replace every example credential and URL in real environments. Terminate HTTPS at a trusted proxy, set `TRUST_PROXY=true` only when that proxy is correctly configured, and use the exact public origin for `BETTER_AUTH_URL`, `WEB_ORIGIN`, and `PUBLIC_APP_URL`.

The CI workflow runs formatting, linting, type checking, all three test layers, the production build, an image build, explicit migration, and container smoke checks. The repository remains provider-neutral; adapt the same image and migration command to the chosen platform.

Public-note responses and SPA routes send `X-Robots-Tag: noindex, nofollow, noarchive`. This reduces accidental indexing but does not turn public links into authenticated resources; anyone possessing an enabled link can read its note.

### Netlify web and Vercel API

This repository can deploy the Vite web application to Netlify and the Express API to Vercel.
The browser continues to use same-origin `/api/*` requests; `netlify.toml` proxies those requests to
the Vercel API.

Configure Netlify from the repository root with the committed build and redirect settings in
`netlify.toml`. Do not define `VITE_API_URL` for this topology, because authentication and API
requests must both use the Netlify origin.

Configure the Vercel project with `apps/api` as its root directory and enable Vercel system
environment variables. Vercel automatically provides `VERCEL=1`; do not add it to the local
`.env`, because local development must start a persistent listener. The API entry point uses this
system variable to export Express without starting a listener or acquiring the single-instance
PostgreSQL lock. Set these variables for the Production environment and redeploy after changing
them:

```text
NODE_ENV=production
DATABASE_URL=postgresql://<remote-user>:<remote-password>@<remote-host>/<database>?sslmode=require
BETTER_AUTH_SECRET=<new-high-entropy-secret>
BETTER_AUTH_URL=https://tinynotesapp.netlify.app
WEB_ORIGIN=https://tinynotesapp.netlify.app
PUBLIC_APP_URL=https://tinynotesapp.netlify.app
LOG_LEVEL=info
TRUST_PROXY=true
```

`DATABASE_URL` must identify a remotely reachable PostgreSQL service. A URL containing `localhost`
or a Docker service name cannot work from Vercel. Keep `DATABASE_URL` and `BETTER_AUTH_SECRET` only
in Vercel's secret manager; they are not needed by the static Netlify site.

Apply migrations once against the production database before using the deployed API. From a Vercel
CLI session linked to the API project, the production variables can be supplied without writing
them to the repository:

```bash
vercel env run -e production -- npm run db:migrate
```

After both deployments complete, verify `https://tinynotes-app-api.vercel.app/api/health` and then
`https://tinynotesapp.netlify.app/api/health`; both should return `{"status":"ok"}`.

## Design constraints

- Note ownership is checked in every private database query.
- TipTap JSON is the source of truth; arbitrary HTML is never stored or inserted.
- Public tokens contain 192 bits of randomness and are deleted on revocation.
- Production is intentionally limited to one API instance until rate limits use a shared store.
- Editing uses explicit saves and last-write-wins semantics.
- The initial list returns the 100 most recently updated notes. Pagination is intentionally deferred for this demo.
