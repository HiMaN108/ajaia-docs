import type { JSONContent } from "@tiptap/core";

/** Word / character counts and reading time for the editor status bar and settings page. */
export function textStats(text: string) {
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  return {
    words,
    characters: text.replace(/\n/g, "").length, // line breaks between blocks don't count
    readMinutes: Math.max(1, Math.ceil(words / 200)),
  };
}

/** Plain text of a stored document, with blocks separated by newlines (same counts as Tiptap's getText). */
export function docToText(node: JSONContent): string {
  if (node.type === "text") return node.text ?? "";
  if (node.type === "hardBreak") return "\n";
  const children = node.content ?? [];
  const inline = children.every((c) => c.type === "text" || c.type === "hardBreak");
  return children.map(docToText).join(inline ? "" : "\n");
}
