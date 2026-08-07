# TinyNotes — Technical Product Specification

**Document status:** Implemented; stabilization in progress
**Application type:** Demo full-stack web application  
**Frontend:** React 19 + TypeScript + Vite  
**Backend:** Node.js + Express + TypeScript  
**Database:** PostgreSQL  
**ORM:** Drizzle ORM  
**Authentication:** Better Auth, email and password only  
**Rich-text editor:** TipTap  
**Styling:** Tailwind CSS

---

## 1. Product Summary

TinyNotes is a deliberately small note-taking application in which registered users can create and manage rich-text notes. A note may optionally be published through a hard-to-guess public URL. The owner can disable public access at any time.

Visitors do not need an account to view an enabled public note. All note creation, editing, deletion, and sharing controls require authentication and ownership of the note.

The product is intended as a demo application. The implementation should favor clarity, security, maintainability, and a restrained feature set over premature abstraction.

---

## 2. Goals

TinyNotes must allow a user to:

1. Register with an email address and password.
2. Sign in and sign out.
3. Create a rich-text note.
4. View their notes.
5. Edit a note they own.
6. Delete a note they own.
7. enable public sharing for a note.
8. Copy a public share URL.
9. Disable a public share URL.
10. Open an enabled public note without authenticating.

---

## 3. Non-Goals

The first version must not include:

- Password reset.
- Email confirmation.
- Email delivery.
- Social login.
- Multi-factor authentication.
- Real-time collaborative editing.
- Note sharing with named users or teams.
- Comments.
- Note history or version restoration.
- Attachments or image uploads.
- Offline synchronization.
- Folders, labels, tags, favorites, or full-text search.
- Administrative dashboards.
- Custom public aliases.
- Analytics or view counters.
- Server-side rendering.

These features may be considered later but must not influence the first version's architecture unnecessarily.

---

## 4. Recommended Architecture

### 4.1 Repository structure

Use a monorepo with npm workspaces or pnpm workspaces.

```text
tinynotes/
├── apps/
│   ├── web/                 # React client
│   └── api/                 # Express API
├── packages/
│   └── shared/              # Shared schemas and types
├── package.json
├── tsconfig.base.json
└── README.md
```

A monorepo is recommended because the client and API can share request/response schemas without publishing a separate package.

### 4.2 Runtime architecture

```text
Browser
  |
  | HTTPS + JSON
  v
React SPA
  |
  | /api/* and /api/auth/*
  v
Express API
  |
  | Drizzle / node-postgres
  v
PostgreSQL
```

The React application is a client-rendered SPA. Express owns authentication integration, authorization, validation, note operations, and public-note retrieval.

In production, the frontend and API should preferably appear under the same site origin, for example:

```text
https://tinynotes.example.com
https://tinynotes.example.com/api/*
```

This simplifies secure cookie-based sessions and avoids unnecessary cross-origin complexity. Separate origins are acceptable, but require explicit CORS and cookie configuration.

---

## 5. Database Decision

### 5.1 Selected database

Use **PostgreSQL** with **Drizzle ORM**.

### 5.2 Rationale

PostgreSQL is preferred over MongoDB for this application because:

- Users, authentication accounts, sessions, note ownership, and share tokens have clear relational constraints.
- Foreign keys can guarantee that every note belongs to a valid user.
- Unique constraints can guarantee that public share tokens cannot collide.
- TipTap content can be stored directly in a PostgreSQL `jsonb` column.
- The database remains suitable if the demo later adds tags, collaborators, or audit records.
- Better Auth supports PostgreSQL and also provides a Drizzle adapter.

MongoDB would work, but it offers no meaningful advantage for this data model. The fact that note content is JSON does not require a document database.

SQLite would be the simplest local-only choice, but PostgreSQL is a better team and deployment default while still remaining straightforward.

---

## 6. Technology Choices

### Frontend

