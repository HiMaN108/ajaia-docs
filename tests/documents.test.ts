import { beforeEach, describe, expect, it } from "vitest";
import {
  createDocument,
  deleteDocument,
  getDocument,
  listCollaborators,
  listDocuments,
  revokeShare,
  shareDocument,
  updateDocument,
} from "@/lib/documents";
import { createUser, expectStatus, resetDb } from "./helpers";

const richDoc = {
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Plan" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Ship " },
        { type: "text", marks: [{ type: "bold" }, { type: "underline" }], text: "today" },
      ],
    },
    {
      type: "bulletList",
      content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "one" }] }] }],
    },
  ],
};

let alice: Awaited<ReturnType<typeof createUser>>;
let bob: typeof alice;
let carol: typeof alice;

beforeEach(async () => {
  await resetDb();
  alice = await createUser("alice");
  bob = await createUser("bob");
  carol = await createUser("carol");
});

describe("documents: create, edit, persist", () => {
  it("creates an untitled empty doc owned by the creator", async () => {
    const { id } = await createDocument(alice.id);
    const doc = await getDocument(alice.id, id);
    expect(doc.title).toBe("Untitled document");
    expect(doc.role).toBe("owner");
    expect(doc.content).toEqual({ type: "doc", content: [{ type: "paragraph" }] });
  });

  it("round-trips rich formatting exactly and renames", async () => {
    const { id } = await createDocument(alice.id);
    await updateDocument(alice.id, id, { title: "Q3 Plan", content: richDoc });
    const doc = await getDocument(alice.id, id);
    expect(doc.title).toBe("Q3 Plan");
    expect(doc.content).toEqual(richDoc);
    expect(doc.preview).toContain("Plan");
  });

  it("rejects content that doesn't match the editor schema", async () => {
    const { id } = await createDocument(alice.id);
    await expectStatus(updateDocument(alice.id, id, { content: { type: "doc", content: [{ type: "script" }] } }), 400);
    await expectStatus(updateDocument(alice.id, id, { content: "<p>html string</p>" }), 400);
    // Text directly under doc is invalid nesting.
    await expectStatus(updateDocument(alice.id, id, { content: { type: "doc", content: [{ type: "text", text: "x" }] } }), 400);
  });
});

describe("sharing and access control", () => {
  it("separates owned and shared documents in the dashboard list", async () => {
    const { id } = await createDocument(alice.id, { title: "Alice's doc" });
    await createDocument(bob.id, { title: "Bob's doc" });
    await shareDocument(alice.id, id, { email: bob.email, role: "viewer" });

    const bobs = await listDocuments(bob.id);
    expect(bobs.owned.map((d) => d.title)).toEqual(["Bob's doc"]);
    expect(bobs.shared).toHaveLength(1);
    expect(bobs.shared[0]).toMatchObject({ title: "Alice's doc", role: "viewer", owner: { email: alice.email } });

    expect((await listDocuments(carol.id)).shared).toHaveLength(0);
  });

  it("full flow: share as viewer → upgrade to editor → revoke", async () => {
    const { id } = await createDocument(alice.id, { title: "Spec" });

    // Before sharing, Bob can't even see the doc (404, not 403, so its existence isn't revealed).
    await expectStatus(getDocument(bob.id, id), 404);

    await shareDocument(alice.id, id, { email: bob.email, role: "viewer" });
    expect((await getDocument(bob.id, id)).role).toBe("viewer");
    await expectStatus(updateDocument(bob.id, id, { title: "hacked" }), 403);

    await shareDocument(alice.id, id, { email: bob.email, role: "editor" }); // upsert, no duplicate
    expect(await listCollaborators(alice.id, id)).toHaveLength(1);
    await updateDocument(bob.id, id, { content: richDoc });
    expect((await getDocument(alice.id, id)).content).toEqual(richDoc);

    // Editors still can't share, list collaborators or delete.
    await expectStatus(shareDocument(bob.id, id, { email: carol.email, role: "editor" }), 403);
    await expectStatus(listCollaborators(bob.id, id), 403);
    await expectStatus(deleteDocument(bob.id, id), 403);

    await revokeShare(alice.id, id, bob.id);
    await expectStatus(getDocument(bob.id, id), 404);
  });

  it("validates share targets", async () => {
    const { id } = await createDocument(alice.id);
    await expectStatus(shareDocument(alice.id, id, { email: "nobody@test.dev", role: "viewer" }), 404);
    await expectStatus(shareDocument(alice.id, id, { email: alice.email, role: "viewer" }), 400);
  });

  it("strangers get 404 for every operation", async () => {
    const { id } = await createDocument(alice.id);
    await expectStatus(getDocument(carol.id, id), 404);
    await expectStatus(updateDocument(carol.id, id, { title: "x" }), 404);
    await expectStatus(deleteDocument(carol.id, id), 404);
    await expectStatus(shareDocument(carol.id, id, { email: bob.email, role: "editor" }), 404);
  });

  it("deleting a document removes it for collaborators too", async () => {
    const { id } = await createDocument(alice.id);
    await shareDocument(alice.id, id, { email: bob.email, role: "editor" });
    await deleteDocument(alice.id, id);
    expect((await listDocuments(bob.id)).shared).toHaveLength(0);
    await expectStatus(getDocument(alice.id, id), 404);
  });
});
