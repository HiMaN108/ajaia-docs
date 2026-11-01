const PALETTE = [
  "bg-primary-container text-on-primary",
  "bg-secondary-container text-on-secondary-container",
  "bg-tertiary-fixed text-on-tertiary-fixed",
  "bg-primary-fixed text-on-primary-fixed-variant",
  "bg-surface-container-highest text-on-surface",
];

/** Stable color per person, so the same user looks the same everywhere. */
function colorFor(seed: string) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const SIZES = { xs: "h-6 w-6 text-[10px]", sm: "h-7 w-7 text-[11px]", md: "h-8 w-8 text-xs", lg: "h-10 w-10 text-sm" };

export function Avatar({ name, seed, size = "md", ring = false }: { name: string; seed?: string; size?: keyof typeof SIZES; ring?: boolean }) {
  return (
    <span
      title={name}
      className={`grid shrink-0 place-items-center rounded-full font-display font-semibold ${SIZES[size]} ${colorFor(seed ?? name)} ${
        ring ? "ring-2 ring-surface-container-lowest" : ""
      }`}
    >
      {initials(name)}
    </span>
  );
}
