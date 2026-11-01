"use client";

import { timeAgo } from "@/lib/client";

export function RecentTime({ iso }: { iso: string }) {
  return (
    <span className="font-mono text-[11px] text-on-surface-variant" suppressHydrationWarning>
      Edited {timeAgo(iso)}
    </span>
  );
}
