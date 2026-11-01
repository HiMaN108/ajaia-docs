/**
 * Every Material Symbols glyph the app renders. The Google Fonts request is subset to
 * exactly these names (much smaller download). tests/icons.test.ts fails if a component
 * uses an icon that is missing here.
 */
export const ICON_NAMES = [
  "add", "arrow_back", "arrow_forward", "article", "auto_awesome", "check", "check_circle", "close",
  "cloud_upload", "code", "code_blocks", "dashboard", "delete", "delete_forever", "description", "done",
  "download", "edit", "edit_note", "error", "expand_more", "folder_open", "folder_shared", "format_bold",
  "format_italic", "format_list_bulleted", "format_list_numbered", "format_quote", "format_size",
  "format_underlined", "fullscreen", "fullscreen_exit", "grid_view", "group", "group_add", "history",
  "horizontal_rule", "info", "link", "lock", "logout", "note_stack", "person_add", "progress_activity",
  "redo", "schedule", "search", "search_off", "settings", "shield_person", "straighten", "strikethrough_s",
  "sync", "terminal", "tune", "undo", "update", "upload_file", "view_list", "visibility", "warning",
] as const;

// Google Fonts requires icon_names to be sorted alphabetically.
export const ICON_FONT_URL =
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..24,400,0..1,0&icon_names=" +
  [...ICON_NAMES].sort().join(",") +
  "&display=block";
