import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listDocuments } from "@/lib/documents";
import { AppShell } from "@/components/shell/AppShell";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { DocumentsBrowser } from "@/components/dashboard/DocumentsBrowser";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { SharingGuide } from "@/components/dashboard/SharingGuide";
import { PageSkeleton } from "@/components/PageSkeleton";

export default function HomePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { owned, shared } = await listDocuments(user.id);

  return (
    <AppShell user={user} breadcrumb="Dashboard">
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:py-8">
        <DashboardHero firstName={user.name.split(" ")[0]} ownedCount={owned.length} sharedCount={shared.length} />
        <h2 className="mb-3 font-display text-lg font-semibold text-on-surface">Documents</h2>
        <DocumentsBrowser
          tabs
          docs={[...owned, ...shared]}
          emptyState={
            <EmptyState icon="note_stack" title="No documents yet">
              Create a blank document or import a file to get started.
            </EmptyState>
          }
        />
        <SharingGuide />
      </main>
    </AppShell>
  );
}
