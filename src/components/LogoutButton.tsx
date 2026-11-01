"use client";

import { api } from "@/lib/client";

export function LogoutButton() {
  return (
    <button
      className="btn-ghost text-sm"
      onClick={async () => {
        await api("/api/auth/logout", { method: "POST" }).catch(() => {});
// Full reload on purpose: auth changed, so drop all client-side cached server state.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/login";
      }}
    >
      Log out
    </button>
  );
}
