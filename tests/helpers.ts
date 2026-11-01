import { getDb } from "@/lib/db";
import { runMigrations } from "@/lib/db/migrate";
import { documents, documentShares, users } from "@/lib/db/schema";

let migrated = false;

/** Migrate the in-memory DB once, then wipe all rows. Call in beforeEach. */
export async function resetDb() {
  const db = getDb();
  if (!migrated) {
    await runMigrations(db);
    migrated = true;
  }
  await db.delete(documentShares);
  await db.delete(documents);
  await db.delete(users);
}

export async function createUser(name: string) {
  const user = {
    id: `user_${name}`,
    email: `${name}@test.dev`,
    name: name[0].toUpperCase() + name.slice(1),
    passwordHash: "x",
  };
  await getDb().insert(users).values(user);
  return user;
}

/** Assert a promise rejects with an AppError of the given HTTP status. */
export async function expectStatus(p: Promise<unknown>, status: number) {
  try {
    await p;
  } catch (err) {
    const s = (err as { status?: number }).status;
    if (s === status) return;
    throw new Error(`Expected status ${status}, got ${s ?? "non-AppError"}: ${(err as Error).message}`);
  }
  throw new Error(`Expected status ${status}, but the call succeeded`);
}
