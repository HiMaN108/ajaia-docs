import Link from "next/link";

export default function DocNotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 bg-slate-50 px-4 text-center">
      <h1 className="text-xl font-semibold text-slate-900">Document not found</h1>
      <p className="max-w-sm text-sm text-slate-500">
        It may have been deleted, or you don&apos;t have access. Ask the owner to share it with you.
      </p>
      <Link href="/" className="btn-primary mt-2">
        Back to documents
      </Link>
    </main>
  );
}
