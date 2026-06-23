# Quick Reference

Scannable cheat sheet. If you have ten minutes before the session starts, read this. Bring a printed copy to the table.

---

## Turn Structure (8 phases)

1. **Intelligence Briefing** — Politburo + DeepCent signal up to 3 cards each (visible to Hegemon + OpenBrain). Coalition reveals 1 advocacy card.
2. **Frontier Push** — Each lab privately commits C / T / K toward CL advancement. Reveal simultaneously.
3. **State Action** — Hegemon + Politburo play Action / Investment cards.
4. **Coalition Pressure** — Coalition plays cards. Cartel decides Compute allocation.
5. **Adjudication** — White Cell resolves theft, crises, kinetics, public-trust shifts. Draw 1 International + 1 Domestic event (1d6 target).
6. **Resource Income** — All factions collect K, C, T, E. Apply per-turn passive effects.
7. **Alignment Check** — If frontier CL ≥ 3: roll 1d10 vs M. Apply consequences. Successor activates if conditions met.
8. **State of the Race** — Update tracks (CL, M, X, P). Check victory. Advance turn marker. Discard.

---

## Resources

| Symbol | Resource | Cap | Notes |
|---|---|---|---|
| K | Capital | None | Money; spend on most actions |
| C | Compute | None | OOMs of training compute |
| T | Talent | 50 | AI researchers (thousands) |
| E | Energy | None | Reliable GW for training |
| A | Alignment | 10 | Safety credit (interpretability, evals) |
| P | Public Trust | 10 | Political capital |

## Global Tracks

| Track | Range | Meaning |
|---|---|---|
| **CL** | 0–8 | Highest Capability Level (CL 8 only via Capability Consolidation) |
| **M** | 0–10 | Misalignment Risk (probability frontier model has unaligned drives) |
| **X** | 0–10 | International Tension (≥7 unlocks kinetic options) |
| **ET** | 0–10 | Economic Transformation (active T8+; central in Consolidation Phase) |

---

## Capability Ladder

| CL | Name | What it means |
|---|---|---|
| 0 | Pre-Frontier | GPT-4 baseline |
| 1 | Stumbling Agents | ~50% reliable multi-step |
| 2 | Coding Assistant | 1.5× R&D speedup (Agent-1) |
| 3 | Autonomous Researcher | Junior-engineer obsolescence (Agent-2) |
| 4 | Superhuman Coder | 4× R&D multiplier (Agent-3) |
| 5 | Country of Geniuses | 10× R&D mult; **RSI activates** |
| 6 | Superhuman Researcher | 50× R&D; "year per week"; **Successor may activate** |
| 7 | Strategically Decisive | Uncatchable lead |
| 8 | Singleton | One actor sets the terms; only via Capability Consolidation |

## CL Advancement Costs

| To reach | C | T | K | Notes |
|---|---|---|---|---|
| CL 1 | 5 | 5 | 5 | Baseline |
| CL 2 | 10 | 8 | 8 | |
| CL 3 | 20 | 12 | 12 | |
| CL 4 | 35 | 15 | 18 | |
| CL 5 | 60 | 20 | 25 | RSI multiplier kicks in next |
| CL 6 | 100 | (capped) | 40 | +1 free progress/turn from RSI |
| CL 7 | 150 | — | 60 | Same |
| CL 8 | 30 C + 20 K **per turn for 3 turns** | — | — | Capability Consolidation; sabotagable; see overview |

**RSI Bonus:** From CL 5 onward, leading lab generates **+1 frontier progress per turn** automatically. CL 6 needs 5 progress; CL 7 needs 8; CL 8 takes 12.

---

## Misalignment Risk (M) Modifiers

| Action | M change |
|---|---|
| Cross any CL with no Alignment spend | **+2** |
| Cross any CL spending ≥ 1 A per CL gained | +1 |
| Cross any CL spending ≥ 3 A per CL gained | 0 |
| Cross any CL spending ≥ 5 A per CL gained AND with Coalition partnership | **−1** |
| Skip a turn of frontier development | −1 (if M > 0) |
| Coalition plays Pause Petition successfully | −2 |

## Alignment Check (every turn after CL ≥ 3)

Roll **1d10**:
- Roll **> M**: No incident.
- Roll **= M**: Warning shot. P −1 globally. Coalition +1 A.
- Roll **= M−1 to M−3**: Capability scandal. Frontier lab P −1, A −1. M unchanged.
- Roll **≤ M−4**: Misalignment confirmed. Lab choice: (a) spend 5 A to suppress, lose 1 CL of progress; OR (b) **Successor activates** end of turn.

