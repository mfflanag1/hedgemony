CREATE TABLE IF NOT EXISTS "game_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" text NOT NULL,
	"turn" integer NOT NULL,
	"phase" integer NOT NULL,
	"state" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "games" (
	"id" text PRIMARY KEY NOT NULL,
	"seed" text NOT NULL,
	"status" text NOT NULL,
	"turn" integer NOT NULL,
	"phase" integer NOT NULL,
	"successor_active" boolean DEFAULT false NOT NULL,
	"regime" text DEFAULT 'unresolved' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "game_snapshots" ADD CONSTRAINT "game_snapshots_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "snapshots_game_idx" ON "game_snapshots" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "snapshots_game_turn_phase_idx" ON "game_snapshots" USING btree ("game_id","turn","phase");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "games_status_idx" ON "games" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "games_updated_idx" ON "games" USING btree ("updated_at");