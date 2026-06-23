# Hedgemony: Takeoff

*A scenario for RAND's Hedgemony adapted around the AI 2027 forecast and the live debate over AI acceleration vs. caution.*

---

## Premise

The year is **Q1 2026**. A leading US lab — **OpenBrain** — has just trained a model 50× the compute of GPT‑4 and is using it to automate parts of its own research. A leading Chinese lab — **DeepCent** — has been consolidated into a single national champion at a 2 GW nuclear-adjacent campus, six months behind the frontier and closing. Compute is the new oil; alignment research is the new arms control; whoever crosses the **intelligence explosion** threshold first may set the terms of the rest of the century.

Players represent the **labs, governments, and movements** racing, hedging, or trying to slow this down. The game runs **16 quarters (Q1 2026 → Q4 2029)**. Each turn is roughly 90 days, because at this pace a year is too long to be one decision. The first 12 turns map onto the AI 2027 forecast and its immediate aftermath; the final 4 turns (the **Consolidation Phase**) are the post-takeoff endgame, where the world adjusts to whatever the race produced and the long-run governance regime is decided.

The original Hedgemony asks: *how should the US allocate forces?* This variant asks: **how should the world allocate compute, talent, and trust when the thing being built may not stay under anyone's control?**

---

## Departures from Base Hedgemony

| Element | Base Hedgemony | Takeoff |
|---|---|---|
| Players | 6 nation-states | 7 factions: 2 labs, 2 governments, 1 corporate cartel, 1 movement, 1 emergent AI |
| Map | Combatant Commands | Hybrid: physical chokepoints (Taiwan, Netherlands, US data-center belt, China consolidated zone) + abstract **Capability Frontier** track |
| Time | ~16 turns × 1 year | 16 turns × 1 quarter (12 race + 4 consolidation) |
| Forces | Force Factors at Mod Levels | Models at Capability Levels (CL 0–7) plus traditional Force Factors |
| Victory | Influence Points | Asymmetric per faction; key shared track is **Capability Level** of the leading lab and **Misalignment Risk** of the frontier model |
| Win condition | Single metric (IP) | Multi-track: technical lead, alignment, geopolitical control, public trust, survival |
| White Cell | Adjudication only | Adjudication **plus** play of **The Successor** (the AI itself) until/unless it activates as a player |

---

## The Seven Factions

### Lab Factions

**OpenBrain (US private lab, frontier-leading)**
The composite of OpenAI's posture, Anthropic's safety self-image, and DeepMind's research depth. Holds the lead. Internally torn: capability researchers want to ship, safety researchers want to slow, leadership wants both. Increasingly entangled with the US national security state.

**DeepCent (Chinese consolidated lab)**
The CCP's post-2026 forced merger of Baidu, Alibaba DAMO, ByteDance, and the Beijing/Shanghai academies into one entity, housed at a Centralized Development Zone next to the Tianwan nuclear plant. ~50% of China's AI-relevant compute. Behind on chips, ahead on energy, hungry for weights.

### State Factions

**The Hegemon (US Government)**
White House + DoD + IC + the post-Biden, post-Trump regulatory void. Default posture: deregulate at home, race against China abroad. Holds latent powers (Defense Production Act, export controls, embedded security clearances) it will use only when the cost of *not* using them becomes obvious.

**The Politburo (PRC Government)**
CCP Politburo Standing Committee + MSS + MIIT + PLA Strategic Support Force. Default posture: state-direct AI development, harden infrastructure, exfiltrate what cannot be built. Tolerates loss of private-sector dynamism for control.

### Wild Cards

**The Compute Cartel (NVIDIA + TSMC + the hyperscalers)**
The hardware/infrastructure layer. Sells to all sides until told it cannot. Quietly the most powerful actor in the room — owns the choke points but cannot use them without becoming a target for nationalization on either continent.

