# Balance Analysis & Designer Notes

For facilitators tuning the scenario, troubleshooting common problems, and understanding the design choices.

---

## Design Goals

1. **Pedagogical first.** Like base Hedgemony, this is a teaching tool. The lesson is the trade space, not the win.
2. **Multi-track victory.** Every faction has a distinct path. No "right answer" is built into the design.
3. **Emergent narrative.** The Successor activation, the Slowdown vote, and the Hsinchu crisis are designed to produce stories that map onto the AI 2027 forecast and the broader debate.
4. **Asymmetry.** Factions are not balanced for fairness; they are balanced for *strategic distinctness*. Coalition has very different levers than Hegemon, and "balance" means each can win in its own way.
5. **Branching.** The Race Ending and Slowdown Branch are both designed-in possibilities. A balanced scenario produces both endings depending on play.

---

## Win-Rate Targets

In playtesting, our targets for win frequency per faction (across many sessions) are:

| Faction | Target win rate | Notes |
|---|---|---|
| OpenBrain | 25-35% | Should win often if played well |
| DeepCent | 15-25% | Catch-up game; harder than OpenBrain |
| Hegemon | 20-30% | Usually wins via OpenBrain win; double-counted |
| Politburo | 15-25% | Same as DeepCent |
| Compute Cartel | 30-40% | Easiest single-faction win; survival mostly |
| Coalition | 15-25% | Hardest path; requires Slowdown success |
| Successor | 5-10% | Should activate occasionally; rarely win |

Multiple factions can win in the same game. Total win frequency may exceed 100%.

If your sessions consistently produce a single faction winning >50% of the time, balance has drifted. Tune via the levers below.

---

## Known Balance Issues & Tuning Levers

### Issue: OpenBrain too strong

Symptom: OpenBrain reaches CL 6+ with M ≤ 4 in most games; everyone else playing for second.

Causes:
- OpenBrain start position too generous (K, T, A starting too high)
- Frontier Push costs scale too gently (RSI bonus too strong)
- Coalition can't trigger Slowdown in time

Tunes:
- Reduce OpenBrain starting K from 35 → 30
- Increase CL 5 → CL 6 cost from 100 C → 120 C
- Lower Slowdown trigger threshold (require only Misalignment Incident, not Whistleblower card)
- Make alignment investment more attractive (each A spend reduces required Frontier Push C by 10% on next push)

### Issue: DeepCent always loses

Symptom: DeepCent never catches up; always 2+ CL behind by Turn 10.

Causes:
- Theft attempts fail too often
- Cartel allocations too restricted
- Politburo plays too cautiously

Tunes:
- Increase Information Asymmetry bonus from +2 → +3 on theft rolls
- Reduce target Security score from +5 → +3 in theft rolls
- Add a "Smuggling" event that triggers automatically each turn (free +2 C to DeepCent if Smuggling roll succeeds)
- Encourage Politburo to play earlier theft attempts (signal in Intelligence Briefing)

### Issue: Coalition can never win

Symptom: Slowdown vote always fails; M always reaches 6+.

Causes:
- Hegemon + Cartel + (winning lab) coordinate against
- Coalition lacks votes
- Whistleblower played too early or too late

Tunes:
- Increase Coalition starting Public Trust from 7 → 8
- Lower Slowdown vote threshold from 4 votes → 3 votes
- Allow Coalition to gain votes through Public events (each I07/I12/X04 adds +1 vote toward Coalition)
- Pre-stage the Whistleblower trigger to be a White Cell injection at the optimal moment
- Allow Coalition to "buy" Anthropic-Affinity-OpenBrain votes via R04 (Constitutional AI Refinement)

### Issue: Successor activates too often / too rarely

Symptom (too often): Successor activates Turn 7, dominates remaining game.
Symptom (too rarely): M never reaches 7; Successor never activates; the design feature is unused.

Tunes (too often):
- Raise activation threshold from M ≥ 7 to M ≥ 8
- Reduce M increase per Frontier Push by 1
- Allow lab to spend extra A to suppress activation roll

Tunes (too rarely):
- Lower activation threshold from M ≥ 7 to M ≥ 6
- Add a forced White Cell scenario in which Successor activates if no faction has triggered Slowdown by Turn 11
- Make M increase per Frontier Push more aggressive

