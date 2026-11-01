import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { JSONContent } from "@tiptap/core";
import { importFile } from "@/lib/import";
import { validateContent } from "@/lib/editor/content";
import { expectStatus } from "./helpers";

const fixture = (name: string) => readFileSync(path.join(__dirname, "fixtures", name));

/** Collect node types and mark types used anywhere in the doc. */
function inventory(doc: JSONContent) {
  const nodes = new Set<string>();
  const marks = new Set<string>();
  const walk = (n: JSONContent) => {
    if (n.type) nodes.add(n.type);
    n.marks?.forEach((m) => marks.add(m.type));
    n.content?.forEach(walk);
  };
  walk(doc);
  return { nodes, marks, json: JSON.stringify(doc) };
}

describe("file import", () => {
  it("imports Markdown with headings, lists and inline formatting", async () => {
    const { title, content } = await importFile("project-brief.md", fixture("sample.md"));
    expect(title).toBe("project brief");
    const { nodes, marks } = inventory(content);
    expect(content.content?.[0]).toMatchObject({ type: "heading", attrs: { level: 1 } });
    expect([...nodes]).toEqual(expect.arrayContaining(["heading", "bulletList", "orderedList", "listItem"]));
    expect([...marks]).toEqual(expect.arrayContaining(["bold", "italic"]));
    expect(() => validateContent(content)).not.toThrow();
  });

  it("strips scripts and unknown HTML from Markdown (schema acts as sanitizer)", async () => {
    const { content } = await importFile("x.md", fixture("sample.md"));
    const { nodes, json } = inventory(content);
    expect(nodes.has("image")).toBe(false);
    expect(json).not.toContain("onerror");
    expect(json).not.toContain("<script");
  });

  it("imports a real .docx file, keeping heading, bold, italic and underline", async () => {
    const { title, content } = await importFile("Quarterly.docx", fixture("sample.docx"));
    expect(title).toBe("Quarterly");
    expect(content.content?.[0]).toMatchObject({
      type: "heading",
      attrs: { level: 1 },
      content: [{ type: "text", text: "Quarterly Plan" }],
    });
    const { marks } = inventory(content);
    expect([...marks]).toEqual(expect.arrayContaining(["bold", "italic", "underline"]));
    expect(() => validateContent(content)).not.toThrow();
  });

  it("imports plain text as paragraphs with line breaks", async () => {
    const { content } = await importFile("notes.txt", Buffer.from("Line one\nLine two\n\nSecond para\r\n"));
    expect(content).toEqual({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Line one" }, { type: "hardBreak" }, { type: "text", text: "Line two" }],
        },
        { type: "paragraph", content: [{ type: "text", text: "Second para" }] },
      ],
    });
  });

  it("rejects unsupported, empty, oversized and fake files", async () => {
    await expectStatus(importFile("photo.png", Buffer.from("x")), 415);
    await expectStatus(importFile("empty.txt", Buffer.alloc(0)), 400);
    await expectStatus(importFile("big.txt", Buffer.alloc(2 * 1024 * 1024 + 1, "a")), 413);
    await expectStatus(importFile("fake.docx", Buffer.from("not a zip")), 400);
  });
});
