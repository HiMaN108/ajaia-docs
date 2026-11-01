import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listDocuments } from "@/lib/documents";
import { AppHeader } from "@/components/AppHeader";
import { DashboardActions } from "@/components/DashboardActions";
import { DocumentList } from "@/components/DocumentList";

export default function HomePage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { owned, shared } = await listDocuments(user.id);

  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Documents</h1>
            <p className="text-sm text-slate-500">Create, import and share documents with your team.</p>
          </div>
          <DashboardActions />
        </div>

        <DocumentList
          title="Owned by me"
          docs={owned}
          emptyText="You don't own any documents yet. Create one or import a file to get started."
        />
        <DocumentList
          title="Shared with me"
          docs={shared}
          emptyText="Nothing has been shared with you yet."
        />
      </main>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl animate-pulse px-6 py-20">
      <div className="mb-6 h-7 w-48 rounded bg-slate-200" />
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-slate-100" />
        ))}
      </div>
    </div>
  );
}