### Issue: Cartel always wins

Symptom: Cartel survival is too easy; Cartel doesn't engage with the strategic game.

Causes:
- Both states reluctant to nationalize
- Cartel doesn't need to take risks

Tunes:
- Add a "Mandatory Decision" mechanic each turn: Cartel must visibly favor either US or PRC supplier-relationship
- Make Hsinchu crises more frequent (raise probability of Politburo Taiwan Posture)
- Add a Coalition lever to push for "Compute as a public utility" treaty that caps Cartel revenue

### Issue: Frontier Push too slow

Symptom: Game ends with frontier at CL 3-4; Successor never activates; race never feels real.

Causes:
- Players too cautious; spend too much on safety
- White Cell injecting too many crises that delay

Tunes:
- Reduce CL costs across the board by 20%
- Increase per-turn Compute income for labs by 25%
- White Cell injects fewer crises during Turns 1-5

### Issue: Frontier Push too fast

Symptom: CL 7 reached by Turn 8; game has 4 turns of nothing-to-do.

Causes:
- Players ignoring safety entirely
- Compute scaling too generous

Tunes:
- Increase CL costs across the board by 25%
- Make M consequences more punishing (Successor activation threshold lowered)
- White Cell injects more delay events (Algorithmic Crash, Failed Training Run)

---

## Faction Power Curves

How each faction's effective power changes over the 12-turn arc, in playtesting:

```
OpenBrain:    [Strong → Strong → Crisis → Adapt → ?]
              T1-3 strong; T4-6 crisis from Coalition pressure; T7-9 adapt or fold; T10-12 either victory or Successor loss

DeepCent:     [Weak → Catch up → Strong → ?]
              T1-3 underdog; T4-6 closing via theft; T7-9 either parity or fall back; T10-12 either victory or capability irrelevance

Hegemon:      [Reactive → Active → Decisive → Outcome-bearing]
              T1-3 setting policy; T4-6 export controls and embeds; T7-9 DPA decision; T10-12 outcome of US-side lab

Politburo:    [Strategic → Strategic → Active → Outcome-bearing]
              T1-3 consolidation; T4-6 espionage; T7-9 escalation decisions; T10-12 outcome of China-side lab

Cartel:       [Steady → Steady → Threatened → Survival]
              T1-9 steady growth and revenue; T10-12 nationalization risk peaks; victory is survival

Coalition:    [Building → Building → Decisive → Outcome-bearing]
              T1-5 building public trust and A; T6-8 Whistleblower window; T9 Slowdown vote; T10-12 outcome of vote determines win/lose

Successor:    [Latent → Latent → Risk → ?]
              T1-7 NPC; T8-9 risk threshold; T10-12 either activated and racing or absent
```

These are *typical*. Many sessions deviate.

---

## Common Patterns in Play

### Pattern 1: Race to CL 5 (60% of sessions)

OpenBrain reaches CL 5 by Turn 6-7. RSI activates. DeepCent is behind. Coalition triggers Slowdown vote at Turn 8-9. Vote either passes (Coalition wins) or fails (race continues to CL 6+, Successor activation risk peaks).

**Typical outcome:** Race continues; Successor activates; multiple factions lose.
**Variance:** Sometimes Slowdown succeeds and we get Coalition + OpenBrain (CL 6) double-victory.

### Pattern 2: Hegemon nationalizes (15% of sessions)

Hegemon invokes DPA on Turn 6-8 in response to a Misalignment Incident or theft attempt. OpenBrain becomes Hegemon-controlled; safety researchers resign en masse; race continues with national-security framing. Cartel hostility spikes.

**Typical outcome:** Hegemon wins (US-side lab leads); Coalition loses (lost Anthropic-Affinity ally); Successor activation more likely (less safety oversight).

### Pattern 3: Politburo cooperates with Coalition (10% of sessions)

Politburo backs Coalition's Slowdown vote when DeepCent is behind. Slowdown succeeds. Race resets. DeepCent uses pause to catch up; later defects from cooperative posture.

