import { Icon } from "../Icon";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-container text-on-primary shadow-card">
        <Icon name="description" className="text-[18px]" />
      </span>
      {!compact && (
        <span className="flex flex-col leading-tight">
          <span className="font-display text-[15px] font-semibold tracking-tight text-on-surface">Ajaia Docs</span>
          <span className="font-mono text-[11px] text-on-surface-variant">Team workspace</span>
        </span>
      )}
    </span>
  );
}
