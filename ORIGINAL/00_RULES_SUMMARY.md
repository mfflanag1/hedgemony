# Original Hedgemony — Rules Summary

> Source: RAND TL301 rulebook (`../rules/RAND_TL301.rulebook.pdf`). Local study use
> only — see [NOTICE](NOTICE.md). This is a condensed summary to drive the
> virtual-tabletop implementation; the rulebook is authoritative.

## Premise

A global, multi-sided, turn-based, **facilitated, adjudicated** wargame teaching
U.S. defense strategy. Players manage scarce resources and forces to advance their
**Influence** while hedging against uncertainty. A **White Cell** (facilitator)
adjudicates almost everything; **Blue (U.S., NATO/EU) is free-play** — not limited
to cards — while **Red (Russia, China, DPRK, Iran) plays from constrained card decks**.

## Sides & factions

- **Blue:** United States (the central player), NATO/EU.
- **Red:** Russia (RU), China (PRC), North Korea (DPRK), Iran (IR).
- **White Cell:** 2–4 facilitators (game master, adjudicator, croupier, Blue talker).

## Board

A stylized Unified Command Plan world map divided into U.S. combatant-command
**Areas of Responsibility (AORs)**: NORTHCOM, EUCOM, CENTCOM, INDOPACOM, SOUTHCOM,
AFRICOM. Forces are placed per AOR; moving between AORs costs Resource Points.

## Forces

- Military assets are abstracted to **Force Factors (FF)** — no land/air/sea/cyber
  distinction. Each FF counter has a **Modernization (Mod) Level** (higher = more
  capable).
- **National Tech Level** and per-capability **Critical Capability Mod Levels**
  (LRF, C4ISR, IAMD/BMD, SOF, Nuclear) are tracked per faction.
- **Readiness** is tracked for the **U.S. only**.

## Resources

- **Resource Points (RP):** pay deployment, modernization, procurement, readiness
  (U.S.), and card costs. Replenished each turn (per-turn allocation). **No player
  may run an RP deficit** unless the scenario/White Cell allows it.

## Influence & victory

- The single victory metric is **Influence Points (IP)**. Each faction starts with
  some IP and has its own Victory Conditions (see [02_DEFAULT_SCENARIO](02_DEFAULT_SCENARIO.md),
  Table A.2). Multiple winners are possible; some factions can both "lose."
- (Per RAND: IP is a deliberately abstract metric; the real point of the game is the
  learning discussion, not the tally.)

## Turn sequence (5 phases, up to 16 turns)

1. **Red Signaling** — each Red player reveals up to 3 cards (≥1 action, ≥1 investment)
   as Blue's "intelligence briefing." Signaled ≠ committed.
2. **Blue Investments & Actions** — Blue free-plays: posture/move forces, invest,
   respond. White Cell adjudicates and applies RP costs/outcomes.
3. **Red Investments & Actions** — Red plays (some/none of) its signaled cards in
   order; White Cell adjudicates.
4. **Annual Resources Allocation** — every faction receives its per-turn RP.
5. **State-of-the-World Summary** — White Cell summarizes; may inject events.

At any point in phases 1–3 the White Cell may inject **International** or player-specific
**Domestic Events**.

## Adjudication

- **Combat → Combat Resolution Table A (CRT A);** **noncombat → Resolution Table B
  (RT B).** Both are D10-based and run by the White Cell. See
  [04_RESOLUTION_TABLES](04_RESOLUTION_TABLES.md).
- Cards carry their own outcome tables / die-roll instructions; the White Cell rolls
  and applies IP/RP changes, force losses, etc.
- Outcomes may be **Public** (revealed to all) or **Private** (known only to the
  acting player + White Cell).

## What this implementation does NOT include

The full 226-card action/investment decks and 38 international events are physical
components of the boxed game and are **not** in the free rulebook. This build ships
only the **default scenario** + the **6 sample cards** the rulebook prints, and
surfaces the rules/tables so a facilitated group can play locally.
