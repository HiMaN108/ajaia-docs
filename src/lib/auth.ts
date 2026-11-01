import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getDb } from "./db";
import { users } from "./db/schema";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession, verifySession } from "./session";
import { unauthorized } from "./errors";

export type SessionUser = { id: string; email: string; name: string };

/** Current user from the session cookie, or null. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const userId = await verifySession(token);
  if (!userId) return null;
  const user = await getDb().query.users.findFirst({ where: eq(users.id, userId) });
  return user ? { id: user.id, email: user.email, name: user.name } : null;
}

/** For API routes: current user or a 401. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw unauthorized();
  return user;
}

let dummyHash: string | undefined;

export async function verifyCredentials(email: string, password: string): Promise<SessionUser | null> {
  const user = await getDb().query.users.findFirst({ where: eq(users.email, email) });
  // Compare anyway when the user is unknown, so response timing doesn't reveal which emails exist.
  const hash = user?.passwordHash ?? (dummyHash ??= bcrypt.hashSync("not-a-real-password", 10));
  const ok = await bcrypt.compare(password, hash);
  return user && ok ? { id: user.id, email: user.email, name: user.name } : null;
}

export async function startSession(userId: string) {
  (await cookies()).set(SESSION_COOKIE, await signSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}
