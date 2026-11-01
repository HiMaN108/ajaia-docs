# AI workflow note

> _Candidate: review and adjust this note so it reflects your own experience. Add anything you changed by hand or decided differently._

## Tools used

- **Claude Code (Claude Opus 5.5)** in the terminal, as a pair-programming agent. It read docs, wrote code, ran commands, tests, the dev server and a headless browser, and inspected screenshots.
- **Playwright** screenshots as the "eyes" for UI review. The AI looked at the rendered pages, not only the code.
- No other code generators.

## How I worked with it

1. **Plan first, code second.** I had the AI turn the brief into a written plan ([`PLAN.md`](PLAN.md)): scope, explicit cuts, data model, API, test plan and time budget, plus five open decisions (stack, roles, upload behavior, stretch goal, demo users). I reviewed it and made those decisions before any code was written.
2. **Build in vertical layers,** verifying each before moving on: schema + seed → services + access policy → API → UI → tests → browser e2e → docs.
3. **Verify by running, not by reading.** Every layer was exercised: `tsc`, ESLint, `next build`, Vitest, a curl script hitting every endpoint and error path against a production build, and Playwright driving the real UI.

## Where AI materially sped things up

- **Scaffolding and boilerplate:** Drizzle schema + migrations, route handlers, zod schemas, the share dialog, Tailwind styling. Hours of typing reduced to minutes.
- **Learning an unfamiliar framework version quickly.** The project generated on **Next.js 16** with Cache Components, which is newer than the model's default habits. The AI read the docs bundled in `node_modules/next/dist/docs` and followed the documented patterns: session reads inside `<Suspense>`, `RouteContext`/`PageProps` types, and `unstable_rethrow`.
- **Test authoring:** a table-driven permission matrix, an integration flow for sharing, and a Python script that builds a real `.docx` fixture with only the standard library.
- **Debugging by reading library source.** It traced the toolbar bug below into `@tiptap/react`'s `compareOptions` and `@tiptap/core`'s `setOptions`.

## What I changed or rejected from AI output

| AI output / first instinct | What happened |
|---|---|
| Plan to **disable Next 16 Cache Components** to avoid unfamiliar constraints | Rejected after reading the docs. Kept it on and followed the documented Suspense pattern, so the app uses the framework's defaults instead of fighting them. |
| Generic API error wrapper (`try/catch` → JSON) | **Bug:** it swallowed Next's internal control-flow errors (the build log showed a `HANGING_PROMISE_REJECTION` during prerender). Fixed with `unstable_rethrow`. |
| Recursive `flush()` in the autosave hook | Flagged by the React Compiler lint rule. Rewrote it as a loop, which is clearer and drains queued edits deterministically. |
| Toolbar implementation (all unit tests green) | **Bug found by the browser test:** after clicking "Bulleted list", typed text vanished and the list disappeared. Root cause: the button took focus, so keys went to it and Space re-toggled the list. Fixed with `preventDefault` on `mousedown`. Also hoisted editor options to module scope after finding that `useEditor` compares them by reference on every render. |
| Storing documents as **HTML** (common default) | Rejected. Stored editor JSON validated against the real schema: lossless, and it can't carry scripts. |
| Adding an HTML sanitizer dependency for imports | Rejected as redundant. Parsing through the editor schema already drops anything unknown, and a test proves `<script>`/`onerror` are stripped. |
| Returning **403** to users with no access | Changed to **404**, so a document's existence isn't revealed. 403 is kept for "you can see it but can't do that". |
| A hydration warning in the e2e logs | Investigated rather than ignored. The diff was Playwright's injected `caret-color` style (a test artifact, not app code), but it surfaced a real latent mismatch in the "Edited X ago" time, which was then fixed. |
| A failing Markdown round-trip test | The *test fixture* was wrong (it added empty `marks: []`), not the code. Fixed the helper, not the implementation. |
| UI redesign from AI-generated HTML mockups (Tailwind CDN, static data) | Used as a **visual reference only**. Rebuilt as typed React components on the existing data, and **rejected every mockup feature with no backend** (storage quota, favorites, presence avatars, version history, PDF export, tables/images, fake stats) instead of shipping dead UI. |
| Redesign lint findings (React Compiler) | Tile handlers that read a ref during render, setState in an effect, and `location.href` mutation: fixed by static tile data, server-provided initial collaborators, and `location.assign`. |
| Redesign visual review | Screenshots caught a save pill that wrapped and overlapped icons on mobile, a read-only status bar missing its word count (stats hook ran before the editor existed), and an over-wide title field. All three were fixed and re-verified. |
| Two stray files (`a.png`, cookie jars) written to the repo by a smoke script after a failed `cd` | Caught in `git status` before committing and deleted. |

## How I verified correctness, UX quality and reliability

- **Tests that can fail.** I deliberately broke the permission policy (gave editors `share`) and confirmed two tests failed, then restored it. A suite that never goes red proves nothing.
- **Unit + integration (Vitest, 34 tests):** the access matrix, the full share → upgrade → revoke flow, 404-vs-403 behavior, schema validation, a real `.docx`, Markdown sanitization, file rejection cases, and a Markdown export → import round-trip.
- **API smoke test (curl against `next build && next start`):** every endpoint plus 400/401/403/404/415 paths, the role enum, and malformed JSON. This also verified that the production guard fires when `SESSION_SECRET` is missing.
- **Browser e2e (Playwright):** the complete reviewer journey including reload-persistence of formatting, Markdown download contents, the share error path, and the viewer's read-only state (`contenteditable=false`, disabled title, no Share button).
- **Visual review:** read the generated screenshots and fixed what looked off: the save indicator floating mid-header, the "View only" badge position, and the dev-tools badge in screenshots.
- **Static checks:** `tsc --noEmit`, ESLint (including React Compiler rules) and `next build` are all clean.
