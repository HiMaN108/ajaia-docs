import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDocument } from "@/lib/documents";
import { AppError } from "@/lib/errors";
import { DocEditor } from "@/components/editor/DocEditor";

export default function DocPage({ params }: PageProps<"/doc/[id]">) {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <DocLoader params={params} />
    </Suspense>
  );
}

async function DocLoader({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, user] = await Promise.all([params, getCurrentUser()]);
  if (!user) redirect("/login");

  let doc;
  try {
    doc = await getDocument(user.id, id);
  } catch (err) {
    if (err instanceof AppError && err.status === 404) notFound();
    throw err;
  }
  return <DocEditor key={doc.id} doc={doc} user={user} />;
}

function EditorSkeleton() {
  return (
    <div className="flex-1 animate-pulse lg:pl-64">
      <div className="h-24 border-b border-outline-variant/30 bg-surface-container-lowest" />
      <div className="mx-auto mt-8 h-[70vh] max-w-[860px] rounded-2xl bg-surface-container-lowest" />
    </div>
  );
}
