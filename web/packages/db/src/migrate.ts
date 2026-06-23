/**
 * Run pending SQL migrations against the configured Postgres instance.
 * Invoke via `pnpm --filter @hedgemony/db migrate`.
 */
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { getDb, closeDb } from "./client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MIGRATIONS_DIR = resolve(__dirname, "../migrations");

async function main() {
  const db = getDb();
  if (!db) {
    console.error("[migrate] DATABASE_URL not set or connection failed");
    process.exit(1);
  }
  console.log(`[migrate] running migrations from ${MIGRATIONS_DIR}`);
  await migrate(db, { migrationsFolder: MIGRATIONS_DIR });
  console.log("[migrate] done");
  await closeDb();
}

main().catch((err) => {
  console.error("[migrate] failed:", err);
  process.exit(1);
});
