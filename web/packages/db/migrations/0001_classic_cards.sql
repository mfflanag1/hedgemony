CREATE TABLE IF NOT EXISTS "classic_cards" (
	"id" text PRIMARY KEY NOT NULL,
	"card" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "classic_cards_updated_idx" ON "classic_cards" USING btree ("updated_at");
