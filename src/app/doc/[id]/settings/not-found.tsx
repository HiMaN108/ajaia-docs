import Link from "next/link";
import { Icon } from "@/components/Icon";

export default function DocNotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
      <span className="mb-2 grid h-14 w-14 place-items-center rounded-2xl bg-surface-container text-primary">
        <Icon name="search_off" className="text-[28px]" />
      </span>
      <h1 className="font-display text-xl font-semibold text-on-surface">Document not found</h1>
      <p className="max-w-sm text-sm text-on-surface-variant">
        It may have been deleted, or you don&apos;t have access. Ask the owner to share it with you.
      </p>
      <Link href="/" className="btn-primary mt-2">
        Back to documents
      </Link>
    </main>
  );
}
