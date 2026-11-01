import StarterKit from "@tiptap/starter-kit";

/**
 * Editor schema shared by the browser editor and the server (validation + file import),
 * so a document that passes the server checks always loads in the editor, and the other way round.
 * Placeholder and other UI-only extensions are added on the client only.
 */
export const editorExtensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    link: { openOnClick: false, autolink: true },
  }),
];

export const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] } as const;
