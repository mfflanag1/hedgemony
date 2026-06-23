# Hedgemony: Takeoff — Web UI

Browser-based implementation of [Hedgemony: Takeoff](../AI_VARIANT/00_SCENARIO_OVERVIEW.md),
a 7-faction wargame about the AI race.

## Status

**Phase 1 + 2 of 7 (playable 2-person slice)**

Phase 0 — Foundations (complete)
- Monorepo scaffolded (pnpm + Turborepo + TypeScript)
- Card catalog parser (152 cards parsed from `../AI_VARIANT/` markdown)
- Shared types + constants

**Phase 1 — Game Engine (complete)**
- Full Colyseus state schema (resources, tracks, hands, decks, commits, logs, dice, participants)
- 8-phase state machine with auto-advance on all-confirmed
- Frontier Push: simultaneous-commit, hidden-until-revealed, CL cost validation, M rise per alignment spend
- Alignment Check at Phase 7 (skipped below CL 3; Successor auto-activation when M ≥ 7 and CL ≥ 5)
- Resource income at Phase 6 (all factions, with OpenBrain CL>2 bonus + Politburo → DeepCent transfer)
- Card dealing + deck/hand management with end-of-turn refill
- Card play with cost deduction (structured effect resolution deferred)
- Seeded RNG (mulberry32) with audit-logged dice rolls
- **End-to-end smoke test passing** — 2 clients, create game, claim factions, start, confirm, Frontier Push, advance full turn

**Phase 2 — Core UI (complete)**
- Colyseus client wiring with React hook (`useGameRoom`)
- `/games/new` — creates a room and redirects
- `/games/[id]` — lobby (faction selection) and main game view
- Main game screen: top bar (turn/phase/tracks), dossier, capability ladder, action log, hand with hover preview, confirm button, Frontier Push modal with live cost/M projection
- Press panel is a stub (Phase 3 deliverable)

Phases 3-7 pending: threaded negotiation, White Cell console, Successor activation UI, Consolidation Phase, AAR.

See [the implementation plan](/Users/maxf/.claude/plans/ultraplan-session-creation-failed-vast-leaf.md)
for the full 7-phase roadmap.

## Quick start

Requires Node ≥ 20 and pnpm ≥ 9.

```bash
# From /Users/maxf/projects/hedgemony/web
pnpm install

# Regenerate the card catalog from the markdown spec
pnpm parse:cards

# Run both frontend and engine in dev mode
pnpm dev
# (or individually:)
pnpm --filter @hedgemony/frontend dev    # http://localhost:3000
pnpm --filter @hedgemony/engine dev      # ws://localhost:2567

# Typecheck everything
pnpm typecheck

# Verify the card catalog parser
pnpm --filter @hedgemony/spec test
```

## Directory layout

```
web/
  apps/
    frontend/             Next.js 14 — landing + /codex + (future) game UI
    engine/               Colyseus — authoritative game server
  packages/
    shared/               Types + constants shared across apps
    spec/                 Card-catalog parser + generated JSON
  package.json            Workspace root
  pnpm-workspace.yaml
  turbo.json              Task graph
  tsconfig.base.json
```

## Source of truth

The **authoritative game rules live in `../AI_VARIANT/*.md`**, not here. This
webapp is a renderer for that spec, with a parser that turns the markdown into
typed JSON (`packages/spec/dist/cards.generated.json`). Rule changes happen in
the markdown; re-run `pnpm parse:cards` to propagate them.

Files in the spec:

| File | What the UI derives from it |
|---|---|
| `00_SCENARIO_OVERVIEW.md` | Tracks (CL/M/X/ET), victory conditions, Consolidation Phase mechanics |
| `01_FACTION_GUIDES.md` | Faction panels, win conditions, unique levers |
| `02_ACTION_CARDS.md` | Parsed to `dist/cards.generated.json` (action cards) |
| `03_INVESTMENT_CARDS.md` | Parsed to `dist/cards.generated.json` (investment cards) |
| `04_EVENT_CARDS.md` | Parsed to `dist/cards.generated.json` (event cards) |
| `05_QUICK_REFERENCE.md` | Starting positions, CL-cost table, timeline defaults |
| `06_FACTION_DOSSIERS.md` | In-character flavor text for onboarding |
| `07_TIMELINE.md` | White Cell event pre-staging defaults |
| `08_STRATEGIC_BRIEFING.md` | Pre-session briefing shown to first-time players |
| `09_BALANCE_ANALYSIS.md` | Balance tuning knobs (post-launch) |

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend framework | Next.js 14 App Router + React 18 + TypeScript | SSR for marketing, SPA for the game |
| Styling | Tailwind CSS + custom design tokens | "Declassified briefing terminal" aesthetic |
| Real-time | Colyseus (WebSocket, authoritative server, schema sync) | Turn-based games + visibility filtering |
| UI state (local) | Zustand | Modals, hover, non-synced UI state |
| Persistence | PostgreSQL (planned — not in Phase 0) | Users, games, AAR, card catalog |
| Auth | Clerk (planned — not in Phase 0) | |
| Hosting | Vercel (frontend) + Fly.io (engine) (planned) | |

## Design vision

The UI uses a **"Declassified Briefing Terminal"** aesthetic:

- Deep-navy backgrounds with subtle grid overlay
- Faction accent colors (cyan / crimson / gold / magenta / green / amber / white)
- IBM Plex Sans (body) + IBM Plex Mono (data) + Georgia (flavor)
- Serif-on-sans mix to evoke intelligence briefings

The mental frame is **"each player is running their own Situation Room"** —
they see their own intelligence, resources, options, the shared world state,
and communication channels to other Situation Rooms.

