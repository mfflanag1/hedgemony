/**
 * Postgres schema for Hedgemony game persistence.
 *
 * MVP Phase-4c scope: games metadata + snapshot history. Auth / users / full
 * log durability expand this in later phases.
 */
import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  serial,
  index,
} from "drizzle-orm/pg-core";

/**
 * One row per Colyseus room that has ever existed. Row is upserted on first
 * snapshot and updated as the game progresses. `id` matches the Colyseus
 * roomId so lookup-by-URL is direct.
 */
export const games = pgTable(
  "games",
  {
    id: text("id").primaryKey(),
    /** Seed for the server-side RNG; stable for the lifetime of the game. */
    seed: text("seed").notNull(),
    /** lobby | active | paused | ended */
    status: text("status").notNull(),
    turn: integer("turn").notNull(),
    phase: integer("phase").notNull(),
    successorActive: boolean("successor_active").notNull().default(false),
    regime: text("regime").notNull().default("unresolved"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
  },
  (t) => ({
    statusIdx: index("games_status_idx").on(t.status),
    updatedIdx: index("games_updated_idx").on(t.updatedAt),
  })
);

/**
 * Full-state snapshot at a specific turn/phase. New row on every phase
 * transition (debounced). Older snapshots retained for AAR / audit.
 */
export const gameSnapshots = pgTable(
  "game_snapshots",
  {
    id: serial("id").primaryKey(),
    gameId: text("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    turn: integer("turn").notNull(),
    phase: integer("phase").notNull(),
    /** JSON.stringify(state) — consumed by future AAR export and restoration. */
    state: jsonb("state").$type<unknown>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    gameIdx: index("snapshots_game_idx").on(t.gameId),
    gameTurnPhaseIdx: index("snapshots_game_turn_phase_idx").on(
      t.gameId,
      t.turn,
      t.phase
    ),
  })
);

export const classicCards = pgTable(
  "classic_cards",
  {
    id: text("id").primaryKey(),
    card: jsonb("card").$type<unknown>().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    updatedIdx: index("classic_cards_updated_idx").on(t.updatedAt),
  })
);

export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;
export type GameSnapshot = typeof gameSnapshots.$inferSelect;
export type NewGameSnapshot = typeof gameSnapshots.$inferInsert;
export type ClassicCardRow = typeof classicCards.$inferSelect;
export type NewClassicCardRow = typeof classicCards.$inferInsert;
