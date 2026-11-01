"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { SessionUser } from "@/lib/auth";
import { Icon } from "../Icon";
import { Avatar } from "./Avatar";
import { Logo } from "./Logo";
import { LogoutButton, NAV, Sidebar, isActive } from "./Sidebar";

/**
 * Page chrome: fixed sidebar on desktop, compact top nav on mobile.
 * `topbar` replaces the default breadcrumb bar (the editor uses its own).
 * `sidebarHidden` powers the editor's focus mode.
 */
export function AppShell({
  user,
  children,
  breadcrumb,
  topbar,
  sidebarHidden = false,
}: {
  user: SessionUser;
  children: ReactNode;
  breadcrumb?: string;
  topbar?: ReactNode;
  sidebarHidden?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-1 flex-col">
      {!sidebarHidden && <Sidebar user={user} />}
      <div className={`flex flex-1 flex-col transition-[padding] ${sidebarHidden ? "" : "lg:pl-64"}`}>
        <MobileNav user={user} />
        {topbar ?? (
          <header className="sticky top-0 z-30 hidden h-14 items-center justify-between border-b border-outline-variant/30 bg-surface-container-lowest/80 px-6 backdrop-blur-xl lg:flex">
            <div className="flex items-center gap-2 font-display text-[13px] text-on-surface-variant">
              <span>Ajaia Docs</span>
              <span className="text-outline-variant">/</span>
              <span className="font-semibold text-on-surface">{breadcrumb}</span>
            </div>
            <Avatar name={user.name} seed={user.email} />
          </header>
        )}
        {children}
      </div>
    </div>
  );
}

function MobileNav({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  return (
    <div className="sticky top-0 z-30 border-b border-outline-variant/30 bg-surface-container-lowest lg:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/">
          <Logo compact />
        </Link>
        <div className="flex items-center gap-2">
          <Avatar name={user.name} seed={user.email} size="sm" />
          <LogoutButton />
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-2 pb-2" aria-label="Main">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 font-display text-[13px] ${
              isActive(pathname, item.href) ? "bg-surface-container font-semibold" : "text-on-surface-variant"
            }`}
          >
            <Icon name={item.icon} className="text-[16px]" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
