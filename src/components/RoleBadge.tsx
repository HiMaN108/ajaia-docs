import type { Role } from "@/lib/access";

const STYLES: Record<Role, string> = {
  owner: "bg-primary-fixed text-on-primary-fixed-variant",
  editor: "bg-tertiary-fixed text-on-tertiary-fixed",
  viewer: "bg-secondary-container text-on-secondary-container",
};
const LABELS: Record<Role, string> = { owner: "Owner", editor: "Editor", viewer: "Viewer" };

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 font-display text-[11px] font-semibold ${STYLES[role]}`}>
      {LABELS[role]}
    </span>
  );
}
