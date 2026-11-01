import { and, desc, eq } from "drizzle-orm";
import type { JSONContent } from "@tiptap/core";
import { getDb } from "./db";
import { documents, documentShares, users, type ShareRole } from "./db/schema";
import { can, resolveRole, type Action, type Role } from "./access";
import { badRequest, forbidden, notFound } from "./errors";
import { contentToPlainText, validateContent } from "./editor/content";
import { EMPTY_DOC } from "./editor/extensions";

/**
 * Document + sharing service. Every function takes the acting user's id and enforces
 * access through `access.ts`. Route handlers stay thin: auth, parse, call, respond.
 */

export type DocumentSummary = {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
  role: Role;
  owner: { id: string; name: string; email: string };
};

export type DocumentDetail = DocumentSummary & {
  content: JSONContent;
  createdAt: string;
  /** Size of the stored document JSON, in bytes. */
  contentBytes: number;
};

export type Collaborator = { userId: string; name: string; email: string; role: ShareRole };

const now = () => new Date();

async function loadWithRole(userId: string, docId: string) {
  const db = getDb();
  const rows = await db
    .select({
      doc: documents,
      ownerName: users.name,
      ownerEmail: users.email,
      shareRole: documentShares.role,
    })
    .from(documents)
    .innerJoin(users, eq(users.id, documents.ownerId))
    .leftJoin(
      documentShares,
      and(eq(documentShares.documentId, documents.id), eq(documentShares.userId, userId)),
    )
    .where(eq(documents.id, docId))
    .limit(1);

  const row = rows[0];
  if (!row) throw notFound();
  const role = resolveRole(userId, row.doc, row.shareRole);
  // No access at all → 404 (don't reveal that the document exists).
  if (!role) throw notFound();
  return { ...row, role };
}

async function authorize(userId: string, docId: string, action: Action) {
  const loaded = await loadWithRole(userId, docId);
  if (!can(loaded.role, action)) {
    throw forbidden(
      action === "edit"
        ? "You have view-only access to this document."
        : "Only the owner can do that.",
    );
  }
  return loaded;
}

function toDetail(l: Awaited<ReturnType<typeof loadWithRole>>): DocumentDetail {
  const content = JSON.parse(l.doc.contentJson) as JSONContent;
  return {
    id: l.doc.id,
    title: l.doc.title,
    preview: contentToPlainText(content),
    updatedAt: l.doc.updatedAt.toISOString(),
    role: l.role,
    owner: { id: l.doc.ownerId, name: l.ownerName, email: l.ownerEmail },
    content,
    createdAt: l.doc.createdAt.toISOString(),
    contentBytes: Buffer.byteLength(l.doc.contentJson, "utf8"),
  };
}

export async function listDocuments(userId: string) {
  const db = getDb();
  const owner = { id: users.id, name: users.name, email: users.email };

  const [ownedRows, sharedRows] = await Promise.all([
    db
      .select({ doc: documents, owner })
      .from(documents)
      .innerJoin(users, eq(users.id, documents.ownerId))
      .where(eq(documents.ownerId, userId))
      .orderBy(desc(documents.updatedAt)),
    db
      .select({ doc: documents, owner, role: documentShares.role })
      .from(documentShares)
      .innerJoin(documents, eq(documents.id, documentShares.documentId))
      .innerJoin(users, eq(users.id, documents.ownerId))
      .where(eq(documentShares.userId, userId))
      .orderBy(desc(documents.updatedAt)),
  ]);

  const summarize = (r: { doc: typeof documents.$inferSelect; owner: DocumentSummary["owner"] }, role: Role): DocumentSummary => ({
    id: r.doc.id,
    title: r.doc.title,
    preview: contentToPlainText(JSON.parse(r.doc.contentJson)),
    updatedAt: r.doc.updatedAt.toISOString(),
    role,
    owner: r.owner,
  });

  return {
    owned: ownedRows.map((r) => summarize(r, "owner")),
    shared: sharedRows.map((r) => summarize(r, r.role)),
  };
}

export async function createDocument(
  userId: string,
  input: { title?: string; content?: unknown } = {},
): Promise<{ id: string }> {
  const contentJson = validateContent(input.content ?? EMPTY_DOC);
  const id = crypto.randomUUID();
  const ts = now();
  await getDb()
    .insert(documents)
    .values({
      id,
      ownerId: userId,
      title: input.title ?? "Untitled document",
      contentJson,
      createdAt: ts,
      updatedAt: ts,
    });
  return { id };
}

export async function getDocument(userId: string, docId: string): Promise<DocumentDetail> {
  return toDetail(await authorize(userId, docId, "read"));
}

export async function updateDocument(
  userId: string,
  docId: string,
  input: { title?: string; content?: unknown },
): Promise<{ updatedAt: string }> {
  await authorize(userId, docId, "edit");
  const patch: Partial<typeof documents.$inferInsert> = { updatedAt: now() };
  if (input.title !== undefined) patch.title = input.title;
  if (input.content !== undefined) patch.contentJson = validateContent(input.content);
  await getDb().update(documents).set(patch).where(eq(documents.id, docId));
  return { updatedAt: patch.updatedAt!.toISOString() };
}

export async function deleteDocument(userId: string, docId: string): Promise<void> {
  await authorize(userId, docId, "delete");
  const db = getDb();
  // Explicit cleanup rather than relying on SQLite FK cascade being enabled.
  await db.batch([
    db.delete(documentShares).where(eq(documentShares.documentId, docId)),
    db.delete(documents).where(eq(documents.id, docId)),
  ]);
}

// ---------------------------------------------------------------- sharing

export async function listCollaborators(userId: string, docId: string): Promise<Collaborator[]> {
  await authorize(userId, docId, "share");
  return getDb()
    .select({ userId: users.id, name: users.name, email: users.email, role: documentShares.role })
    .from(documentShares)
    .innerJoin(users, eq(users.id, documentShares.userId))
    .where(eq(documentShares.documentId, docId))
    .orderBy(users.name);
}

/** Grant (or change) access for the user with `email`. Idempotent. */
export async function shareDocument(
  userId: string,
  docId: string,
  input: { email: string; role: ShareRole },
): Promise<Collaborator> {
  const { doc } = await authorize(userId, docId, "share");
  const db = getDb();
  const target = await db.query.users.findFirst({ where: eq(users.email, input.email) });
  if (!target) throw notFound(`No user found with email ${input.email}.`);
  if (target.id === doc.ownerId) throw badRequest("The owner already has full access.");

  await db
    .insert(documentShares)
    .values({ id: crypto.randomUUID(), documentId: docId, userId: target.id, role: input.role, createdAt: now() })
    .onConflictDoUpdate({
      target: [documentShares.documentId, documentShares.userId],
      set: { role: input.role },
    });

  return { userId: target.id, name: target.name, email: target.email, role: input.role };
}

export async function revokeShare(userId: string, docId: string, targetUserId: string): Promise<void> {
  await authorize(userId, docId, "share");
  await getDb()
    .delete(documentShares)
    .where(and(eq(documentShares.documentId, docId), eq(documentShares.userId, targetUserId)));
}
