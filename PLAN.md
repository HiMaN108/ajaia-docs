# Plan: Lightweight Collaborative Doc Editor ("Ajaia Docs")

Status: **DRAFT, waiting for review.** No code until approved.

## 1. Product slice (what we're building)

One coherent flow, done well:

> Log in as a seeded user → see "My documents" and "Shared with me" → create or import a doc → edit with rich text (autosaves) → share it with a teammate by email as Viewer or Editor → log in as the teammate and see it under "Shared with me" with the right permissions.

### In scope (core)
| Area | What ships |
|---|---|
| Docs | Create, rename (inline title), edit, autosave (debounced) with a "Saving… / Saved" indicator, reopen, delete (owner only) |
| Rich text | Bold, italic, underline, H1/H2/H3, bullet + numbered lists, undo/redo, keyboard shortcuts |
| Upload | Import **.txt, .md, .docx** (max 2 MB) → becomes a new editable doc. Supported types listed in the UI and README |
| Sharing | Owner shares by email with role **Viewer** or **Editor**, can remove access. Dashboard separates "Owned by me" and "Shared with me". Viewers get a read-only editor |
| Auth | Lightweight login with 3 seeded accounts (email + password), httpOnly signed session cookie |
| Persistence | SQL database. Content stored as editor JSON so formatting survives exactly |
| Quality | Server-side validation (zod), clear error states, access checks on every API route, automated tests, deployed URL |

### Deliberately cut (and documented in the README)
- Real-time multi-cursor co-editing (CRDT/Yjs): large scope, and the risk is high in 4–6 h. Concurrent edits use **last write wins**, and the docs say so.
- Comments, suggestion mode, version history, images/tables, sign-up, password reset, email notifications.
- **Stretch, only if core is done:** Export to Markdown (cheap, about 30 min). Viewer/Editor roles are already in core and cover the "role-based permissions" stretch.

## 2. Tech stack (proposed)

| Layer | Choice | Why |
|---|---|---|
| App | **Next.js 15 (App Router) + TypeScript** | One repo and one deploy for frontend + API routes |
| Editor | **Tiptap** (ProseMirror) | Strong rich-text base. JSON doc model is easy to persist and validate |
| Styling | Tailwind CSS | Fast, consistent UI |
| DB / ORM | **Drizzle ORM + libSQL (SQLite)** | Local: a plain SQLite file with zero setup for reviewers. Prod: **Turso** free tier, same driver |
| Auth | bcrypt hashed seeded passwords + `jose` signed JWT in an httpOnly cookie | Real enough to show access logic without OAuth setup |
| Import | `mammoth` (docx→HTML), `marked` (md→HTML), plain text→paragraphs, then sanitize and convert to Tiptap JSON | |
| Tests | **Vitest** (unit + API/permission integration on an in-memory SQLite DB). Optional: one Playwright happy-path e2e | |
| Deploy | **Vercel** (free) + Turso (free) | No cost for reviewers |

Alternative if you prefer: Postgres (Neon/Supabase) + Prisma. This is more "standard" but local setup needs Docker or a cloud DB.

## 3. Data model

```
users        (id, email UNIQUE, name, password_hash, created_at)
documents    (id, owner_id → users, title, content_json, created_at, updated_at)
document_shares (id, document_id → documents, user_id → users,
                 role ENUM('viewer','editor'), created_at,
                 UNIQUE(document_id, user_id))
```

Access rule, in one place (`lib/access.ts`):
`getRole(userId, doc) → 'owner' | 'editor' | 'viewer' | null`
- read: any role · update content/title: owner or editor · share/unshare/delete: owner only

## 4. API (Next.js route handlers)

| Method | Route | Who |
|---|---|---|
| POST | `/api/auth/login`, `/api/auth/logout`, GET `/api/auth/me` | — |
| GET | `/api/documents` → `{ owned: [], shared: [] }` | logged in |
| POST | `/api/documents` (blank) | logged in |
| GET / PATCH / DELETE | `/api/documents/:id` | role-checked |
| POST | `/api/documents/import` (multipart) | logged in |
| GET / POST / DELETE | `/api/documents/:id/shares` | owner |

