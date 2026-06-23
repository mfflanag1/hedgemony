import type { Config } from "drizzle-kit";

/**
 * Drizzle ORM configuration. Reads DATABASE_URL from the environment,
 * defaults to the docker-compose dev instance if not set.
 */
const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgres://hedgemony:hedgemony_dev@localhost:5432/hedgemony";

export default {
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: DATABASE_URL,
  },
  verbose: true,
  strict: true,
} satisfies Config;
