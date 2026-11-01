import type { Role } from "@/lib/access";

const STYLES: Record<Role, string> = {
  owner: "bg-slate-100 text-slate-700",
  editor: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  viewer: "bg-amber-50 text-amber-700 ring-amber-200",
};
const LABELS: Record<Role, string> = { owner: "Owner", editor: "Can edit", viewer: "View only" };

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-transparent ${STYLES[role]}`}>
      {LABELS[role]}
    </span>
  );
}
