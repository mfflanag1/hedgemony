/**
 * Lazily-initialized Drizzle client. Engine code calls `getDb()` to fetch
 * the shared connection pool; returns null if DATABASE_URL is unset or the
 * connection fails, so the engine can run without Postgres during
 * early-dev and fallback to in-memory-only.
 */
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import * as schema from "./schema";

export type DrizzleClient = NodePgDatabase<typeof schema>;

let _db: DrizzleClient | null = null;
let _pool: pkg.Pool | null = null;
let _tried = false;

export function getDb(): DrizzleClient | null {
  if (_db || _tried) return _db;
  _tried = true;

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn(
      "[db] DATABASE_URL not set — persistence disabled. Set DATABASE_URL or use `docker compose up postgres`."
    );
    return null;
  }

  try {
    _pool = new Pool({ connectionString: url, max: 10 });
    _pool.on("error", (err) => {
      console.error("[db] pool error:", err.message);
    });
    _db = drizzle(_pool, { schema });
    console.log(`[db] connected to ${redactedUrl(url)}`);
    return _db;
  } catch (err) {
    console.error("[db] connection failed:", (err as Error).message);
    return null;
  }
}

export async function closeDb(): Promise<void> {
  if (_pool) {
    await _pool.end();
    _pool = null;
    _db = null;
    _tried = false;
  }
}

function redactedUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.password) u.password = "***";
    return u.toString();
  } catch {
    return "<unparseable-url>";
  }
}

export { schema };
