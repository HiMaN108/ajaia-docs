import path from "node:path";
import { migrate } from "drizzle-orm/libsql/migrator";
import type { DB } from "./index";

export async function runMigrations(db: DB) {
  await migrate(db, { migrationsFolder: path.resolve(process.cwd(), "drizzle") });
}
