import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Logo } from "@/components/AppHeader";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Log in · Ajaia Docs" };

const DEMO_ACCOUNTS = [
  { email: "alice@ajaia.dev", note: "Owns the sample doc" },
  { email: "bob@ajaia.dev", note: "Editor on the sample doc" },
  { email: "carol@ajaia.dev", note: "Viewer on the sample doc" },
];

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-12">
      <Suspense>
        <RedirectIfLoggedIn />
      </Suspense>
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2 text-xl font-semibold text-slate-900">
          <Logo /> Ajaia Docs
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="mb-1 text-lg font-semibold text-slate-900">Log in</h1>
          <p className="mb-5 text-sm text-slate-500">Use one of the demo accounts below.</p>
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
