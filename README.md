# Ajaia Docs: a lightweight collaborative document editor

A small full-stack document editor inspired by Google Docs. You can create and edit rich-text documents, import files, share with teammates as **Viewer** or **Editor**, and export to Markdown.

- **Live app:** _<add Vercel URL>_
- **Walkthrough video:** see [`VIDEO_URL.txt`](VIDEO_URL.txt)
- **Architecture note:** [`ARCHITECTURE.md`](ARCHITECTURE.md) · **AI workflow note:** [`AI_WORKFLOW.md`](AI_WORKFLOW.md) · **Contents:** [`SUBMISSION.md`](SUBMISSION.md)

## Demo accounts

All passwords are **`demo1234`**. The login page has one-click buttons for each account.

| Account | Role in the seeded "Welcome to Ajaia Docs" document |
|---|---|
| `alice@ajaia.dev` | **Owner**: can edit, share, change roles, remove access, delete |
| `bob@ajaia.dev` | **Editor**: can edit content and title |
| `carol@ajaia.dev` | **Viewer**: read-only |

**Suggested 2-minute review path:**
1. Log in as Alice. Click **New document**, type, and use the toolbar (heading, bold, italic, underline, lists). The header shows "All changes saved". Reload to confirm everything persisted.
2. Click **Share** and add `bob@ajaia.dev` as *Viewer*. Try a non-existent email to see validation.
3. Log out and log in as Bob. The doc appears under **Shared with me** with a *View only* badge. Open it: the editor is read-only.
4. Log back in as Alice and change Bob to *Editor*. Bob can now edit.
5. Click **Import file** and upload a `.txt`, `.md` or `.docx` file (samples in [`tests/fixtures/`](tests/fixtures)). It opens as a new editable doc.
6. Click **Download .md** to export the current doc as Markdown.

## Features

| Area | What works |
|---|---|
| **Documents** | Create, rename (click the title), edit, delete (owner only), reopen. Autosave runs ~0.8 s after you stop typing and shows a *Saving… / All changes saved / Not saved, Retry* indicator. You get a warning before closing a tab with unsaved changes |
| **Rich text** | Bold, italic, underline, strikethrough, Heading 1–3, bulleted and numbered lists (nestable with Tab), blockquote, undo/redo, standard keyboard shortcuts (⌘B / ⌘I / ⌘U …) and Markdown-style shortcuts (`# `, `- `, `1. `) |
| **File import** | **`.txt`, `.md`, `.docx` only, max 2 MB.** Each upload becomes a new document owned by the uploader. Headings, lists, bold, italic and underline are preserved. Images, tables and other unsupported content are dropped (stated in the UI next to the button) |
| **Sharing** | Owner shares by email as **Viewer** or **Editor**, changes roles and removes access. The dashboard separates **Owned by me** from **Shared with me**, with role badges and owner names. Viewers get a read-only editor |
| **Access control** | Enforced on the server for every request (not only hidden in the UI). Users with no access get **404**, so a document's existence isn't revealed. Viewers who try to write get **403** |
| **Export** _(stretch)_ | Download any document you can read as Markdown |
| **Persistence** | SQLite (local file) / Turso (production). Content is stored as editor JSON, so formatting round-trips exactly |

## Run locally

Requirements: **Node 20.9+** (developed on Node 24) and npm. No database server, Docker or env vars needed.

```bash
npm install
npm run db:setup     # creates local.db (SQLite), runs migrations, seeds demo users + sample doc
npm run dev          # http://localhost:3000
```

`npm run db:setup` is idempotent, so you can rerun it any time. To start from scratch, delete `local.db` and run it again.

### Tests

```bash
npm test             # Vitest: 34 unit + integration tests (in-memory SQLite, ~1 s)
npm run test:e2e     # Playwright: full browser flow (first run: npx playwright install chromium)
npm run typecheck && npm run lint
```

What's covered:
- **Access control:** the full owner/editor/viewer/stranger × read/edit/share/delete matrix.
- **Sharing service flow:** share as viewer → 403 on write → upgrade to editor → write succeeds → revoke → 404. Also covers invalid share targets, delete cascade, and the owned/shared split.
- **Persistence:** rich content round-trips exactly. Content that doesn't match the editor schema is rejected.
- **Import:** a real `.docx`, Markdown (including a script/`onerror` sanitization check) and plain text. Also covers rejection of unsupported, empty, oversized and fake files.
- **Markdown export,** including an export → import round-trip.
- **E2E (real browser):** login → create → format via toolbar and shortcuts → autosave → reload and assert formatting → export → share (including the error case) → log in as the collaborator and see a read-only doc. Plus `.docx` import. This test also generates the images in [`screenshots/`](screenshots).

### Environment variables

See [`.env.example`](.env.example). Local dev needs none.

| Variable | Default | Notes |
|---|---|---|
| `DATABASE_URL` | `file:local.db` | `libsql://…turso.io` in production |
| `DATABASE_AUTH_TOKEN` | — | Turso token (production only) |
| `SESSION_SECRET` | dev fallback | **Required in production**, ≥ 32 chars (`openssl rand -base64 32`). The app refuses to issue sessions without it |

## Deployment (Vercel + Turso, both free)

1. **Database:** create a Turso database (web dashboard or `turso db create ajaia-docs`), then get its URL and an auth token.
2. **Migrate + seed it** from your machine:
   ```bash
   DATABASE_URL="libsql://<db>.turso.io" DATABASE_AUTH_TOKEN="<token>" npm run db:setup
   ```
3. **Vercel:** import the repo (or run `npx vercel`), then set `DATABASE_URL`, `DATABASE_AUTH_TOKEN` and `SESSION_SECRET` for Production, and deploy. No build settings need changing.

## Status

**Working end to end:** everything in the Features table, covered by automated tests and verified in a real browser.

**Deliberately not built (scope cuts, explained in [`ARCHITECTURE.md`](ARCHITECTURE.md)):**
- Real-time co-editing and live cursors. Concurrent edits are **last write wins**: if two people edit the same doc at the same moment, the later save overwrites the earlier one. Reopening shows the latest saved version.
- Sign-up, password reset, OAuth (seeded accounts only), email notifications, comments, version history, images and tables, mobile-optimized toolbar.

**Next 2–4 hours, in priority order:**
1. **Conflict safety:** send the document's `updatedAt` with each save and return 409 if someone else saved in between, with a "reload / overwrite" prompt. This is cheap and removes silent overwrites.
2. **Live refresh for collaborators:** poll every ~10 s for a newer `updatedAt` and show "Alice edited this, reload?", plus "who's viewing" presence.
3. **Version history:** snapshot on each save (throttled), with a restore list.
4. Real-time co-editing with Yjs + a WebSocket provider (this would replace step 1).

## Project structure

```
src/
  app/
    api/…                 REST route handlers (thin: auth → zod parse → service → JSON)
    page.tsx              Dashboard (owned / shared)
    doc/[id]/page.tsx     Editor page
    login/                Login page
  components/             UI (editor, toolbar, autosave hook, share dialog, lists)
  lib/
    access.ts             The access policy: role → allowed actions
    documents.ts          Document + sharing service (all business rules live here)
    import.ts             .txt / .md / .docx → editor JSON
    editor/               Shared Tiptap schema, server-side content validation, Markdown export
    auth.ts, session.ts   Login, signed httpOnly session cookie (JWT)
    db/                   Drizzle schema, client, migrator
drizzle/                  SQL migrations
scripts/seed.ts           Migrate + seed demo data
tests/                    Vitest suites + fixtures
e2e/                      Playwright browser test
```
