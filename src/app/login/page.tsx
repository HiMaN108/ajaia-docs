import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/shell/Logo";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Log in · Ajaia Docs" };

const DEMO_ACCOUNTS = [
  { email: "alice@ajaia.dev", name: "Alice Owner", note: "Owns the sample doc" },
  { email: "bob@ajaia.dev", name: "Bob Editor", note: "Can edit the sample doc" },
  { email: "carol@ajaia.dev", name: "Carol Viewer", note: "Can only view it" },
];

const FEATURES = [
  { icon: "edit_note", text: "Rich-text editing with autosave" },
  { icon: "upload_file", text: "Import .txt, .md and .docx files" },
  { icon: "group_add", text: "Share as Viewer or Editor" },
];

export default function LoginPage() {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-12">
      <Suspense>
        <RedirectIfLoggedIn />
      </Suspense>
      <div className="pointer-events-none absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-primary-fixed opacity-60 blur-3xl" />
      <div className="pointer-events-none absolute right-1/4 -bottom-32 h-80 w-80 rounded-full bg-secondary-container opacity-60 blur-3xl" />

      <div className="relative grid w-full max-w-4xl grid-cols-1 items-center gap-10 md:grid-cols-2">
        <div className="hidden md:block">
          <Logo />
          <h1 className="mt-8 font-display text-4xl font-semibold tracking-tight text-on-surface">Write, import and share documents with your team.</h1>
          <ul className="mt-6 space-y-3">
            {FEATURES.map((f) => (
              <li key={f.text} className="flex items-center gap-3 text-sm text-on-surface-variant">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-container-lowest text-primary shadow-card">
                  <Icon name={f.icon} className="text-[18px]" />
                </span>
                {f.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-6 sm:p-8">
          <div className="mb-6 md:hidden">
            <Logo />
          </div>
          <h2 className="font-display text-xl font-semibold text-on-surface">Log in</h2>
          <p className="mt-1 mb-6 text-sm text-on-surface-variant">Pick a demo account, or enter its email and password.</p>
          <LoginForm demoAccounts={DEMO_ACCOUNTS} />
        </div>
      </div>
    </main>
  );
}

async function RedirectIfLoggedIn() {
  if (await getCurrentUser()) redirect("/");
  return null;
}