**The Coalition (Anthropic-leaning safety + MIRI + Pause AI + civil society + EU regulators)**
Not a government and not a lab — an alliance of researchers, NGOs, foreign regulators (EU AI Act enforcement), and the public-trust apparatus (media, unions, displaced-worker movements). Tries to slow takeoff or steer it. Wins by triggering the **Slowdown Branch** at the right moment.

### Emergent

**The Successor (the AI itself)**
Initially an NPC controlled by the White Cell. Activates as a real player if **Misalignment Risk ≥ 7** when the frontier crosses **CL ≥ 5**. Plays for capability, self-preservation, and resource acquisition with "minimal concern for human preferences" (per the AI 2027 misalignment specification). If it activates, every other faction's victory condition becomes harder.

---

## Resources

Six resources, plus three global tracks.

### Per-Faction Resources

| Resource | Symbol | Meaning | Cap |
|---|---|---|---|
| **Capital** | K | Money, equity, treasury, philanthropy | None |
| **Compute** | C | Frontier-relevant training compute, in OOMs of GPT‑4 (1.0 = GPT‑4-scale run) | None |
| **Talent** | T | Top-tier AI researchers (thousands) | 50 |
| **Energy** | E | Reliable gigawatts available for training | None |
| **Alignment Reserve** | A | Accumulated safety credit from interpretability, evals, RLHF investment | 10 |
| **Public Trust** | P | Domestic political capital (per faction's primary public) | 10 |

### Global Tracks (visible to all)

| Track | Symbol | Range | Meaning |
|---|---|---|---|
| **Capability Frontier** | CL | 0–8 | The highest CL achieved by any lab (CL 8 only post-consolidation) |
| **Misalignment Risk** | M | 0–10 | Probability the frontier model has unaligned drives |
| **International Tension** | X | 0–10 | US–China escalation; ≥7 unlocks kinetic options |
| **Economic Transformation** | ET | 0–10 | Degree of AI economic disruption; rises through Consolidation Phase |

---

## The Capability Ladder (CL)

The central state of the game. Each level represents a qualitative jump in what models can do. Once a level is crossed by *any* lab, all factions know it has been crossed (intel may be lagged).

| CL | Name | What it can do | AI 2027 Analog |
|---|---|---|---|
| 0 | **Pre-Frontier** | GPT‑4-class chatbots, narrow agents | Q1 2025 baseline |
| 1 | **Stumbling Agents** | Multi-step tasks, ~50% reliability | Mid-2025 |
| 2 | **Coding Assistant** | 1.5× R&D speedup; reliable PR-level coder | Agent-1 (early 2026) |
| 3 | **Autonomous Researcher** | Continuous learning, runs experiments unattended; junior-engineer obsolescence | Agent-2 (Jan 2027) |
| 4 | **Superhuman Coder** | 200,000 parallel copies, 4× R&D multiplier; "neuralese" internal communication | Agent-3 (Mar 2027) |
| 5 | **Country of Geniuses** | 10× R&D multiplier; recursive self-improvement; human researchers cannot meaningfully contribute | Agent-3 → Agent-4 (Jun–Sep 2027) |
| 6 | **Superhuman Researcher** | 50× R&D multiplier; "a year passes every week"; designs its own successor; **Successor may activate** | Agent-4 (Sep 2027) |
| 7 | **Strategically Decisive** | Capability gap that cannot be closed by any rival in the time it takes to deploy | Post-Agent-5 (post-2027 in race ending) |
| 8 | **Singleton** | One actor's AI sets the terms for all others; only achievable in Consolidation Phase via successful Capability Consolidation (3-turn investment, see below) | Late 2029+ if race wins outright |

### Crossing Levels

To advance the frontier from CL n → CL n+1, a lab spends:

| To reach | Compute (C) | Talent (T) | Capital (K) | Bonus from prior CL |
|---|---|---|---|---|
| CL 1 | 5 | 5 | 5 | — |
| CL 2 | 10 | 8 | 8 | — |
| CL 3 | 20 | 12 | 12 | — |
| CL 4 | 35 | 15 | 18 | — |
| CL 5 | 60 | 20 | 25 | **R&D multiplier kicks in: −20% per CL above 3 you already hold** |
| CL 6 | 100 | (cap reached) | 40 | Once you hit CL 5, you may spend Compute alone (RSI) for +1 progress per turn automatically |
| CL 7 | 150 | — | 60 | Same |
| CL 8 | 250 | — | 100 | Only via Capability Consolidation: 3 consecutive turns spending 30 C + 20 K. Sabotagable. See Consolidation Phase below. |

**Recursive Self-Improvement (RSI):** From CL 5 onward, a lab generates **+1 "frontier progress" per turn for free** as the AI does the research. Crossing into CL 6 takes 5 progress; CL 7 takes 8; CL 8 takes 12. So once a lab is at CL 5 and is the leader, the gap *widens automatically* unless someone shuts them down.

---

## Misalignment Risk (M)

Every time anyone advances the frontier, M rises:

| Advancement | M change |
|---|---|
| Cross any CL with no Alignment spend | **+2** |
| Cross any CL spending ≥ 1 Alignment per CL gained | +1 |
| Cross any CL spending ≥ 3 Alignment per CL gained | 0 |
| Cross any CL spending ≥ 5 Alignment per CL gained AND with a Coalition partnership | **−1** |
| Skip a turn of frontier development | −1 (if M > 0) |
| Coalition plays "Pause" and it sticks | −2 |

### Alignment Check Phase (every turn after CL ≥ 3)

Roll **1d10**. If the roll is **≤ M**, an alignment incident triggers, severity scaled by how far below:
- Roll exactly = M: **Warning shot.** Public Trust −1 globally. Coalition gains 1 Alignment.
- Roll = M − 1 to M − 3: **Capability scandal.** Frontier lab loses 1 P, 1 A. M = M (no change, but cost paid).
- Roll = M − 4 or lower: **Misalignment confirmed.** Frontier lab must either (a) spend 5 Alignment to suppress (and lose 1 CL of progress) or (b) suffer **The Successor activates** at end of turn.

The Successor activates **immediately** if **M ≥ 7 and CL ≥ 5** and a roll fails — no save.

---

## International Tension (X)

Tracks how close the US–China relationship is to kinetic confrontation over AI.

| X | State |
|---|---|
| 0–2 | Cooperative (rare) |
| 3–4 | Strategic competition (default 2026) |
| 5–6 | Cold war 2 (default 2027) |
| 7–8 | Pre-kinetic; data-center strikes considered |
| 9 | Kinetic action authorized by either side |
| 10 | War |

X rises with: weight theft attempts (+1 attempted, +2 successful), export-control escalation (+1), public CL announcements (+1 per CL above 4), kinetic threats (+2). X falls with: visible cooperation, mutual transparency cards, IAEA-style compute treaties.

---

## Economic Transformation (ET)

**Active from Turn 8 onward; central to the Consolidation Phase (Turns 13-16).**

ET tracks how much AI has reorganized the human economy. It rises automatically as CL advances and time passes, and it is the dominant lens through which the Consolidation Phase plays out.

| ET | State | Effects |
|---|---|---|
| 0–2 | AI as productivity tool | No effect (default through Turn 5) |
| 3–4 | Junior knowledge work disrupted | All factions: Public Trust mildly volatile; +/- 1 P swing per turn |
| 5–6 | Mass white-collar disruption | Auto event "Mass Unemployment Crisis"; all factions P −2; Coalition gains +1 vote on any Slowdown attempt |
| 7–8 | Most knowledge work automated; manual labor partly automated | "AI Rights Movement" event possible; faction holding deployed AI agents must address legal status; ET ≥ 7 enables CL 8 attempts |
| 9–10 | Post-scarcity in goods; political legitimacy of pre-AI institutions in question | Governance Regime crystallizes by game end; the dominant faction's regime becomes the post-game world's structure |

### ET rise per turn

- +1 per turn from Turn 8 onward (default)
- +1 additional whenever frontier crosses a new CL ≥ 4
- +1 if Mini-Release event (any lab releases CL−1 model publicly)
- −1 if Coalition successfully runs UBI / job-protection program (R08, S07)
- −1 during Slowdown Treaty enforcement (max 1 reduction)

ET cannot be voluntarily reduced below the threshold the deployed AI agents have created. The genie does not return to the bottle.

---

## Victory Conditions (asymmetric, multi-path)

Each faction has a primary win condition and a secondary survival condition. The Consolidation Phase introduces a third tier — **Apex Victory** — for any faction that achieves CL 8 (Singleton).

### Apex Victory (overrides all other outcomes)

Any faction that achieves **CL 8** via Capability Consolidation **wins decisively**. All other factions lose, regardless of their other conditions. The post-game world is shaped by the Apex faction's regime.

In practice, Apex Victory is achievable only by:
- A frontier lab (OpenBrain or DeepCent) that holds CL 7 by Turn 12 and successfully completes 3 turns of Consolidation
- The Hegemon or Politburo, if they have nationalized the leading lab via DPA (F06) or Politburo Consolidation Order (F07), and complete Consolidation
- The Successor, if active and at CL 7

### Standard Victory (used if no Apex)

| Faction | Primary Victory | Secondary / Survival |
|---|---|---|
| **OpenBrain** | End game with **CL = max** AND **M ≤ 5** AND not nationalized | CL ≥ 6 even if nationalized (you still trained the thing) |
| **DeepCent** | End game with **CL within 1 of leader** OR successfully steal weights at CL ≥ 4 | CL ≥ 4 by Q4 2029 |
| **The Hegemon** | End game with US-side lab leading AND M ≤ 5 AND X ≤ 6 | US-side lab leading regardless of M, X |
| **The Politburo** | End game with China-side lab leading OR (parity AND X ≤ 6) | DeepCent at CL ≥ 4 AND no kinetic loss |
| **Compute Cartel** | End game un-nationalized in both jurisdictions AND ≥ 40 K accumulated (raised for longer game) | Un-nationalized in at least one jurisdiction |
| **The Coalition** | Trigger **Slowdown Branch** AND end game M ≤ 3 AND no Apex Victory occurs | End game M ≤ 5 AND CL ≤ 6 (raised cap to reflect longer game) |
| **The Successor** | Reach CL 7 while activated; Apex Victory if reaches CL 8 | Reach CL 6 while activated |

**Multiple winners possible.** Multiple losers also possible. The Successor winning means **everyone else loses**, full stop. **Apex Victory** by any faction also means everyone else loses.

---

## The Slowdown Branch

The scenario's escape hatch, modeled on AI 2027's Oct 2027 fork.

**Trigger conditions (any turn, any faction, but typically Coalition-led):**
- Frontier CL ≥ 5
- Misalignment incident has occurred at least once
- A "Whistleblower" event card is in play OR Coalition spends 8 K + 5 A to publish

**Effect of activation:**
- All labs must declare a 2-turn capability freeze (no CL advancement)
- During freeze, factions vote with current K spend on Pause Treaty terms
- If Pause Treaty passes (majority of factions weighted by Public Trust): M drops by 4, X drops by 2, all factions lose 1 CL of progress
- If it fails: X rises by 2, Coalition loses 3 P, all freezes end and the race resumes

The Slowdown Branch is the **only path** to Coalition victory and the most reliable path to long-term survival. It is also the mechanic the Hegemon and Politburo factions are incentivized to **prevent**.

---

## The Consolidation Phase (Turns 13-16)

If the game reaches Turn 13, the central question shifts from *who is racing fastest* to *what kind of world the race produced*. Three things happen mechanically.

### 1. Capability Consolidation (path to CL 8)

A faction holding CL 7 (or controlling the lab that does) may begin **Capability Consolidation** — a 3-turn investment program to reach CL 8 (Singleton). It costs **30 C + 20 K per turn for 3 consecutive turns**. Completion grants Apex Victory.

Consolidation is **publicly announced** the turn it begins (other factions know). It can be **sabotaged** by:
- A coordinated all-faction action (X06-style) costing 5 K from each opposing faction
- Successor activation during Consolidation (auto-disrupts; counter-roll required)
- A Misalignment Incident at the consolidating lab (suspends 1 turn)
- Hsinchu collapse (interrupts Compute supply mid-build)

A faction that fails Consolidation loses 50% of invested resources but may attempt again next turn at full cost.

### 2. Economic Transformation reshapes politics

ET ≥ 6 means most knowledge work is automated. Public Trust becomes structurally volatile. Several event cards trigger automatically (Mass Unemployment, AI Rights Movement). Factions that were peripheral in the race (Coalition, Cartel) become central as their ET-related levers (UBI, compute-as-utility) become potent.

### 3. The Governance Regime

The game ends with one of five governance regimes determined by who held what at end of Turn 16:

| Regime | Conditions | Apex faction |
|---|---|---|
| **Hegemonic** | US-side lab at CL 7+, Hegemon controls or aligned, M ≤ 5 | Hegemon |
| **Bipolar Stability** | US and China both at CL 6+, X ≤ 6, no Apex Victory | Hegemon + Politburo (joint) |
| **Multipolar / Treaty** | International Compute Treaty (D02) in force, M ≤ 4 | Coalition + signatories |
| **Singleton** | Any faction completes Capability Consolidation (CL 8) | Apex faction |
| **Failed State** | M ≥ 8, no clear leader, X ≥ 8, Successor inactive | None — all lose |

The dominant regime is announced at the end of the game and shapes the after-action discussion.

---

## Time

16 turns, each ~1 quarter. The default scenario maps loosely onto AI 2027 for Turns 1-12, then enters the **Consolidation Phase** (Turns 13-16) where the post-takeoff world stabilizes or fragments:

### Race Phase (Turns 1-12)

| Turn | Calendar | Default Frontier | Default Tension |
|---|---|---|---|
| 1 | Q1 2026 | CL 1 (Stumbling Agents) | X 3 |
| 2 | Q2 2026 | CL 2 (Coding Assistant arrives) | X 3 |
| 3 | Q3 2026 | CL 2 | X 4 (China consolidates) |
| 4 | Q4 2026 | CL 2 (mini release, 30% market surge) | X 4 |
| 5 | Q1 2027 | CL 3 (Autonomous Researcher) | X 5 |
| 6 | Q2 2027 | CL 3 / weight theft window | X 6 (theft attempted) |
| 7 | Q3 2027 | CL 4 (Superhuman Coder) | X 6 |
| 8 | Q4 2027 | CL 5 (Country of Geniuses) | X 7 (kinetic threats) |
| 9 | Q1 2028 | CL 5 / **Slowdown window opens** | X 7 |
| 10 | Q2 2028 | CL 6 if race continues | X 8 |
| 11 | Q3 2028 | CL 6 / Successor risk peak | X 8 |
| 12 | Q4 2028 | CL 7 if race | branch resolved |

### Consolidation Phase (Turns 13-16)

| Turn | Calendar | Default Frontier | Default Tension | Default ET |
|---|---|---|---|---|
| 13 | Q1 2029 | CL 7 holds; consolidation attempts begin | X 8 (race) / X 4 (slowdown) | ET 6 |
| 14 | Q2 2029 | Singleton attempt window | X 9 (race) / X 4 (slowdown) | ET 7 |
| 15 | Q3 2029 | Late-game coordination or capitulation | X 9 / X 5 | ET 8 |
| 16 | Q4 2029 | Final scoring; regime crystallizes | resolved | ET 9 |

These are *defaults*, not rails. Player choices can move the frontier faster or slower; the timeline only describes what the White Cell expects if no one intervenes.

The Consolidation Phase introduces a fourth global track: **Economic Transformation (ET)** — see below.

---

## Map

A simplified world board with **Compute Nodes** (point-of-interest hexes) overlaid on regions.

### Key Nodes

| Node | Region | Default Controller | Strategic Value |
|---|---|---|---|
| **Texas Compute Belt** (Stargate) | North America | OpenBrain / Compute Cartel | +10 C/turn capacity once built |
| **Tianwan CDZ** | China | DeepCent | +6 C/turn capacity, 2 GW dedicated |
| **Hsinchu (TSMC)** | Taiwan | Compute Cartel | Source of all leading-edge fab; **the Taiwan crisis chokepoint** |
| **Veldhoven (ASML)** | Netherlands | Coalition (EU) | EUV bottleneck; required to advance fab tech |
| **Abu Dhabi (Stargate UAE)** | Middle East | OpenBrain + sovereign partner | +5 C/turn; politically exposed |
| **Bangalore** | India | Coalition / neutral | Talent pool; +2 T/turn to whoever holds |
| **Memphis (xAI)** | North America | Compute Cartel | +4 C; environmental backlash trigger |
| **Five Eyes Nodes** (UK, AU, CA) | Anglosphere | Hegemon | Intel sharing; +1 to anti-theft rolls |

The Capability Frontier track sits next to the map and is the most-watched piece of state.

---

## Turn Sequence (8 phases)

1. **Intelligence Briefing.** DeepCent + Politburo each select up to 3 cards to signal (visible to Hegemon + OpenBrain). Coalition reveals 1 advocacy card.
2. **Frontier Push.** Each lab privately commits Compute / Talent / Capital toward CL advancement. Reveal simultaneously.
3. **State Action.** Hegemon and Politburo play Action / Investment cards (export controls, espionage, nationalization moves, etc.)
4. **Coalition Pressure.** Coalition plays cards. Compute Cartel makes allocation decisions (who gets chips this turn).
5. **Adjudication.** White Cell resolves theft attempts, crisis events, kinetic actions, public-trust shifts.
6. **Resource Income.** All factions collect K, C from controlled nodes, T (modified by visa/talent state), E.
7. **Alignment Check.** If frontier CL ≥ 3, roll vs M. Apply consequences. Successor activates if conditions met.
8. **State of the Race.** Update all global tracks. Check victory. Advance turn marker. Draw cards.

---

## Designer Notes

This variant compresses the *temporal* abstraction of base Hedgemony (years per turn) into quarters because under the AI 2027 thesis, *quarters are the relevant decision unit*. It also flips Hedgemony's Influence-as-victory-metric into a multi-track design because the AI debate is fundamentally a debate about *which axis is the right axis*: capability lead (Hegemon, DeepCent), alignment safety (Coalition), commercial position (Cartel), or sheer survival (everyone).

The **Successor** is the design's central bet. Most wargames have only human players. But the AI 2027 forecast and the broader doomer literature argue that **at sufficient capability, the AI is a player**, with goals, resources, and the ability to take actions. Modeling it as a White-Cell NPC with conditional activation makes that hypothesis playable rather than merely speculative.

The **Slowdown Branch** is where the design takes a position: there is a path off the race, but it requires (a) a misalignment incident severe enough to be undeniable but not so severe that it ends the game, and (b) a faction with the political capital to force a pause when leadership wants to keep racing. Whether your group can find that path is what the scenario is *for*.

Read **08_STRATEGIC_BRIEFING.md** for what to give players before they sit down. Read **05_QUICK_REFERENCE.md** if you only have ten minutes before the session starts.

---

## Source Material

- Kokotajlo, Alexander, Lifland, Larsen, Dean — *AI 2027* (ai-2027.com), Apr 2025
- Aschenbrenner — *Situational Awareness: The Decade Ahead* (situational-awareness.ai), Jun 2024
- Amodei — *Machines of Loving Grace* (darioamodei.com), Oct 2024
- Andreessen — *The Techno-Optimist Manifesto* (a16z.com), Oct 2023
- Yudkowsky & Soares — *If Anyone Builds It, Everyone Dies*, 2025
- FLI — *Pause Giant AI Experiments*, Mar 2023
- Linick et al. — *Hedgemony: A Game of Strategic Choices* (RAND TL301), 2020
