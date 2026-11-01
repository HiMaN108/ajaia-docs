import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ICON_NAMES } from "@/components/icon-names";

/** Collect every icon name referenced in components: name="x", icon="x", icon: "x", and string literals inside name={…}. */
function usedIcons(dir: string, found = new Set<string>()) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) usedIcons(full, found);
    else if (full.endsWith(".tsx")) {
      const src = readFileSync(full, "utf8");
      for (const m of src.matchAll(/<Icon\s+name=(?:"([a-z_]+)"|\{([^}]*)\})/g)) {
        if (m[1]) found.add(m[1]);
        // Ternaries like name={x ? "a" : "b"}: take the literals that are results, not comparands.
        for (const lit of (m[2] ?? "").matchAll(/[?:]\s*"([a-z_]+)"/g)) found.add(lit[1]);
      }
      for (const m of src.matchAll(/\bicon(?:=|:\s*)"([a-z_]+)"/g)) found.add(m[1]);
    }
  }
  return found;
}

describe("icon font subset", () => {
  it("includes every icon used in the UI", () => {
    const used = usedIcons(path.join(__dirname, "../src"));
    expect(used.size).toBeGreaterThan(20);
    const missing = [...used].filter((n) => !(ICON_NAMES as readonly string[]).includes(n));
    expect(missing).toEqual([]);
  });
});
