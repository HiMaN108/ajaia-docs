# Architecture note

## What I prioritized, and why

The brief rewards **depth in a few areas over shallow coverage**, so I picked one complete journey and made it solid:

> log in → create or import → edit rich text (autosaved) → share as Viewer/Editor → collaborator sees it correctly → reload and everything is still there.

Priorities, in order:
1. **Correct access control.** Sharing is the feature most likely to be "demo-only" in a prototype, and also the one where bugs matter most. All rules live in one small module, are enforced on the server on every request, and are covered by a table-driven test plus an integration flow.
2. **Lossless persistence of formatting.** I store the editor's own JSON document model and validate it against the editor schema on the server, rather than storing HTML.
3. **An editing experience that feels trustworthy.** Debounced autosave with a visible status, no overlapping saves, retry on failure, and an unsaved-changes guard. A toolbar that reflects the current selection.
4. **Product-relevant upload:** import `.txt` / `.md` / `.docx` as a new editable doc, keeping structure.
5. **Reviewer experience:** zero-config local run, one-click demo accounts, a seeded shared doc, and a browser test that proves the main flow.

## Deliberate scope cuts

| Cut | Why |
|---|---|
| Real-time co-editing (CRDT/OT, live cursors) | The biggest risk for a 4–6 h box. It needs a WebSocket server, which doesn't fit Vercel serverless, and a correctness story of its own. I documented **last write wins** instead and listed the cheap next step (optimistic concurrency with `updatedAt` → 409). |
| Real auth (sign-up, OAuth, reset) | The brief allows simulated users. Seeded accounts with real password hashing and signed httpOnly cookies demonstrate the access model without the setup burden. |
| Comments, suggestions, version history | Each is a feature in its own right. Viewer/Editor roles (also a listed stretch) were core to sharing, so I did those instead. |
| Images, tables, attachments | They need blob storage and a larger schema. Import clearly states which types it supports and drops unsupported content. |

## Stack

| Layer | Choice | Reasoning |
|---|---|---|
| App | **Next.js 16 (App Router) + TypeScript** | One codebase and one deploy for UI and API. Server components read the session and render data directly; client components handle interaction. |
| Editor | **Tiptap 3** (ProseMirror) | Mature rich-text engine with a typed JSON document model. The same extension list defines the schema in the browser *and* on the server. |
| DB | **SQLite via libSQL + Drizzle ORM** | Local dev is a file with zero setup for reviewers. Production uses **Turso** with the same driver and SQL. Drizzle gives typed queries and generated SQL migrations. |
| Auth | bcrypt + `jose` HS256 JWT in an httpOnly, SameSite=Lax cookie | Stateless, small, no external provider. |
| Validation | **zod** at the API boundary + ProseMirror schema check for content | |
| Tests | **Vitest** (services against in-memory SQLite) + **Playwright** (real browser) | |
| Hosting | **Vercel + Turso** free tiers | No cost for reviewers. |

## Data model

```
users            id, email (unique), name, password_hash
documents        id, owner_id → users, title, content_json, created_at, updated_at
document_shares  id, document_id → documents, user_id → users, role ('viewer'|'editor')
                 UNIQUE(document_id, user_id)
```

- **The owner is a column, not a share row.** Ownership can't be accidentally revoked or duplicated, and "owned vs shared" is a simple query on each side.
- **Sharing is an upsert** on `(document_id, user_id)`, so changing a role is the same call as granting access.
- **`content_json`** holds the Tiptap/ProseMirror document. It is the source of truth for formatting and maps 1:1 to what the editor renders.

## Access model

`src/lib/access.ts` is the entire policy:

| Role | read | edit (content/title) | share / change roles / revoke | delete |
|---|:-:|:-:|:-:|:-:|
| owner | ✓ | ✓ | ✓ | ✓ |
| editor | ✓ | ✓ | | |
| viewer | ✓ | | | |
| no access | 404 | 404 | 404 | 404 |

Every service function in `documents.ts` loads the doc together with the caller's share row in **one query** and checks `can(role, action)` before doing anything. Route handlers can't skip it, because they only call service functions. The UI hides controls based on the same `can()` helper, but that is a convenience, not the enforcement.

**404 instead of 403 for users without access** avoids revealing which document IDs exist. Users who *can* see a doc but lack a permission get a 403 with a clear message ("You have view-only access…").

## Request flow

```
Browser ── fetch JSON ──▶ app/api/**/route.ts
                           │  route() wrapper: AppError/Zod → {error} + status, unknown → 500 (logged)
                           │  requireUser()   → 401 if no valid session
                           │  zod.parse(body) → 400 with a human message
                           ▼
                         lib/documents.ts  ── access.ts (role → allowed?)  → 403/404
                           │  validateContent(): ProseMirror schema check, 1 MB cap → 400/413
                           ▼
                         Drizzle → libSQL (SQLite file | Turso)
```

Server-rendered pages (`/`, `/doc/[id]`) call the same service functions directly, so there is no HTTP hop on first load. With Next 16 Cache Components, session-dependent parts render inside `<Suspense>`, so the static shell streams immediately.

## Key implementation decisions

- **Shared schema = validation + sanitization.** `lib/editor/extensions.ts` is imported by the editor and the server. On save, the JSON must parse with `Node.fromJSON(schema).check()`, so unknown nodes and invalid nesting are rejected and we never store a doc the editor can't open. On import, HTML from Markdown/`.docx` is parsed *through that schema*, which drops scripts, event handlers, images and anything else unknown. No separate HTML sanitizer is needed, and no raw HTML is ever rendered.
- **Autosave without races.** One save is in flight at a time. Edits made during a save are merged and sent right after, so the latest edit always wins and nothing is dropped. Failed changes are kept for **Retry**. The hook also warns on tab close and fires a `keepalive` save on unmount.
- **Toolbar keeps focus in the document.** Toolbar buttons call `preventDefault` on `mousedown`. Without this, a click moves focus to the button and keys typed right after go to the button; Space would even re-toggle it. A browser test caught this, not the unit tests.
- **File import:** by extension, plus a magic-byte check for `.docx`, a 2 MB limit, and an empty-file check, each with a specific 4xx message. `.docx` goes through `mammoth` (with an explicit underline mapping, which mammoth drops by default), `.md` through `marked`, and `.txt` is converted directly (blank line = paragraph, newline = line break).
- **Errors are product copy.** Every 4xx carries a sentence the UI shows as is ("No user found with email …", "File is too large (max 2 MB).").
- **Production safety:** the app refuses to sign sessions in production without a ≥ 32-char `SESSION_SECRET`. Login compares a bcrypt hash even for unknown emails, so response timing doesn't reveal which accounts exist.

## Known limitations

- Last write wins for simultaneous editors (see the README for the 409-based fix).
- A collaborator's open tab doesn't refresh when someone else saves.
- No rate limiting on login. JWT sessions can't be revoked server-side before they expire (7 days).
- SQLite/Turso is plenty for this scope. The Drizzle schema would port to Postgres with minor changes if needed.
