import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listDocuments } from "@/lib/documents";
import { AppShell } from "@/components/shell/AppShell";
import { ImportPanel } from "@/components/import/ImportPanel";
import { Icon } from "@/components/Icon";
import { PageSkeleton } from "@/components/PageSkeleton";
import { RecentTime } from "@/components/import/RecentTime";

export const metadata = { title: "Import file · Ajaia Docs" };

const KEPT = [
  { icon: "format_size", title: "Headings", text: "H1–H3 become editor headings." },
  { icon: "format_bold", title: "Inline formatting", text: "Bold, italic, underline, strikethrough, inline code." },
  { icon: "format_list_bulleted", title: "Lists & quotes", text: "Bulleted, numbered and nested lists, blockquotes." },
  { icon: "link", title: "Links & code blocks", text: "Links and fenced code blocks are kept." },
];

export default function ImportPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ImportView />
    </Suspense>
  );
}

async function ImportView() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { owned } = await listDocuments(user.id);
  const recent = owned.slice(0, 4);

  return (
    <AppShell user={user} breadcrumb="Import file">
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:py-8">
        <header className="mb-8 max-w-2xl">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-on-surface">Import a file</h1>
          <p className="mt-2 text-base text-on-surface-variant">
            Turn a text, Markdown or Word file into a new editable document that you own.
          </p>
        </header>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-7">
            <ImportPanel />

            <section className="relative overflow-hidden rounded-xl bg-surface-container-low p-5 pl-7">
              <div className="absolute inset-y-0 left-0 w-1.5 bg-primary-container" />
              <h2 className="mb-1 flex items-center gap-2 font-display text-[15px] font-semibold text-on-surface">
                <Icon name="auto_awesome" className="text-[20px] text-primary-container" /> What&apos;s preserved
              </h2>
              <p className="mb-4 text-[13px] text-on-surface-variant">
                Content is converted into the editor&apos;s own format. Anything it doesn&apos;t support (images, tables, colors, scripts) is
                left out.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {KEPT.map((k) => (
                  <div key={k.title} className="flex items-start gap-2.5 rounded-lg bg-surface-container-lowest/80 p-2.5">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded bg-primary-fixed text-primary">
                      <Icon name={k.icon} className="text-[15px]" />
                    </span>
                    <div>
                      <p className="font-display text-[13px] font-semibold text-on-surface">{k.title}</p>
                      <p className="text-xs text-on-surface-variant">{k.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-5">
            <section className="card p-5">
              <div className="mb-3 flex items-center gap-2">
                <Icon name="history" className="text-[18px] text-on-surface-variant" />
                <h2 className="font-display text-[15px] font-semibold text-on-surface">Your recent documents</h2>
              </div>
              {recent.length === 0 ? (
                <p className="text-xs text-on-surface-variant">Documents you create or import will show up here.</p>
              ) : (
                <ul className="space-y-2">
                  {recent.map((d) => (
                    <li key={d.id}>
                      <Link
                        href={`/doc/${d.id}`}
                        className="group flex items-center justify-between gap-3 rounded-lg bg-surface-container-low p-3 transition hover:bg-surface-container"
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-fixed text-primary">
                            <Icon name="description" className="text-[18px]" />
                          </span>
                          <span className="flex min-w-0 flex-col">
                            <span className="truncate font-display text-[13px] font-semibold text-on-surface">{d.title}</span>
                            <RecentTime iso={d.updatedAt} />
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-1 rounded bg-surface-container-lowest px-2 py-1 font-display text-[11px] font-semibold text-primary opacity-0 shadow-card transition group-hover:opacity-100">
                          Open <Icon name="arrow_forward" className="text-[14px]" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-[15px] font-semibold text-on-surface">
                  <Icon name="code" className="text-[18px] text-primary-container" /> Markdown cheat sheet
                </h2>
                <span className="font-mono text-[11px] text-on-surface-variant">CommonMark + GFM</span>
              </div>
              <pre className="overflow-x-auto rounded-lg bg-surface-container-low p-3 font-mono text-xs leading-5 text-on-surface-variant">
                {"# Heading 1\n## Heading 2\n\n**bold**, *italic*, ~~strike~~, `code`\n\n- bullet item\n  - nested item\n1. numbered item\n\n> a quote\n\n[a link](https://example.com)"}
              </pre>
            </section>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