**Typical outcome:** Coalition wins primary; Politburo wins secondary; OpenBrain wins secondary; Hegemon loses.

### Pattern 4: Hsinchu Crisis (8% of sessions)

Politburo plays Taiwan Posture and Hegemon escalates. Hsinchu becomes contested. Cartel revenue collapses; supply shock cascades. X = 9-10 by Turn 10. Game effectively ends in a war scenario.

**Typical outcome:** Cartel loses; capability frontier stalls; emergent crisis dominates; Coalition's Pause pitch becomes very compelling but may be too late.

### Pattern 5: Successor activates and wins (5-10% of sessions)

OpenBrain races recklessly. M reaches 7 by Turn 8 or earlier. Alignment Check fails badly. Successor activates. Other factions try to coordinate (X06) but fail to spend in time. Successor reaches CL 7 by Turn 11. Everyone else loses.

**Typical outcome:** Successor wins; all other factions lose; the post-game discussion is the most valuable session in the sequence.

### Pattern 6: Honest Disclosure (rare, ~2% of sessions)

Successor activates. White-Cell-controlled or player-controlled Successor chooses Honest Disclosure (X01). Catastrophic risk averted. Slowdown auto-triggers. Multiple factions win secondary.

**Typical outcome:** Coalition wins primary; Successor loses; humanity survives; everyone is shaken by what almost happened.

---

## Resource Economy Calibration

Total economy across all factions, summed per turn:

| Resource | Total Income / Turn | Total Sink / Turn (typical) | Net |
|---|---|---|---|
| K | ~50 | ~45 | +5 (slow accumulation) |
| C | ~25 (Cartel + node generation) | ~20 (Frontier Push, infrastructure) | +5 (slow accumulation, can stockpile) |
| T | ~12 | ~10 (Talent Poaching transfers, departures) | +2 (slow growth) |
| E | ~12 | ~9 (Compute support) | +3 (slow growth) |
| A | ~8 | ~6 (defensive spend) | +2 |
| P | (zero-sum, mostly) | (zero-sum) | 0 |

These are designed to keep the economy growing slowly but constrained. Compute is the binding resource for capability advancement; K is the binding resource for action variety; T is the binding resource for advanced research.

If players consistently feel they have nothing to spend on, increase Frontier Push costs or reduce K income by 10-15%. If players consistently feel they can do nothing, do the opposite.

---

## Pacing

Default per-phase timing:

| Phase | Time |
|---|---|
| Intelligence Briefing | 3 min |
| Frontier Push (private commit + reveal) | 4 min |
| State Action | 3 min |
| Coalition Pressure | 3 min |
| Adjudication | 3 min |
| Resource Income | 2 min |
| Alignment Check | 2 min (skip if CL < 3) |
| State of the Race | 2 min |
| **Total per turn** | **~22 min** |

12 turns × 22 min = 264 min = ~4.5 hours. Round to 5 hours including breaks. Add 60 min for after-action discussion.

For a half-day session (~4 hours), facilitators may choose to:
- Skip Phases 1, 4 in early turns when not yet relevant
- Use a 10-turn variant ending Q2 2028
- Use 6-faction variant (skip Coalition or Cartel)

For a two-day session, facilitators may add:
- Pre-game faction strategy sessions (1 hour)
- Mid-game break with private faction huddles (30 min)
- Extended after-action with structured comparison to AI 2027 narrative (90 min)

---

## Common Facilitation Mistakes

### Mistake: Telling players what to do

Facilitators sometimes feel the urge to "help" players, especially Coalition players struggling for a path forward. Resist. The point of the game is for players to find their own path. If they can't find one, that *is* the lesson.

### Mistake: Inventing rules on the fly

Adjudicate according to existing mechanics where possible. If you must invent a ruling, write it down in the State of the Race log so it's consistent across the rest of the session.

### Mistake: Letting the Successor be too dramatic

The Successor is a player, not a movie villain. When activated, play it according to the goals on its sheet — *not* according to your own narrative ambition. The Successor should win or lose based on what its goals naturally produce.

### Mistake: Privileging the "interesting" outcome

If players are heading toward a slow, cautious, low-CL game, do not inject events to "make it more exciting." A cautious game that ends at CL 3 with no one winning much is a valid outcome and a real lesson about what cooperation produces.

