"use client";

import { useEditorState, type Editor } from "@tiptap/react";
import { Icon } from "../Icon";

type Btn = {
  label: string;
  shortcut?: string;
  icon: string;
  isActive?: (e: Editor) => boolean;
  run: (e: Editor) => void;
};

const MARKS: Btn[] = [
  { label: "Bold", shortcut: "⌘B", icon: "format_bold", isActive: (e) => e.isActive("bold"), run: (e) => e.chain().focus().toggleBold().run() },
  { label: "Italic", shortcut: "⌘I", icon: "format_italic", isActive: (e) => e.isActive("italic"), run: (e) => e.chain().focus().toggleItalic().run() },
  { label: "Underline", shortcut: "⌘U", icon: "format_underlined", isActive: (e) => e.isActive("underline"), run: (e) => e.chain().focus().toggleUnderline().run() },
  { label: "Strikethrough", shortcut: "⌘⇧S", icon: "strikethrough_s", isActive: (e) => e.isActive("strike"), run: (e) => e.chain().focus().toggleStrike().run() },
  { label: "Inline code", shortcut: "⌘E", icon: "code", isActive: (e) => e.isActive("code"), run: (e) => e.chain().focus().toggleCode().run() },
  { label: "Link", icon: "link", isActive: (e) => e.isActive("link"), run: toggleLink },
];

const BLOCKS: Btn[] = [
  { label: "Bulleted list", shortcut: "⌘⇧8", icon: "format_list_bulleted", isActive: (e) => e.isActive("bulletList"), run: (e) => e.chain().focus().toggleBulletList().run() },
  { label: "Numbered list", shortcut: "⌘⇧7", icon: "format_list_numbered", isActive: (e) => e.isActive("orderedList"), run: (e) => e.chain().focus().toggleOrderedList().run() },
  { label: "Quote", shortcut: "⌘⇧B", icon: "format_quote", isActive: (e) => e.isActive("blockquote"), run: (e) => e.chain().focus().toggleBlockquote().run() },
  { label: "Code block", shortcut: "⌘⌥C", icon: "terminal", isActive: (e) => e.isActive("codeBlock"), run: (e) => e.chain().focus().toggleCodeBlock().run() },
  { label: "Divider", icon: "horizontal_rule", run: (e) => e.chain().focus().setHorizontalRule().run() },
];

const HISTORY: Btn[] = [
  { label: "Undo", shortcut: "⌘Z", icon: "undo", run: (e) => e.chain().focus().undo().run() },
  { label: "Redo", shortcut: "⌘⇧Z", icon: "redo", run: (e) => e.chain().focus().redo().run() },
];

function toggleLink(e: Editor) {
  if (e.isActive("link")) {
    e.chain().focus().extendMarkRange("link").unsetLink().run();
    return;
  }
  const url = window.prompt("Link URL (https://…)", "https://");
  if (!url || url === "https://") return;
  if (!/^(https?:\/\/|mailto:)/i.test(url)) {
    window.alert("Links must start with https://, http:// or mailto:");
    return;
  }
  e.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
}

type BlockStyle = "p" | "h1" | "h2" | "h3";

export function Toolbar({ editor }: { editor: Editor }) {
  // Re-render only when the relevant state changes (Tiptap v3 doesn't re-render on every transaction).
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      marks: MARKS.map((b) => b.isActive?.(e) ?? false),
      blocks: BLOCKS.map((b) => b.isActive?.(e) ?? false),
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

  return (
    <div role="toolbar" aria-label="Formatting" className="flex items-center gap-1 overflow-x-auto">
      <Group>
        <ToolButton btn={HISTORY[0]} editor={editor} disabled={!state.canUndo} />
        <ToolButton btn={HISTORY[1]} editor={editor} disabled={!state.canRedo} />
      </Group>
      <Divider />
      <label className="relative shrink-0">
        <span className="sr-only">Text style</span>
        <select
          aria-label="Text style"
          className="h-7 cursor-pointer appearance-none rounded-md bg-transparent pr-7 pl-2 font-display text-[13px] font-medium text-on-surface outline-none hover:bg-surface-container-low focus-visible:ring-2 focus-visible:ring-primary-container/40"
          value={state.block}
          onChange={(e) => setBlock(e.target.value as BlockStyle)}
        >
          <option value="p">Normal text</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>
        <Icon name="expand_more" className="pointer-events-none absolute top-1.5 right-1.5 text-[16px] text-on-surface-variant" />
      </label>
      <Divider />
      <Group>
        {MARKS.map((b, i) => (
          <ToolButton key={b.label} btn={b} editor={editor} active={state.marks[i]} />
        ))}
      </Group>
      <Divider />
      <Group>
        {BLOCKS.map((b, i) => (
          <ToolButton key={b.label} btn={b} editor={editor} active={state.blocks[i]} />
        ))}
      </Group>
    </div>
  );
}

function ToolButton({ btn, editor, active = false, disabled = false }: { btn: Btn; editor: Editor; active?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      title={btn.shortcut ? `${btn.label} (${btn.shortcut})` : btn.label}
      aria-label={btn.label}
      aria-pressed={btn.isActive ? active : undefined}
      disabled={disabled}
      // Keep focus + selection in the document: without this, the button takes focus and
      // keystrokes typed right after a click land on the button (Space would re-toggle it).
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => btn.run(editor)}
      className={`grid h-7 w-7 shrink-0 place-items-center rounded-md transition-colors disabled:opacity-35 disabled:hover:bg-transparent ${
        active ? "bg-surface-container text-primary" : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
      }`}
    >
      <Icon name={btn.icon} className="text-[18px]" />
    </button>
  );
}

const Group = ({ children }: { children: React.ReactNode }) => <div className="flex shrink-0 items-center gap-0.5">{children}</div>;
const Divider = () => <span className="mx-1 h-4 w-px shrink-0 bg-outline-variant/50" />;