- React 19.x.
- TypeScript with strict mode.
- Vite.
- React Router for client routing.
- Tailwind CSS 4.x.
- TipTap 3.x.
- TanStack Query for server-state fetching and mutations.
- React Hook Form for authentication forms.
- Zod for client-visible form constraints and shared API schemas.

### Backend

- Node.js current supported LTS release.
- Express.
- TypeScript with strict mode.
- Better Auth.
- PostgreSQL.
- Drizzle ORM and Drizzle Kit.
- Zod for request validation.
- Helmet for baseline HTTP security headers.
- A structured logger such as Pino.

### Testing

- Vitest.
- React Testing Library.
- Supertest for API integration tests.
- Playwright for critical end-to-end flows.

The team may replace minor supporting libraries, but changes to the main stack require agreement before implementation.

---

## 7. Authentication Specification

### 7.1 Supported authentication

Enable Better Auth email-and-password authentication only.

Required flows:

- Sign up with name, email, and password.
- Sign in with email and password.
- Retrieve the current session.
- Sign out.

Explicitly disabled or omitted:

- Email verification.
- Password reset.
- Social providers.
- Magic links.
- Account linking.

### 7.2 Password policy

For the demo:

- Minimum length: 8 characters.
- Maximum length: 128 characters.
- Do not implement arbitrary composition rules such as requiring symbols or uppercase characters.
- Passwords must never be logged or returned by an API.
- Password hashing must be handled by Better Auth rather than custom application code.

### 7.3 Session transport

Use Better Auth's cookie-based session mechanism.

Production cookie requirements:

- `HttpOnly`.
- `Secure`.
- Appropriate `SameSite` value for the deployment topology.
- HTTPS only.

The Express application must trust its reverse proxy only when the deployment environment requires it and is configured correctly.

### 7.4 Authorization rule

Authentication proves identity. It does not prove note ownership.

Every private note endpoint must query or mutate by both:

```text
note.id = requested note id
AND note.userId = authenticated user id
```

A client-provided `userId` must never be trusted.

---

## 8. Rich-Text Content Specification

### 8.1 Source of truth

The canonical note body is TipTap/ProseMirror JSON stored in PostgreSQL as `jsonb`.

Do not store user-produced HTML as the canonical source of truth.

Example:

```json
{
  "type": "doc",
  "content": [
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "Hello from TinyNotes"
        }
      ]
    }
  ]
}
```

### 8.2 Supported formatting

Keep the initial TipTap extension set small and identical in the editor and public renderer:

- Document.
- Paragraph.
- Text.
- Heading levels 1–3.
- Bold.
- Italic.
- Strike.
- Bullet list.
- Ordered list.
- List item.
- Blockquote.
- Code.
- Code block.
- Hard break.
- Horizontal rule.
- History/undo-redo in the editor.
- Link, with restricted protocols.

Do not initially support:

- Images.
- Embedded iframes.
- Raw HTML nodes.
- Tables.
- Custom scripts or styles.

### 8.3 Rendering

Render saved JSON using TipTap's static rendering utilities or an equivalent TipTap-supported renderer configured with the same extension schema as the editor.

Do not create public-note HTML by interpolating arbitrary user strings into `dangerouslySetInnerHTML`.

If HTML generation is used, sanitize the result with a strict allowlist before inserting it into the DOM. Links must be restricted to safe protocols such as `https`, `http`, and optionally `mailto`.

### 8.4 Content limits

Recommended demo limits:

- Title: 1–120 trimmed characters.
- Rich-text JSON payload: maximum 200 KB after JSON serialization.
- Plain-text equivalent: maximum approximately 50,000 characters.

The API must enforce the serialized payload limit. Client limits alone are insufficient.

### 8.5 Empty notes

A note must have a non-empty title. The body may be an empty TipTap document.

---

## 9. Data Model

Better Auth will create and own its required authentication tables. The application must not duplicate password or session storage.

### 9.1 `notes` table

