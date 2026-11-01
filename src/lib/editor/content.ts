import { getSchema, type JSONContent } from "@tiptap/core";
import { Node as PMNode } from "@tiptap/pm/model";
import { badRequest, AppError } from "../errors";
import { editorExtensions } from "./extensions";

export const MAX_CONTENT_BYTES = 1_000_000; // 1 MB of serialized JSON

let cachedSchema: ReturnType<typeof getSchema> | null = null;
const schema = () => (cachedSchema ??= getSchema(editorExtensions));

/**
 * Validate untrusted editor JSON against the real editor schema.
 * Rejects unknown node/mark types and invalid nesting, so we never store a document
 * the editor can't open. Returns the serialized JSON to store.
 */
export function validateContent(content: unknown): string {
  const serialized = JSON.stringify(content);
  if (serialized === undefined) throw badRequest("Document content is missing.");
  if (Buffer.byteLength(serialized, "utf8") > MAX_CONTENT_BYTES) {
    throw new AppError(413, "Document is too large (max 1 MB).");
  }
  try {
    const node = PMNode.fromJSON(schema(), content as JSONContent);
    node.check();
    if (node.type.name !== "doc") throw new Error("root must be doc");
  } catch {
    throw badRequest("Document content is not valid.");
  }
  return serialized;
}

/** Plain-text preview for the dashboard list. */
export function contentToPlainText(content: JSONContent, maxLen = 140): string {
  const parts: string[] = [];
  const walk = (n: JSONContent) => {
    if (n.text) parts.push(n.text);
    n.content?.forEach(walk);
    if (n.type && n.type !== "text" && n.type !== "doc") parts.push(" ");
  };
  walk(content);
  const text = parts.join("").replace(/\s+/g, " ").trim();
  return text.length > maxLen ? text.slice(0, maxLen - 1) + "…" : text;
}