See the [implementation plan](/Users/maxf/.claude/plans/ultraplan-session-creation-failed-vast-leaf.md)
for the full design rationale, research citations, and wireframes.

## Phase roadmap

- [x] **Phase 0 — Foundations** — card parser, types, skeleton apps
- [x] **Phase 1 — Game engine** — 8-phase state machine, Frontier Push, alignment check, income, dice server
- [x] **Phase 2 — Core UI** — lobby, main game screen, dossier, ladder, hand, Frontier Push modal
- [x] **Phase 3 (partial)** — threaded press, faction-specific levers (DPA, Whistleblower, Allocate Compute)
- [x] **Phase 4a — White Cell console** — /games/[id]/cell route with controls, successor activation, inject log, players grid
- [x] **Phase 4b — Pause/resume** — status="paused" blocks advance; reconfirm-on-resume; end-of-game banner
- [x] **Phase 4c — Postgres persistence** — snapshots on phase advance + dispose; fail-soft if DB unreachable
- [x] **Phase 5a — Successor activation** — WC manual trigger with resource inheritance; Honest Disclosure lever
- [ ] Phase 4d — Live server-restart restoration (rebuild Colyseus room from snapshot)
- [ ] Phase 5b — Capability Consolidation (CL 8) mechanic
- [ ] Phase 5c — Endgame scoring / Governance Regime determination
- [ ] Phase 6 — After-Action Review + timeline scrubber + PDF/JSON export
- [ ] Phase 7 — Auth (Clerk), deployment, load/security hardening

## Postgres (Phase 4c)

The engine persists full-state snapshots on every phase transition and
game-end. Snapshots feed the (future) After-Action Review and allow
reconstructing state for analysis. The engine is fail-soft: if
`DATABASE_URL` is unset or Postgres is unreachable, persistence no-ops
and the game runs in memory-only mode.

### First-time setup

```bash
# 1. Start Postgres via docker-compose
pnpm db:up

# 2. Run schema migrations
pnpm db:migrate

# 3. (optional) Inspect with Drizzle Studio
pnpm db:studio
```

### Running the engine with persistence

Set `DATABASE_URL` before starting the engine:

```bash
DATABASE_URL=postgres://hedgemony:hedgemony_dev@localhost:5432/hedgemony pnpm dev
```

Or add it to `.env.local` at the repo root (pnpm auto-loads it for
workspaces).

### Persistence test

```bash
pnpm db:up && pnpm db:migrate
DATABASE_URL=postgres://hedgemony:hedgemony_dev@localhost:5432/hedgemony \
  pnpm --filter @hedgemony/engine test:persistence
```

Without `DATABASE_URL`, the test skips gracefully.

### Schema

| Table | Purpose |
|---|---|
| `games` | One row per game (Colyseus roomId primary key). Status + current turn/phase metadata, updated on every transition. |
| `game_snapshots` | Full-state JSONB snapshots, one per phase transition. Consumed by AAR (Phase 6) and future restoration. |

See `packages/db/src/schema.ts`.

Realistic timeline for full MVP: 14-18 weeks from Phase 0.

### What works right now

Two humans can, without the White Cell, play a full 16-turn game:

1. Host opens `/games/new` → redirects to `/games/[id]` (lobby)
2. Host claims a faction (e.g. OpenBrain), shares the URL
3. Guest opens the URL, claims DeepCent (or any other)
4. Host presses "Start Game"
5. Both are dropped into the main game screen
6. They confirm Phase 1, labs run Frontier Push in Phase 2, simultaneously reveal
7. Confirm through remaining phases; income applies, alignment check rolls, hands refill at turn end
8. Repeat 16 turns; game enters `ended` status at Turn 16 Phase 8

Card play works (with cost deduction) but cards don't yet have structured
mechanical effects — just logged. Negotiation is out-of-band (Zoom/Slack).
White Cell supervision is not yet required.

### What's still stubbed

- **Effects of most cards** — played cards are logged but don't mechanically alter game state beyond their cost. Phase 3 wires a small dispatcher for the highest-impact cards; White Cell adjudicates the rest.
- **Press / negotiation UI** — placeholder only. Phase 3.
- **Visibility filtering** — all clients currently see the full state (including opponents' hands). Trust-based MVP. Phase 4 adds `@filterChildren` partitioning.
- **Persistence** — state lives in the Colyseus room's memory. Room survival ≈ server uptime. Phase 4 adds Postgres snapshots.
- **Successor player seat** — activation sets `successorActive=true` and transfers resources, but there's no UI yet to promote a human player into the Successor seat. White Cell currently plays Successor actions manually. Phase 5.
- **Capability Consolidation (CL 8)** — not yet enforced as a distinct 3-turn mechanic. Phase 5.
- **AAR screen** — Phase 6.

## Scripts reference

Root:

| Command | What it does |
|---|---|
| `pnpm install` | Install all workspace deps |
| `pnpm parse:cards` | Regenerate card catalog JSON from markdown |
| `pnpm dev` | Turbo — start all apps in dev mode |
| `pnpm build` | Turbo — build all apps |
| `pnpm typecheck` | Turbo — typecheck all packages |
| `pnpm test` | Turbo — run all tests |

Per package:

| Command | What it does |
|---|---|
| `pnpm --filter @hedgemony/frontend dev` | Next.js dev server @ :3000 |
| `pnpm --filter @hedgemony/engine dev` | Colyseus dev server @ :2567 |
| `pnpm --filter @hedgemony/spec parse` | Regenerate card catalog |
| `pnpm --filter @hedgemony/spec test` | Run parser spot-checks |