Validation: zod on all bodies. Title is 1–200 chars. Content is valid Tiptap JSON with a size cap. Share target must be an existing user, not yourself. Errors use proper status codes (400/401/403/404/413/415) with a JSON `{ error }` body that the UI shows as a toast.

## 5. UI screens
1. **/login**: email + password, plus a list of the seeded demo accounts for reviewers.
2. **/ (dashboard)**: "New document", "Import file" (with supported types shown), two sections: *Owned by me* and *Shared with me*. Each shared doc shows its owner and a role badge.
3. **/doc/:id**: editable title, toolbar, editor, save status, "Share" button (owner) → modal with email + role, plus the list of current collaborators with remove. Viewers see a "View only" banner and a disabled toolbar.

## 6. Tests (meaningful, not volume)
1. **Access control:** owner/editor/viewer/stranger against read/update/share/delete (table-driven).
2. **Sharing API flow:** A shares with B as viewer → B can GET, can't PATCH (403) → upgrade to editor → B can PATCH → revoke → 404/403.
3. **Import conversion:** .md / .txt / .docx fixture → expected Tiptap nodes (headings, lists, bold kept). Rejects unsupported type and oversize file.
4. (Optional) Playwright happy path: login → create → type bold text → reload → still bold.

## 7. Build order + time budget (~5 h)
| # | Step | Est. |
|---|---|---|
| 1 | Scaffold Next.js/TS/Tailwind, Drizzle schema, migrations, seed script, git init | 30m |
| 2 | Auth (login/logout/session middleware) + login page | 35m |
| 3 | Documents CRUD API + access module + dashboard | 45m |
| 4 | Editor page: Tiptap, toolbar, autosave, rename, read-only mode | 60m |
| 5 | Sharing API + share modal + "Shared with me" | 40m |
| 6 | File import (.txt/.md/.docx) | 35m |
| 7 | Tests | 35m |
| 8 | Deploy (Turso + Vercel), smoke test the live URL | 25m |
| 9 | Docs: README, ARCHITECTURE.md, AI_WORKFLOW.md, SUBMISSION.md, VIDEO_URL.txt, screenshots | 30m |
| — | Stretch: Markdown export | 30m |

Checkpoint after step 5: if we're over budget, cut .docx (keep .txt/.md) before cutting anything else.

## 8. Deliverables checklist
- [ ] Source code (git repo)
- [ ] `README.md`: local setup, env vars, run, test, seeded accounts, supported file types, what's done / incomplete / next 2–4 h
- [ ] `ARCHITECTURE.md`: priorities, tradeoffs, data model, access model
- [ ] `AI_WORKFLOW.md`: tools used, where AI sped things up, what was changed or rejected, how it was verified. **Keep a running log as we go.**
- [ ] `SUBMISSION.md`: exact list of contents + links
- [ ] Live URL (Vercel)
- [ ] `VIDEO_URL.txt` (you record the Loom)
- [ ] `screenshots/`

## 9. What you need to do / decide
- Accounts: **GitHub**, **Vercel**, **Turso** (all free). I'll guide the CLI steps. Logins must be done by you.
- Record the walkthrough video and upload to Google Drive (I can draft a 4-minute script).
- Confirm or change the decisions below.

### Open decisions for your review
1. Stack: Next.js + Tiptap + Drizzle/SQLite(Turso) + Vercel. **OK, or prefer Postgres/Prisma?**
2. Roles: Viewer + Editor (recommended), or only a single "access" level?
3. Upload behavior: import as a **new doc** (recommended), or also "import into the current doc"?
4. Stretch: Markdown export, or none?
5. Seeded users: `alice@ajaia.dev`, `bob@ajaia.dev`, `carol@ajaia.dev` / password `demo1234`. OK?
