import { describe, expect, it } from "vitest";
import { can, resolveRole, type Action, type Role } from "@/lib/access";

describe("resolveRole", () => {
  const doc = { ownerId: "alice" };
  it("owner wins even if a share row exists", () => {
    expect(resolveRole("alice", doc, "viewer")).toBe("owner");
  });
  it("uses the share role for collaborators", () => {
    expect(resolveRole("bob", doc, "editor")).toBe("editor");
    expect(resolveRole("carol", doc, "viewer")).toBe("viewer");
  });
  it("returns null for strangers", () => {
    expect(resolveRole("mallory", doc, null)).toBeNull();
  });
});

describe("can (permission matrix)", () => {
  const matrix: [Role | null, Record<Action, boolean>][] = [
    ["owner", { read: true, edit: true, share: true, delete: true }],
    ["editor", { read: true, edit: true, share: false, delete: false }],
    ["viewer", { read: true, edit: false, share: false, delete: false }],
    [null, { read: false, edit: false, share: false, delete: false }],
  ];
  for (const [role, expected] of matrix) {
    for (const [action, allowed] of Object.entries(expected)) {
      it(`${role ?? "stranger"} ${allowed ? "can" : "cannot"} ${action}`, () => {
        expect(can(role, action as Action)).toBe(allowed);
      });
    }
  }
});
