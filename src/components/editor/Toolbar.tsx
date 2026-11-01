"use client";

import { useEditorState, type Editor } from "@tiptap/react";

type Btn = {
  label: string;
  shortcut?: string;
  icon: React.ReactNode;
  isActive: (e: Editor) => boolean;
  run: (e: Editor) => void;
};

const B = (d: string) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

const GROUPS: Btn[][] = [
  [
    { label: "Undo", shortcut: "⌘Z", icon: B("M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3"), isActive: () => false, run: (e) => e.chain().focus().undo().run() },
    { label: "Redo", shortcut: "⌘⇧Z", icon: B("m15 14 5-5-5-5M20 9H9a5 5 0 0 0 0 10h3"), isActive: () => false, run: (e) => e.chain().focus().redo().run() },
  ],
  [
    { label: "Bold", shortcut: "⌘B", icon: <b className="text-[15px]">B</b>, isActive: (e) => e.isActive("bold"), run: (e) => e.chain().focus().toggleBold().run() },
    { label: "Italic", shortcut: "⌘I", icon: <i className="font-serif text-[16px]">I</i>, isActive: (e) => e.isActive("italic"), run: (e) => e.chain().focus().toggleItalic().run() },
    { label: "Underline", shortcut: "⌘U", icon: <u className="text-[15px]">U</u>, isActive: (e) => e.isActive("underline"), run: (e) => e.chain().focus().toggleUnderline().run() },
    { label: "Strikethrough", shortcut: "⌘⇧S", icon: <s className="text-[15px]">S</s>, isActive: (e) => e.isActive("strike"), run: (e) => e.chain().focus().toggleStrike().run() },
  ],
  [
    { label: "Bulleted list", shortcut: "⌘⇧8", icon: B("M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"), isActive: (e) => e.isActive("bulletList"), run: (e) => e.chain().focus().toggleBulletList().run() },
    { label: "Numbered list", shortcut: "⌘⇧7", icon: B("M10 6h10M10 12h10M10 18h10M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"), isActive: (e) => e.isActive("orderedList"), run: (e) => e.chain().focus().toggleOrderedList().run() },
    { label: "Quote", icon: B("M3 21c3 0 7-1 7-8V5H3v7h4M14 21c3 0 7-1 7-8V5h-7v7h4"), isActive: (e) => e.isActive("blockquote"), run: (e) => e.chain().focus().toggleBlockquote().run() },
  ],
];

type BlockStyle = "p" | "h1" | "h2" | "h3";

export function Toolbar({ editor }: { editor: Editor }) {
  // Re-render only when the relevant state changes (Tiptap v3 doesn't re-render on every transaction).
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      active: GROUPS.flat().map((b) => b.isActive(e)),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
      block: (e.isActive("heading", { level: 1 })
        ? "h1"
        : e.isActive("heading", { level: 2 })
          ? "h2"
          : e.isActive("heading", { level: 3 })
            ? "h3"
            : "p") as BlockStyle,
    }),
  });

  const setBlock = (v: BlockStyle) => {
    const chain = editor.chain().focus();
    if (v === "p") chain.setParagraph().run();
    else chain.setHeading({ level: Number(v[1]) as 1 | 2 | 3 }).run();
  };

  let i = 0;
  return (
    <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
      {GROUPS.map((group, gi) => (
        <div key={gi} className="flex items-center gap-0.5">
          {gi === 1 && (
            <select
              aria-label="Text style"
              className="mr-1 h-8 rounded-md bg-transparent px-2 text-sm text-slate-700 hover:bg-slate-200 focus:outline-none"
              value={state.block}
              onChange={(e) => setBlock(e.target.value as BlockStyle)}
            >
              <option value="p">Normal text</option>
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
            </select>
          )}
          {group.map((b) => {
            const idx = i++;
            const active = state.active[idx];
            const disabled = (b.label === "Undo" && !state.canUndo) || (b.label === "Redo" && !state.canRedo);
            return (
              <button
                key={b.label}
                type="button"
                title={b.shortcut ? `${b.label} (${b.shortcut})` : b.label}
                aria-label={b.label}
                aria-pressed={active}
                disabled={disabled}
                // Keep focus + selection in the document: without this, the button takes focus and
                // keystrokes typed right after a click land on the button (Space would re-toggle it).
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => b.run(editor)}
                className={`grid h-8 w-8 place-items-center rounded-md text-slate-700 transition hover:bg-slate-200 disabled:opacity-35 disabled:hover:bg-transparent ${
                  active ? "bg-blue-100 text-blue-700 hover:bg-blue-100" : ""
                }`}
              >
                {b.icon}
              </button>
            );
          })}
          {gi < GROUPS.length - 1 && <span className="mx-1 h-5 w-px bg-slate-300" />}
        </div>
      ))}
    </div>
  );
}