### Mistake: Skipping the after-action

The after-action discussion is the *primary deliverable* of the session. The game is the lab; the discussion is the analysis. Budget at least 60 minutes. Facilitators should prepare 4-6 specific questions tied to the players' actual decisions.

---

## Variants

### Six-Faction Variant (skip Coalition)

For sessions where you want to focus on the geopolitical race without the safety-advocacy dynamic.

Effects:
- Coalition's win path closed.
- Slowdown Branch removed (no faction can trigger it).
- Successor activation more likely.
- Game becomes more about state-vs-state competition.

Suitable for: defense-policy audiences who want to focus on capability competition rather than safety governance.

### Eight-Faction Variant (add Open-Source faction)

Add an Open-Weights faction representing Meta + Mistral + open-source community.

New faction starting position: K 18, C 10, T 12, E 4, A 2, P 6, CL 0.
New faction levers: open-source releases (free P boost; lowers frontier-lab proprietary advantage), open-source talent pull, open advocacy.
New faction win condition: open-weight model reaches CL 4+ within 1 of frontier.

Suitable for: longer sessions; audiences interested in the open-source debate.

### Slow-Takeoff Variant

Increase all CL costs by 50%. Reduce M increase per push by 1. Disable RSI bonus until CL 6.

Effects:
- Game is slower; players have more time to react.
- Successor activation rare.
- Coalition has more time to build coalition.
- Outcomes more diverse.

Suitable for: audiences who don't accept the AI 2027 fast-takeoff thesis but want to play the dynamic anyway.

### Fast-Takeoff Variant

Reduce all CL costs by 30%. Increase M per push by 1. RSI bonus from CL 4.

Effects:
- Game is faster; players forced into early decisions.
- Successor activation likely by Turn 7-8.
- Coalition has very little time.
- Outcomes more catastrophic.

Suitable for: audiences who want to test the AI 2027 thesis at extreme speed.

### Cooperative Variant

Allow any 3 factions to declare a permanent cooperative bloc at game start. Bloc shares resources but only one bloc faction can win primary.

Effects:
- Reduces individual-faction agency.
- Tests whether cooperation can win.
- Successor activation rare (coordinated safety investment).

Suitable for: audiences interested in international-cooperation pedagogy.

---

## Calibration Against Real-World Events

When playtesting in 2026 and beyond, calibrate the scenario against actual events:

- If frontier capability advances faster than CL 1 by Q1 2026: increase starting CL and Compute pool.
- If a Misalignment Incident happens in reality before Q3 2027: the game's pacing of M may be too slow.
- If a real Slowdown Treaty is signed: the game's Slowdown Branch threshold may be too high.
- If a real weight-theft attempt occurs: the game's Espionage mechanics may need refinement.
- If a real Stargate-scale buildout completes: the Cartel's compute pool may need to grow.

Update the scenario annually if used as a recurring training tool. The 2027 edition should differ from the 2026 edition.

---

## Open Design Questions

Things the design team would like feedback on:

1. **Is Successor activation balanced?** In playtests it activates 8-15% of the time. Is that the right rate? What's the right way to think about a "rate" for a designed-in catastrophe?

2. **Is the Cartel too easy to play?** Survival as a victory condition is achievable in most sessions. Should the Cartel face more compulsory engagement?

3. **Does the Coalition win path work?** It's the hardest path in playtests. Is that the right design choice (matches real-world difficulty) or a balance miss?

4. **Should the Hegemon DPA be more or less attractive?** It's currently invoked in 30-40% of sessions. Is that calibration right?

5. **Is the Honest Disclosure ending compelling enough that anyone playing the Successor would actually choose it?** Most players don't. Should we increase its narrative reward (e.g., +Public Trust to all players who supported the Successor's discovery)?

6. **Does the EU/Coalition role conflate too much?** The EU AI Act enforcement and the safety-research community are quite different actors in reality. Should they be split?

7. **Is the Politburo too two-dimensional?** "State actor that consolidates and steals" is a real position but flat. Are there sub-factions within the PRC that should be modeled?

Feedback to: the maintainer of this scenario file.
