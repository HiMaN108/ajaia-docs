import type { ShareRole } from "./db/schema";

/**
 * The single source of truth for "who can do what" on a document.
 * Every API route and server page goes through these helpers.
 */
export type Role = "owner" | ShareRole; // "owner" | "editor" | "viewer"
export type Action = "read" | "edit" | "share" | "delete";

const PERMISSIONS: Record<Role, ReadonlySet<Action>> = {
  owner: new Set(["read", "edit", "share", "delete"]),
  editor: new Set(["read", "edit"]),
  viewer: new Set(["read"]),
};

/** Resolve a user's role on a document from ownership and (optional) share row. */
export function resolveRole(
  userId: string,
  doc: { ownerId: string },
  shareRole: ShareRole | null | undefined,
): Role | null {
  if (doc.ownerId === userId) return "owner";
  return shareRole ?? null;
}

export function can(role: Role | null, action: Action): boolean {
  return role !== null && PERMISSIONS[role].has(action);
}
