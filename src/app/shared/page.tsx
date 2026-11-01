import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listDocuments } from "@/lib/documents";
import { AppShell } from "@/components/shell/AppShell";
import { DocumentsBrowser } from "@/components/dashboard/DocumentsBrowser";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { PageSkeleton } from "@/components/PageSkeleton";

export const metadata = { title: "Shared with me · Ajaia Docs" };

export default function SharedPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Shared />
    </Suspense>
  );
}

async function Shared() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { shared } = await listDocuments(user.id);
  const editable = shared.filter((d) => d.role === "editor").length;

  return (
    <AppShell user={user} breadcrumb="Shared with me">
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-6 sm:px-6 lg:py-8">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-on-surface">Shared with me</h1>
            <span className="rounded-full bg-surface-container px-2 py-0.5 font-display text-[11px] font-semibold text-primary">
              {shared.length} {shared.length === 1 ? "document" : "documents"} · {editable} editable
            </span>
          </div>
          <p className="max-w-2xl text-sm text-on-surface-variant">Documents your teammates have shared with your account.</p>
        </div>
        <DocumentsBrowser
          ownerFilter
          docs={shared}
          emptyState={
            <EmptyState icon="folder_shared" title="Nothing has been shared with you yet">
              When a teammate shares a document with <strong>{user.email}</strong>, it will appear here.
            </EmptyState>
          }
        />
      </main>
    </AppShell>
  );
}
