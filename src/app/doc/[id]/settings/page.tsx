import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDocument, listCollaborators } from "@/lib/documents";
import { AppError } from "@/lib/errors";
import { docToText, textStats } from "@/lib/editor/stats";
import { DocSettings } from "@/components/settings/DocSettings";
import { PageSkeleton } from "@/components/PageSkeleton";

export const metadata = { title: "Document settings · Ajaia Docs" };

export default function DocSettingsPage({ params }: PageProps<"/doc/[id]/settings">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Loader params={params} />
    </Suspense>
  );
}

async function Loader({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, user] = await Promise.all([params, getCurrentUser()]);
  if (!user) redirect("/login");
  let doc;
  try {
    doc = await getDocument(user.id, id);
  } catch (err) {
    if (err instanceof AppError && err.status === 404) notFound();
    throw err;
  }
  const stats = textStats(docToText(doc.content));
  const collaborators = doc.role === "owner" ? await listCollaborators(user.id, doc.id) : null;
  return <DocSettings key={doc.id} doc={doc} user={user} stats={stats} initialCollaborators={collaborators} />;
}
