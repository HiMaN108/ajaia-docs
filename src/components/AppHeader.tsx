import Link from "next/link";
import type { SessionUser } from "@/lib/auth";
import { LogoutButton } from "./LogoutButton";

export function AppHeader({ user }: { user: SessionUser }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
        <Logo />
        Ajaia Docs
      </Link>
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <div className="text-sm font-medium text-slate-800">{user.name}</div>
          <div className="text-xs text-slate-500">{user.email}</div>
        </div>
        <Avatar name={user.name} />
        <LogoutButton />
      </div>
    </header>
  );
}

export function Logo() {
  return (
    <span className="grid h-8 w-8 place-items-center rounded-md bg-blue-600 text-white" aria-hidden>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M8 13h8M8 17h5" />
      </svg>
    </span>
  );
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const dim = size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";
  return (
    <span className={`grid ${dim} shrink-0 place-items-center rounded-full bg-indigo-100 font-semibold text-indigo-700`}>
      {initials}
    </span>
  );
}