| Column         | Type                               | Constraints             | Description                      |
| -------------- | ---------------------------------- | ----------------------- | -------------------------------- |
| `id`           | UUID                               | Primary key             | Note identifier                  |
| `user_id`      | Text or Better Auth user ID type   | Not null, foreign key   | Owner                            |
| `title`        | Varchar(120)                       | Not null                | Trimmed note title               |
| `content`      | JSONB                              | Not null                | TipTap document JSON             |
| `share_token`  | Varchar(64), nullable              | Unique                  | Opaque public identifier         |
| `is_public`    | Boolean                            | Not null, default false | Whether public access is enabled |
| `created_at`   | Timestamp with time zone           | Not null                | Creation time                    |
| `updated_at`   | Timestamp with time zone           | Not null                | Last content/title update        |
| `published_at` | Timestamp with time zone, nullable | Nullable                | Last time sharing was enabled    |

Recommended indexes:

```text
INDEX notes_user_updated_idx (user_id, updated_at DESC)
UNIQUE INDEX notes_share_token_unique (share_token) WHERE share_token IS NOT NULL
```

### 9.2 Share-token behavior

- Generate tokens on the server with a cryptographically secure random generator.
- Use at least 128 bits of entropy. A recommended representation is 24 random bytes encoded with base64url.
- Tokens must not contain the note ID, user ID, title, email, or sequential information.
- A share token must be created when public sharing is first enabled.
- Disabling sharing must set `is_public = false`.
- For stronger revocation semantics, set `share_token = null` when sharing is disabled. Re-enabling sharing then creates a new URL and permanently invalidates the old one.

This specification chooses token rotation on disable. Therefore, an old public URL must return `404` after sharing has been disabled, even if sharing is later enabled again.

### 9.3 Timestamps

Store timestamps in UTC. Convert them for display in the browser.

`updated_at` changes only when title or content changes. Toggling sharing should not falsely indicate that note content was edited, unless the team intentionally adds a separate metadata timestamp.

---

## 10. API Design

Base path:

```text
/api
```

Better Auth routes:

```text
/api/auth/*
```

All request and response bodies use JSON unless the Better Auth handler specifies otherwise.

### 10.1 Standard error shape

