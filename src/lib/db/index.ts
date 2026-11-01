import { createClient } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

export type DB = LibSQLDatabase<typeof schema>;

/**
 * One libSQL client per process.
 * - Local dev: DATABASE_URL defaults to a SQLite file (file:local.db), so there is nothing to set up.
 * - Production: DATABASE_URL=libsql://<db>.turso.io plus DATABASE_AUTH_TOKEN.
 * - Tests: DATABASE_URL=":memory:" (see vitest.setup.ts).
 */
const globalForDb = globalThis as unknown as { __db?: DB };

export function createDb(url = process.env.DATABASE_URL ?? "file:local.db"): DB {
  const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
  return drizzle(client, { schema });
}

export function getDb(): DB {
  if (!globalForDb.__db) globalForDb.__db = createDb();
  return globalForDb.__db;
}

export { schema };
