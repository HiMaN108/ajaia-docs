"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@/lib/auth";
import { useCreateDocument } from "@/lib/client-actions";
import { api } from "@/lib/client";
import { Icon } from "../Icon";
import { Avatar } from "./Avatar";
import { Logo } from "./Logo";

export const NAV = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/shared", label: "Shared with me", icon: "folder_shared" },
  { href: "/import", label: "Import file", icon: "upload_file" },
] as const;

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Sidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const { create, busy, error } = useCreateDocument();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col justify-between border-r border-outline-variant/30 bg-surface-container-lowest lg:flex">
      <div className="flex flex-col">
        <Link href="/" className="p-4">
          <Logo />
        </Link>

        <div className="px-4 pb-4">
          <button className="btn-primary w-full" onClick={() => void create()} disabled={busy}>
            <Icon name="add" className="text-[18px]" />
            {busy ? "Creating…" : "New document"}
          </button>
          {error && <p className="mt-2 text-xs text-error">{error}</p>}
        </div>

        <nav className="space-y-0.5 px-2" aria-label="Main">
          <p className="eyebrow px-3 pb-1 text-[10px]">Workspace</p>
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 font-display text-[13px] transition-colors ${
                  active
                    ? "bg-surface-container font-semibold text-on-surface"
                    : "font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                }`}
              >
                <Icon name={item.icon} className={`text-[18px] ${active ? "text-primary" : ""}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-outline-variant/30 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar name={user.name} seed={user.email} />
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-display text-[13px] font-medium text-on-surface">{user.name}</span>
              <span className="truncate font-mono text-[11px] text-on-surface-variant">{user.email}</span>
            </div>
          </div>
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}

export function LogoutButton({ withLabel = false }: { withLabel?: boolean }) {
  return (
    <button
      type="button"
      title="Log out"
      aria-label="Log out"
      className="btn-ghost hover:text-error"
      onClick={async () => {
        await api("/api/auth/logout", { method: "POST" }).catch(() => {});
        // Full reload on purpose: auth changed, so drop all client-side cached server state.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign("/login");
      }}
    >
      <Icon name="logout" className="text-[18px]" />
      {withLabel && <span>Log out</span>}
    </button>
  );
}
