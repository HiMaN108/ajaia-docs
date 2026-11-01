import type { ReactNode } from "react";
import { Icon } from "../Icon";

export function EmptyState({ icon, title, children }: { icon: string; title: string; children?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-14 text-center">
      <span className="mb-1 grid h-12 w-12 place-items-center rounded-xl bg-surface-container text-primary">
        <Icon name={icon} className="text-[24px]" />
      </span>
      <p className="font-display text-sm font-semibold text-on-surface">{title}</p>
      {children && <div className="max-w-sm text-xs text-on-surface-variant">{children}</div>}
    </div>
  );
}
