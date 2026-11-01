/** Trigger a browser download of a Markdown file named after the document. */
export function downloadMarkdown(title: string, markdown: string) {
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/[^\w\- ]+/g, "").trim() || "document"}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
