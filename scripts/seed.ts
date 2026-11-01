/**
 * Applies migrations and seeds demo users plus one shared sample document.
 * Safe to run more than once: users are upserted, the sample doc is created only once.
 *
 *   npm run db:setup
 */
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { createDb } from "../src/lib/db";
import { runMigrations } from "../src/lib/db/migrate";
import { documents, documentShares, users } from "../src/lib/db/schema";

export const DEMO_PASSWORD = "demo1234";
export const DEMO_USERS = [
  { id: "user_alice", email: "alice@ajaia.dev", name: "Alice Owner" },
  { id: "user_bob", email: "bob@ajaia.dev", name: "Bob Editor" },
  { id: "user_carol", email: "carol@ajaia.dev", name: "Carol Viewer" },
];

const sampleContent = {
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Welcome to Ajaia Docs" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "This document is owned by " },
        { type: "text", marks: [{ type: "bold" }], text: "Alice" },
        { type: "text", text: ", shared with Bob as an " },
        { type: "text", marks: [{ type: "italic" }], text: "editor" },
        { type: "text", text: " and with Carol as a " },
        { type: "text", marks: [{ type: "underline" }], text: "viewer" },
        { type: "text", text: "." },
      ],
    },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Try this" }] },
    {
      type: "orderedList",
      attrs: { start: 1 },
      content: [
        "Log in as Bob and edit this document",
        "Log in as Carol: the editor is read-only",
        "Log in as Alice and change who has access",
      ].map((text) => ({
        type: "listItem",
        content: [{ type: "paragraph", content: [{ type: "text", text }] }],
      })),
    },
  ],
};

async function main() {
  const db = createDb();
  await runMigrations(db);

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  for (const u of DEMO_USERS) {
    await db
      .insert(users)
      .values({ ...u, passwordHash })
      .onConflictDoUpdate({ target: users.email, set: { name: u.name, passwordHash } });
  }

  const existing = await db.query.documents.findFirst({ where: eq(documents.id, "doc_welcome") });
  if (!existing) {
    const ts = new Date();
    await db.insert(documents).values({
      id: "doc_welcome",
      ownerId: "user_alice",
      title: "Welcome to Ajaia Docs",
      contentJson: JSON.stringify(sampleContent),
      createdAt: ts,
      updatedAt: ts,
    });
    await db.insert(documentShares).values([
      { id: crypto.randomUUID(), documentId: "doc_welcome", userId: "user_bob", role: "editor", createdAt: ts },
      { id: crypto.randomUUID(), documentId: "doc_welcome", userId: "user_carol", role: "viewer", createdAt: ts },
    ]);
  }

  console.log(`✓ Database ready. Demo users (password "${DEMO_PASSWORD}"):`);
  DEMO_USERS.forEach((u) => console.log(`  - ${u.email}`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
