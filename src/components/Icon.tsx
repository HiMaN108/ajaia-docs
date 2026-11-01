/**
 * Material Symbols icon. The font is loaded once in the root layout and is
 * subset to ICON_NAMES, so every icon used in the app must be listed there
 * (a unit test checks this).
 */
export function Icon({ name, className = "", filled = false }: { name: string; className?: string; filled?: boolean }) {
  return (
    <span
      aria-hidden
      className={`material-symbols-outlined shrink-0 ${className}`}
      style={filled ? { fontVariationSettings: '"FILL" 1' } : undefined}
    >
      {name}
    </span>
  );
}
