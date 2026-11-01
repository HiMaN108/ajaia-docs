import type { JSONContent } from "@tiptap/core";
import { generateJSON } from "@tiptap/html/server";
import mammoth from "mammoth";
import { marked } from "marked";
import { AppError, badRequest } from "./errors";
import { editorExtensions } from "./editor/extensions";

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2 MB
export const SUPPORTED_EXTENSIONS = [".txt", ".md", ".docx"] as const;
type Ext = (typeof SUPPORTED_EXTENSIONS)[number];

export type ImportResult = { title: string; content: JSONContent };

function extensionOf(filename: string): Ext | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".markdown")) return ".md";
  return SUPPORTED_EXTENSIONS.find((e) => lower.endsWith(e)) ?? null;
}

function titleFromFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  return (base || "Imported document").slice(0, 200);
}

/** Plain text → paragraphs (blank line = new paragraph, single newline = line break). */
export function textToDoc(text: string): JSONContent {
  const paragraphs = text
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.replace(/^\n+|\n+$/g, ""))
    .filter((p) => p.trim().length > 0);

  if (paragraphs.length === 0) return { type: "doc", content: [{ type: "paragraph" }] };

  return {
    type: "doc",
    content: paragraphs.map((p) => {
      const content: JSONContent[] = [];
      p.split("\n").forEach((line, i) => {
        if (i > 0) content.push({ type: "hardBreak" });
        if (line) content.push({ type: "text", text: line });
      });
      return { type: "paragraph", content };
    }),
  };
}

/**
 * HTML → editor JSON. Parsing through the editor schema is also our sanitizer: anything the
 * schema doesn't know (scripts, styles, iframes, images, unknown attributes) is dropped.
 */
export function htmlToDoc(html: string): JSONContent {
  return generateJSON(html, editorExtensions);
}

/**
 * Turn an uploaded file into a new editable document.
 * Supported: .txt, .md (.markdown), .docx — max 2 MB.
 */
export async function importFile(filename: string, data: Buffer): Promise<ImportResult> {
  const ext = extensionOf(filename);
  if (!ext) {
    throw new AppError(415, "Unsupported file type. Please upload a .txt, .md or .docx file.");
  }
  if (data.byteLength === 0) throw badRequest("The file is empty.");
  if (data.byteLength > MAX_UPLOAD_BYTES) throw new AppError(413, "File is too large (max 2 MB).");

  const title = titleFromFilename(filename);

  switch (ext) {
    case ".txt":
      return { title, content: textToDoc(data.toString("utf8")) };

    case ".md": {
      const html = await marked.parse(data.toString("utf8"), { gfm: true });
      return { title, content: htmlToDoc(html) };
    }

    case ".docx": {
      // .docx is a zip archive: check the magic bytes before handing it to mammoth.
      if (data[0] !== 0x50 || data[1] !== 0x4b) {
        throw badRequest("This doesn't look like a valid .docx file.");
      }
      try {
        const { value: html } = await mammoth.convertToHtml(
          { buffer: data },
          { styleMap: ["u => u"] }, // mammoth drops underline by default
        );
        return { title, content: htmlToDoc(html) };
      } catch {
        throw badRequest("Couldn't read this .docx file. It may be corrupted.");
      }
    }
  }
}