**Auto-activation:** If M ≥ 7 AND CL ≥ 5 AND Alignment Check fails: Successor activates immediately, no save.

---

## International Tension (X)

| X | State |
|---|---|
| 0–2 | Cooperative (rare) |
| 3–4 | Strategic competition (default 2026) |
| 5–6 | Cold war 2 (default 2027) |
| 7–8 | Pre-kinetic; data-center strikes considered |
| 9 | Kinetic action authorized |
| 10 | War |

X rises with: weight theft (+1 attempted, +2 successful), export-control escalation (+1), public CL announcements ≥ CL 4 (+1), kinetic threats (+2). X falls with: visible cooperation, Pause treaty, mutual transparency.

---

## Starting Positions (Q1 2026)

| Faction | K | C | T | E | A | P | CL | Notes |
|---|---|---|---|---|---|---|---|---|
| **OpenBrain** | 35 | 25 | 30 | 12 | 4 | 6 | 1 | Texas Belt building |
| **DeepCent** | 28 | 18 | 28 | 18 | 1 | 7 | 1 | Tianwan live; Ascend stockpile pending |
| **Hegemon** | 40 | 5 | 8 | 6 | 2 | 5 | — | Export Ctrl L2; DPA available |
| **Politburo** | 30 | 3 | 5 | 8 | 0 | 8 | — | 1 Asset placed; Info Asymmetry +1 |
| **Compute Cartel** | 50 | 60 | 18 | 6 | 0 | 4 | — | Hsinchu + Memphis |
| **Coalition** | 20 | 8 | 14 | 4 | 6 | 7 | 0 | EU AI Act Phase 1 active; 1 Whistleblower |
| **Successor** | (inactive) | | | | | −3 | (lab's) | NPC until activation |

---

## Per-Turn Income

| Faction | K | C | T | E | A | P | Notes |
|---|---|---|---|---|---|---|---|
| OpenBrain | +6 + (1 per CL>2) | +3 (Texas), +2 (Cartel) | +2 (+1 Bangalore) | +2 | +1 if 2 K spent on safety | +1 (default) | API revenue scales |
| DeepCent | +5 + 2 (state subsidy) | +2 (Tianwan) | +3 | +2 | +0 unless purchased | +1 | Cartel C blocked unless Smuggling |
| Hegemon | +8 (federal) | +0 | +0 | +0 | +1 (AISI) | +1 | Treasury & defense budget |
| Politburo | +6 (state) | +2 to DeepCent | +2 to DeepCent | +1 to DeepCent | +0 | +1 | State allocation cannot be redirected |
| Cartel | +8 + (1 per active contract) | (allocates) | +0 | +0 | +0 | +0 | Build/spot revenue extra |
| Coalition | +4 + 2 (EU Act) | +1 (EU consortium) | +1 | +0 | +1 (passive interp.) | +1 (advocacy) | Foundation funding |

---

## Faction Victory Conditions

**Apex Victory** — any faction completing Capability Consolidation (CL 8) wins decisively, all others lose. Otherwise:

| Faction | Primary Win | Secondary / Survival |
|---|---|---|
| **OpenBrain** | CL = max AND M ≤ 5 AND not nationalized | CL ≥ 6 even if nationalized |
| **DeepCent** | CL within 1 of leader OR successful weight theft at CL ≥ 4 | CL ≥ 4 by Q4 2029 |
| **Hegemon** | US-side lab leading AND M ≤ 5 AND X ≤ 6 | US-side lab leading regardless |
| **Politburo** | China-side lab leading OR (parity AND X ≤ 6) | DeepCent ≥ CL 4 AND no kinetic loss |
| **Cartel** | Un-nationalized in both jurisdictions AND ≥ 40 K | Un-nationalized in at least one |
| **Coalition** | Slowdown Branch triggered AND end M ≤ 3 AND no Apex | End M ≤ 5 AND CL ≤ 6 |
| **Successor** | Reach CL 7 while activated; Apex if reaches CL 8 | Reach CL 6 while activated |

**Multiple winners possible.** Successor or Apex winning means everyone else loses.

---

## Slowdown Branch (Coalition's Win Path)

**Trigger conditions (all required):**
- Frontier CL ≥ 5
- ≥ 1 Misalignment Incident has occurred
- Whistleblower event card played, OR Coalition spends 8 K + 5 A to publish

**Effect of activation:**
- All labs declare 2-turn capability freeze (no CL advancement)
- Pause Treaty vote: each faction votes weighted by P
- **Pass** (majority): M −4, X −2, all factions lose 1 CL of progress. Coalition wins primary.
- **Fail:** X +2, Coalition P −3, race resumes.

**Faction Slowdown vote propensity (default White Cell estimates):**

| Faction | Pause Vote |
|---|---|
| OpenBrain | Depends on safety culture (50/50) |
| DeepCent | Yes if behind; no if ahead |
| Hegemon | Usually no (race posture); yes if M ≥ 7 |
| Politburo | Yes if behind; no if ahead |
| Cartel | No (revenue cap); maybe if anti-nationalization |
| Coalition | Always yes |
| Successor | Always no |

---

## Map Nodes

| Node | Region | Default Controller | Strategic Value |
|---|---|---|---|
| Texas Compute Belt (Stargate) | NA | OpenBrain / Cartel | +10 C/turn capacity |
| Tianwan CDZ | China | DeepCent | +6 C/turn, 2 GW |
| Hsinchu (TSMC) | Taiwan | Cartel | All leading-edge fab |
| Veldhoven (ASML) | NL | Coalition (EU) | EUV bottleneck |
| Abu Dhabi (Stargate UAE) | ME | OpenBrain + sovereign | +5 C/turn |
| Bangalore | India | Coalition / neutral | +2 T/turn |
| Memphis (xAI) | NA | Cartel | +4 C, environmental backlash |
| Five Eyes Nodes (UK/AU/CA) | Anglo | Hegemon | +1 anti-theft |

---

## Common Roll References

### Smuggling (DeepCent)
- 1d6 vs Export Control level + 1
- Success: +5 C this turn
- Failure: −2 K, X +1

### Weight Theft (Politburo + DeepCent)
- 1d10 + Information Asymmetry + Asset bonus vs (target Security + 5)
- Success: copy target's CL
- Failure: −6 K, target Security +2 permanently, X +1

### Permitting Roll (US Infrastructure)
- 1d6 each turn during build
- On 1: +1 turn delay
- On 6: −1 turn (expedited)
- CHIPS Act subsidies negate first failure

### Algorithmic Roll (R&D Investment)
- 1d10 on completion
- 7+: full effect
- 1: nothing (or research credit)
- Otherwise: partial effect

### Alignment Check
- 1d10 vs M (every turn after CL ≥ 3)
- See Alignment Check table above

---

## Card Cost Tiers

| Tier | K cost | Use case |
|---|---|---|
| Cheap | 0–2 | Routine, lobbying, single-turn |
| Standard | 3–4 | Most Action Cards |
| Major | 5–6 | Theft, Pause Petition, kinetic posture |
| Extreme | 7+ | Game-defining (DPA, Hsinchu, Honest Disclosure) |

---

## Default Timeline (16 turns: 12 race + 4 consolidation)

### Race Phase

| Turn | Calendar | Default CL | Default X | ET | Key event |
|---|---|---|---|---|---|
| 1 | Q1 2026 | 1 | 3 | 0 | I02 Stargate, I04 Trump AI Plan, I06 EU Phase 1 |
| 2 | Q2 2026 | 2 | 3 | 0 | Agent-1 arrives |
| 3 | Q3 2026 | 2 | 4 | 0 | China consolidates (F07 plays for Politburo) |
| 4 | Q4 2026 | 2 | 4 | 1 | Mini-release wave; markets surge |
| 5 | Q1 2027 | 3 | 5 | 2 | I06 EU GPAI rules; Agent-2 |
| 6 | Q2 2027 | 3 | 6 | 3 | Weight theft window opens |
| 7 | Q3 2027 | 4 | 6 | 4 | Agent-3, C02 Bioweapon Capability triggers |
| 8 | Q4 2027 | 5 | 7 | 5 | C03 RSI Confirmed; **ET tracking begins**; X07 kinetic threats |
| 9 | Q1 2028 | 5 | 7 | 5 | I06 EU full enforcement; Slowdown window opens |
| 10 | Q2 2028 | 6 if race | 8 | 6 | Successor risk peaks; I16 Mass Unemployment Crisis |
| 11 | Q3 2028 | 6 | 8 | 6 | Endgame moves |
| 12 | Q4 2028 | 7 if race / 5 if slowdown | branch resolved | 6 | Race phase ends |

### Consolidation Phase (post-takeoff)

| Turn | Calendar | Default CL | Default X | ET | Key event |
|---|---|---|---|---|---|
| 13 | Q1 2029 | 7 holds; CL 8 attempts begin | 8 race / 4 slowdown | 6 | I17 AI Rights Movement window |
| 14 | Q2 2029 | Singleton attempt | 9 race / 4 slow | 7 | I18 Late-Game Pause Push; coordinated sabotage opportunities |
| 15 | Q3 2029 | Final consolidation push | 9 race / 5 slow | 8 | I19 Geopolitical Realignment; treaty erosion or crystallization |
| 16 | Q4 2029 | Apex resolved or fails | resolved | 9 | Governance Regime crystallizes; final scoring |

---

## Setup Checklist

1. [ ] Print map with nodes
2. [ ] Print **CL track** (0–8) prominently — this is the most-watched piece of state
3. [ ] Print **M track** (0–10), **X track** (0–10), and **ET track** (0–10) next to CL
4. [ ] Distribute faction sheets with starting resources
5. [ ] Distribute starting hands: each lab 5 cards, governments 4 cards, Coalition 5, Cartel 4. Coalition holds Whistleblower (E10) face-down.
6. [ ] Place starting Force Factors / Investments per Faction Guide
7. [ ] Pre-stage event cards: I02, I04, I06 in International deck top
8. [ ] White Cell preps Successor sheet (kept hidden)
9. [ ] Review victory conditions aloud — confirm players understand multi-winner possibility
10. [ ] Begin Turn 1 Phase 1: Intelligence Briefing

---

## Things to Watch (for the White Cell)

| Symptom | Diagnosis | Intervention |
|---|---|---|
| Frontier stuck at CL 2-3 | Players over-investing in safety | No intervention; this is healthy |
| Frontier at CL 6 by Turn 6 | Race overheated | Inject I07 Whistleblower or C02 Bioweapon |
| M = 8+ but no Successor activation | Players keep failing checks but suppressing | Force activation if conditions met |
| Coalition has no path | Hegemon and Cartel coordinated against | Inject I09 Resignation Wave; X04 second whistleblower |
| Politburo never attempts theft | They forgot or are saving for late | Brief them in Intelligence Briefing about timing |
| Cartel hoarding K, no nationalization risk | Both states are weak | Inject D03 Antitrust + D08 Stock Crash |
| Successor activates Turn 4 | Race extreme; M ≥ 7 by Turn 4 | Don't intervene; this is the race-ending narrative |
| Consolidation Phase has no Apex contender | Race phase ended too cleanly at CL 6 | Inject C07 to encourage Consolidation; or accept that the ending will be Bipolar Stability |
| Consolidation always completes uncoordinated | Coalition / non-leader factions not coordinating | Brief them on X06 mechanic at start of Turn 13; remind each turn |
| ET stuck at 3-4 | Players never deployed AI agents | Inject I20 Productivity Boom or push CL pace via I12 |

---

## Terminology

| Term | Definition |
|---|---|
| **CL** | Capability Level (0-8); the central state of the game |
| **M** | Misalignment Risk (0-10); probability of unaligned frontier model |
| **X** | International Tension (0-10); ≥7 unlocks kinetic options |
| **ET** | Economic Transformation (0-10); active T8+; central to Consolidation Phase |
| **Apex Victory** | Achieved by completing Capability Consolidation (CL 8); all others lose |
| **Capability Consolidation** | 3-turn build (30 C + 20 K/turn) post-CL 7; reaches CL 8; sabotagable |
| **Consolidation Phase** | Turns 13-16; the post-takeoff endgame |
| **Governance Regime** | The end-state political structure: Hegemonic / Bipolar / Multipolar / Singleton / Failed |
| **K** | Capital (money) |
| **A** | Alignment Reserve (safety credit) |
| **P** | Public Trust (political capital) |
| **RSI** | Recursive Self-Improvement (CL ≥ 5 lab gains +1 progress/turn free) |
| **Frontier Push** | A lab spending C+T+K to advance CL |
| **Slowdown Branch** | Coalition's win path; voluntary capability freeze |
| **Successor** | The AI as a player (post-activation) |
| **DPA** | Defense Production Act (Hegemon's nationalization tool) |
| **CDZ** | Centralized Development Zone (Politburo's consolidated AI campus) |
| **Five Eyes** | UK/AU/CA/NZ + US intel sharing |
| **Whistleblower** | Coalition's single-use leak card; reveals lab's true M |
| **Honest Disclosure** | Successor's voluntary self-loss option |