Application endpoints must return errors in this form:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request could not be processed.",
    "fields": {
      "title": "Title is required."
    }
  }
}
```

`fields` is optional.

Do not expose stack traces, SQL errors, internal file paths, or secret values.

### 10.2 Health endpoint

#### `GET /api/health`

Response `200`:

```json
{
  "status": "ok"
}
```

A deeper database readiness check may be exposed separately for infrastructure, but should not reveal internal details publicly.

### 10.3 List notes

#### `GET /api/notes`

Authentication: required.

Initial version behavior:

- Return notes owned by the current user.
- Sort by `updatedAt` descending.
- Return lightweight list data, not necessarily the full TipTap body.

Response `200`:

```json
{
  "notes": [
    {
      "id": "uuid",
      "title": "Project ideas",
      "isPublic": false,
      "createdAt": "2026-08-06T18:00:00.000Z",
      "updatedAt": "2026-08-06T18:15:00.000Z"
    }
  ]
}
```

For a small demo, pagination may be omitted. The implementation should nevertheless use an explicit maximum, such as 100 notes, or implement cursor pagination if desired.

### 10.4 Create note

#### `POST /api/notes`

Authentication: required.

Request:

```json
{
  "title": "Project ideas",
  "content": {
    "type": "doc",
    "content": []
  }
}
```

Response `201`:

```json
{
  "note": {
    "id": "uuid",
    "title": "Project ideas",
    "content": {
      "type": "doc",
      "content": []
    },
    "isPublic": false,
    "shareUrl": null,
    "createdAt": "2026-08-06T18:00:00.000Z",
    "updatedAt": "2026-08-06T18:00:00.000Z"
  }
}
```

### 10.5 Get owned note

#### `GET /api/notes/:noteId`

Authentication: required.

Response `200`: full owned-note representation.

Response `404`: note does not exist or is not owned by the current user.

Return `404`, not `403`, to avoid leaking another user's note existence.

### 10.6 Update note

#### `PATCH /api/notes/:noteId`

Authentication: required.

Request may contain one or both fields:

```json
{
  "title": "Updated title",
  "content": {
    "type": "doc",
    "content": []
  }
}
```

Response `200`: updated full owned-note representation.

Reject requests containing neither field.

The API must not allow updates to `userId`, `shareToken`, timestamps, or visibility through this endpoint.

### 10.7 Delete note

#### `DELETE /api/notes/:noteId`

Authentication: required.

Response `204`: deletion succeeded.

Response `404`: note does not exist or is not owned by the current user.

Deletion permanently invalidates any public link.

### 10.8 Enable public sharing

#### `POST /api/notes/:noteId/share`

Authentication: required.

Behavior:

- Verify ownership.
- If the note is private, generate a new share token and set `isPublic = true`.
- If already public, keep the existing active token and return the current URL. The endpoint is idempotent from the user's perspective.

Response `200`:

```json
{
  "share": {
    "isPublic": true,
    "shareUrl": "https://tinynotes.example.com/s/opaque-token"
  }
}
```

The base URL must come from trusted server configuration, not from an unvalidated request host header.

### 10.9 Disable public sharing

#### `DELETE /api/notes/:noteId/share`

Authentication: required.

Behavior:

- Verify ownership.
- Set `isPublic = false`.
- Set `shareToken = null`.
- Set `publishedAt = null` or retain it according to the chosen audit semantics. For this demo, set it to `null`.

Response `200`:

```json
{
  "share": {
    "isPublic": false,
    "shareUrl": null
  }
}
```

The endpoint should be idempotent.

### 10.10 View public note

#### `GET /api/public/notes/:shareToken`

Authentication: not required.

Query condition:

```text
share_token = supplied token
AND is_public = true
```

Response `200`:

```json
{
  "note": {
    "title": "Project ideas",
    "content": {
      "type": "doc",
      "content": []
    },
    "publishedAt": "2026-08-06T18:30:00.000Z",
    "updatedAt": "2026-08-06T18:15:00.000Z"
  }
}
```

The public response must not include:

- Owner email.
- Owner user ID.
- Internal note ID.
- Authentication account data.
- Share-management metadata beyond what is necessary.

Response `404` for invalid, disabled, deleted, or unknown tokens.

---

## 11. Frontend Routes

| Route            | Access              | Purpose                                                           |
| ---------------- | ------------------- | ----------------------------------------------------------------- |
| `/`              | Public              | Landing page; redirect authenticated users to `/notes` if desired |
| `/sign-up`       | Public-only         | Registration form                                                 |
| `/sign-in`       | Public-only         | Login form                                                        |
| `/notes`         | Authenticated       | Current user's note list                                          |
| `/notes/new`     | Authenticated       | Create a note                                                     |
| `/notes/:noteId` | Authenticated owner | View/edit a note                                                  |
| `/s/:shareToken` | Public              | Read-only public note                                             |
| `*`              | Public              | Not-found page                                                    |

Public-only routes should redirect an already authenticated user to `/notes`.

Authenticated routes must handle the session-loading state before deciding to redirect.

---

## 12. User Interface Requirements

### 12.1 General

- Responsive from mobile to desktop.
- Keyboard accessible.
- Clear focus styles.
- Semantic HTML.
- No essential action should depend only on color.
- Loading, empty, error, and success states must be represented.

### 12.2 Notes list

Display:

- Note title.
- Last updated date.
- Public/private status.
- Link to open the note.
- Create-note action.

Empty state:

```text
You do not have any notes yet.
```

Provide a clear create-first-note action.

### 12.3 Editor page

Include:

- Editable title.
- TipTap toolbar.
- Rich-text editor.
- Save status.
- Share control.
- Delete action.
- Back-to-notes navigation.

Recommended save behavior for the demo:

- Explicit **Save** button.
- Disable Save while a request is in progress.
- Warn before navigating away when local changes are unsaved.

Autosave is out of scope because it introduces debounce, conflict, retry, and save-status complexity.

### 12.4 Delete confirmation

Deleting a note requires a confirmation dialog containing the note title and a clear warning that deletion cannot be undone.

### 12.5 Sharing controls

Private note state:

- Button: **Enable public link**.

Public note state:

- Read-only share URL.
- **Copy link** button.
- **Disable public link** button.
- Text explaining that disabling the link immediately invalidates it.

The UI should not optimistically display a newly enabled share URL before the server confirms it.

### 12.6 Public-note page

Display only:

- TinyNotes branding.
- Note title.
- Rendered read-only content.
- Optional updated date.

Do not show edit, delete, or owner controls.

For an invalid or revoked link, show a generic not-found message. Do not indicate whether the note previously existed.

---

## 13. Client State and Data Fetching

Use TanStack Query for remote state.

Recommended query keys:

```ts
['session']['notes'][('notes', noteId)][('public-note', shareToken)];
```

After mutations:

- Creating a note invalidates `['notes']`.
- Updating a note updates or invalidates `['notes', noteId]` and `['notes']`.
- Deleting a note removes its detail cache and invalidates `['notes']`.
- Enabling/disabling sharing updates the note detail and list metadata.

Do not put the full note collection into a separate global state library unless a demonstrated need appears.

Editor state remains local to the editor component until saved.

---

## 14. Shared Validation and Types

Place transport schemas in `packages/shared`.

Suggested modules:

```text
packages/shared/src/
├── auth.ts
├── notes.ts
├── api-errors.ts
└── index.ts
```

Examples:

- `createNoteSchema`.
- `updateNoteSchema`.
- `noteIdSchema`.
- `shareTokenSchema`.
- `noteResponseSchema`.

Derive TypeScript types from Zod schemas where practical.

Database models must not be returned directly from controllers. Map them to explicit response DTOs so internal columns are not exposed accidentally.

---

## 15. Backend Module Structure

Recommended API layout:

```text
apps/api/src/
├── app.ts
├── server.ts
├── config/
│   └── env.ts
├── auth/
│   ├── auth.ts
│   └── middleware.ts
├── db/
│   ├── client.ts
│   ├── schema/
│   │   ├── auth.ts
│   │   └── notes.ts
│   └── migrations/
├── modules/
│   └── notes/
│       ├── notes.routes.ts
│       ├── notes.controller.ts
│       ├── notes.service.ts
│       ├── notes.repository.ts
│       └── notes.mapper.ts
├── middleware/
│   ├── error-handler.ts
│   ├── not-found.ts
│   └── rate-limit.ts
├── lib/
│   ├── logger.ts
│   └── share-token.ts
└── types/
```

Keep route handlers thin. Business rules belong in the service layer; database access belongs in the repository layer. For a demo, these layers should remain small rather than becoming generic frameworks.

---

## 16. Security Requirements

### 16.1 Mandatory protections

- Use HTTPS in production.
- Keep all secrets in environment variables.
- Never commit `.env` files containing secrets.
- Validate all request parameters and bodies on the server.
- Verify note ownership on every private note operation.
- Use parameterized queries through Drizzle.
- Use opaque, cryptographically random share tokens.
- Configure Helmet.
- Configure request body limits.
- Do not enable permissive CORS.
- Do not log passwords, cookies, authorization headers, full note content, or session tokens.
- Return generic authentication errors so sign-in does not unnecessarily disclose whether an email exists.
- Render only the approved TipTap schema.
- Reject unsafe link protocols.

### 16.2 Rate limiting

Apply stricter limits to:

- Sign-up.
- Sign-in.
- Public share-token requests.

A simple in-memory limiter is acceptable only for local development or a single demo instance. A multi-instance deployment needs a shared limiter store such as Redis. Redis is not otherwise required for this version.

### 16.3 CSRF and CORS

Follow Better Auth's documented origin and cookie protections. Maintain an explicit trusted-origin list.

When the frontend and backend are on different origins:

- Configure exact allowed origins.
- Enable credentials only for those origins.
- Never use `Access-Control-Allow-Origin: *` together with credentials.

### 16.4 Public-link privacy model

A public link is effectively a bearer secret: anyone possessing it can read the note while it remains enabled.

The UI must state this clearly. Public links must not be indexed intentionally; the public page should include an appropriate `noindex` directive. This reduces accidental discovery but is not an access-control mechanism.

---

## 17. Environment Configuration

Example variables:

```dotenv
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/tinynotes
BETTER_AUTH_SECRET=replace-with-a-long-random-secret
BETTER_AUTH_URL=http://localhost:3000
WEB_ORIGIN=http://localhost:5173
PUBLIC_APP_URL=http://localhost:5173
LOG_LEVEL=info
```

Requirements:

- Validate environment variables at startup.
- Fail fast when a required value is absent or invalid.
- Use separate values for local, test, staging, and production environments.
- Never derive public share URLs from an untrusted incoming host header.

---

## 18. Error and Loading Behavior

The frontend must handle:

- No network connection.
- Expired session.
- Unauthorized response.
- Note not found.
- Revoked public link.
- Validation errors.
- Unexpected server errors.
- Failed copy-to-clipboard operation.

An expired session on a private route should clear stale client session state and redirect to sign-in, preserving a safe return location when practical.

Do not erase unsaved editor content merely because a save request fails.

---

## 19. Accessibility Requirements

Minimum acceptance level:

- Every form control has an accessible label.
- Validation errors are associated with the relevant fields.
- Dialog focus is trapped and restored correctly.
- Toolbar buttons expose accessible names and pressed states.
- Editor can be reached and used with a keyboard.
- Public rendered content maintains correct heading and list semantics.
- Status messages such as “Saved” are announced appropriately without being disruptive.
- Color contrast follows WCAG AA expectations.

---

## 20. Testing Strategy

### 20.1 Unit tests

Cover:

- Request schemas.
- Share-token generation shape.
- DTO mappers.
- Rich-text document validation helpers.
- Utility functions.

### 20.2 API integration tests

Use a dedicated test PostgreSQL database.

Required cases:

1. Unauthenticated users cannot access private note endpoints.
2. A user can create and retrieve their note.
3. A user cannot retrieve another user's private note.
4. A user cannot update another user's note.
5. A user cannot delete another user's note.
6. Sharing creates an opaque public URL.
7. An enabled public note is available without authentication.
8. Disabling sharing makes the old token return `404`.
9. Re-enabling sharing creates a different token.
10. Deleting a note invalidates its public link.
11. Invalid TipTap content is rejected.
12. Oversized content is rejected.

### 20.3 Frontend component tests

Cover:

- Authentication form validation.
- Notes empty state.
- Editor save state.
- Sharing controls.
- Delete confirmation.
- Public-note error state.

### 20.4 End-to-end tests

Critical Playwright scenarios:

#### Scenario A — Authentication and CRUD

1. Register.
2. Create a note.
3. Edit and save it.
4. Return to the list.
5. Reopen it and verify persisted content.
6. Delete it.

#### Scenario B — Public sharing

1. Sign in.
2. Create a note.
3. Enable sharing.
4. Open the URL in an anonymous browser context.
5. Verify content is visible.
6. Disable sharing.
7. Verify the previous anonymous URL now shows not found.

#### Scenario C — Ownership protection

1. Create users A and B.
2. User A creates a note.
3. User B attempts to access, update, and delete A's note through direct API requests.
4. Each operation returns `404` and the note remains unchanged.

---

## 21. Definition of Done

A feature is complete only when:

- It meets the relevant acceptance criteria.
- Server-side validation is present.
- Authorization is enforced server-side.
- Loading and error states are implemented.
- Relevant automated tests pass.
- TypeScript passes with no errors.
- Linting and formatting pass.
- Database migrations are committed.
- No secrets or sensitive data appear in logs or source control.
- The README documents local setup and required environment variables.

---

## 22. Product Acceptance Criteria

### Authentication

- A visitor can register with a valid name, unique email, and password.
- A registered user can sign in and remains signed in across page refreshes according to session configuration.
- A signed-in user can sign out.
- Invalid credentials do not create a session.
- No password reset or email-verification interface is exposed.

### Note management

- A signed-in user can create a note with a title and valid TipTap JSON body.
- Notes persist after refresh and reauthentication.
- A user sees only their own notes in the private list.
- A user can edit only their own notes.
- A user can delete only their own notes.
- Unauthorized direct API manipulation is rejected.

### Public sharing

- A private note cannot be opened through a public endpoint.
- Enabling sharing creates a working, opaque public URL.
- An unauthenticated visitor can view the note through that URL.
- Public visitors receive read-only content and no owner-sensitive fields.
- Disabling sharing invalidates the active URL immediately.
- Re-enabling sharing creates a new URL.
- Deleting the note invalidates its public URL.

### Rich text

- Supported formatting survives save and reload.
- The editor and public renderer interpret the same supported schema.
- Unsupported or malformed JSON is rejected.
- Unsafe executable markup cannot be stored or rendered.

---

## 23. Suggested Implementation Sequence

1. Initialize monorepo, TypeScript, linting, formatting, and environment validation.
2. Configure PostgreSQL, Drizzle, migrations, and Better Auth schema.
3. Integrate Better Auth with Express and build sign-up/sign-in UI.
4. Implement note database schema and ownership-protected CRUD API.
5. Build notes list and basic title/body editing.
6. Add TipTap formatting and JSON validation.
7. Implement share-token generation, public API, and public page.
8. Add security middleware, rate limits, body limits, and safe error handling.
9. Add integration and end-to-end tests.
10. Complete deployment configuration and documentation.

---

## 24. Open Implementation Decisions

These do not block development and can be decided by the team:

- Exact visual design and color palette.
- Whether the note list shows a plain-text preview.
- Whether successful note creation navigates immediately to the editor.
- Whether the title saves with the body or through the same explicit Save action.
- Exact deployment provider.
- Whether local development uses Docker Compose or an installed PostgreSQL instance.

The following decisions are fixed by this specification unless explicitly revised:

- React SPA plus Express API.
- PostgreSQL and Drizzle ORM.
- Better Auth email/password only.
- TipTap JSON as canonical note content.
- Explicit Save rather than autosave.
- Opaque public tokens.
- Disabling sharing revokes and deletes the current token.
- Public viewers do not require authentication.

---

## 25. Technical References

- Better Auth database concepts: https://www.better-auth.com/docs/concepts/database
- Better Auth PostgreSQL adapter: https://www.better-auth.com/docs/adapters/postgresql
- Better Auth Drizzle adapter: https://www.better-auth.com/docs/adapters/drizzle
- Better Auth configuration options: https://www.better-auth.com/docs/reference/options
- TipTap persistence: https://tiptap.dev/docs/editor/core-concepts/persistence
- TipTap JSON and HTML output: https://tiptap.dev/docs/guides/output-json-html
- TipTap static renderer: https://tiptap.dev/docs/editor/api/utilities/static-renderer
- TipTap React integration: https://tiptap.dev/docs/editor/getting-started/install/react
- React versions: https://react.dev/versions
- Tailwind CSS Vite integration: https://tailwindcss.com/docs/installation
