import type { JSONContent } from "@tiptap/core";

/**
 * Editor JSON → Markdown (GFM). Pure function, used by "Download .md".
 * Markdown has no underline, so underline becomes <u>…</u>, which GitHub and most renderers support.
 */
export function docToMarkdown(doc: JSONContent): string {
  return blocks(doc.content ?? [], "").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

function blocks(nodes: JSONContent[], indent: string): string {
  return nodes.map((n) => block(n, indent)).join("");
}

function block(node: JSONContent, indent: string): string {
  const children = node.content ?? [];
  switch (node.type) {
    case "heading":
      return `${indent}${"#".repeat(node.attrs?.level ?? 1)} ${inline(children)}\n\n`;
    case "paragraph":
      return `${indent}${inline(children)}\n\n`;
    case "bulletList":
      return list(children, indent, () => "- ") + "\n";
    case "orderedList": {
      const start = Number(node.attrs?.start ?? 1);
      return list(children, indent, (i) => `${start + i}. `) + "\n";
    }
    case "blockquote":
      return (
        blocks(children, "")
          .trim()
          .split("\n")
          .map((line) => `${indent}> ${line}`.trimEnd())
          .join("\n") + "\n\n"
      );
    case "codeBlock":
      return `${indent}\`\`\`${node.attrs?.language ?? ""}\n${children.map((c) => c.text ?? "").join("")}\n${indent}\`\`\`\n\n`;
    case "horizontalRule":
      return `${indent}---\n\n`;
    default:
      return blocks(children, indent);
  }
}

function list(items: JSONContent[], indent: string, marker: (i: number) => string): string {
  return items
    .map((item, i) => {
      const m = marker(i);
      const pad = indent + " ".repeat(m.length);
      const [first, ...rest] = item.content ?? [];
      const head = first?.type === "paragraph" ? inline(first.content ?? []) : "";
      const tail = (first?.type === "paragraph" ? rest : item.content ?? [])
        .map((c) => block(c, pad).replace(/\n+$/, ""))
        .filter(Boolean);
      return [`${indent}${m}${head}`, ...tail].join("\n");
    })
    .join("\n") + "\n";
}

const escape = (text: string) => text.replace(/([\\`*_[\]<>])/g, "\\$1");

function inline(nodes: JSONContent[]): string {
  return nodes
    .map((n) => {
      if (n.type === "hardBreak") return "  \n";
      if (n.type !== "text" || !n.text) return "";
      const marks = n.marks ?? [];
      const has = (t: string) => marks.some((m) => m.type === t);
      let out = has("code") ? `\`${n.text}\`` : escape(n.text);
      if (has("bold")) out = `**${out}**`;
      if (has("italic")) out = `*${out}*`;
      if (has("strike")) out = `~~${out}~~`;
      if (has("underline")) out = `<u>${out}</u>`;
      const link = marks.find((m) => m.type === "link");
      if (link?.attrs?.href) out = `[${out}](${link.attrs.href})`;
      return out;
    })
    .join("");
}
