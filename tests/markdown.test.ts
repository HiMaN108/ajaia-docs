import { describe, expect, it } from "vitest";
import { docToMarkdown } from "@/lib/editor/markdown";
import { importFile } from "@/lib/import";

const t = (text: string, ...marks: string[]) =>
  marks.length ? { type: "text", text, marks: marks.map((type) => ({ type })) } : { type: "text", text };
const p = (...content: object[]) => ({ type: "paragraph", content });
const li = (...content: object[]) => ({ type: "listItem", content });

describe("docToMarkdown", () => {
  it("serializes headings, marks and lists", () => {
    const md = docToMarkdown({
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [t("Plan")] },
        p(t("a "), t("bold", "bold"), t(" "), t("it", "italic"), t(" "), t("u", "underline"), t(" 2*3")),
        { type: "bulletList", content: [li(p(t("one")), { type: "bulletList", content: [li(p(t("nested")))] }), li(p(t("two")))] },
        { type: "orderedList", attrs: { start: 1 }, content: [li(p(t("first"))), li(p(t("second")))] },
      ],
    });
    expect(md).toBe(
      ["## Plan", "", "a **bold** *it* <u>u</u> 2\\*3", "", "- one", "  - nested", "- two", "", "1. first", "2. second", ""].join("\n"),
    );
  });

  it("round-trips through Markdown import", async () => {
    const original = {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 1 }, content: [t("Title")] },
        p(t("Some "), t("bold", "bold"), t(" text")),
        { type: "bulletList", content: [li(p(t("x"))), li(p(t("y")))] },
      ],
    };
    const { content } = await importFile("rt.md", Buffer.from(docToMarkdown(original)));
    expect(content).toMatchObject(original);
  });
});
