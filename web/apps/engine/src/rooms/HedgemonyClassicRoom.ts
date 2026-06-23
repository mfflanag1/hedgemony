/**
 * Original RAND Hedgemony (TL301) — "classic" Colyseus room.
 *
 * A facilitated *virtual tabletop*: the engine maintains board/trackers and the
 * 5-phase turn; the White Cell adjudicates (places/moves forces, rolls dice,
 * edits trackers), as in the real game. Blue is free-play; Red signals.
 * LOCAL STUDY USE ONLY — see ORIGINAL/NOTICE.md.
 */
import { Room, Client } from "@colyseus/core";
import {
  CLASSIC_FACTION_ORDER,
  CLASSIC_FACTIONS,
  CLASSIC_CAPABILITIES,
  IDLE_DISPOSE_MS,
  type ClassicFactionId,
  type ClassicCapability,
  type ClassicCardEffect,
} from "@hedgemony/shared";
import { ParticipantSchema } from "../schema/state";
import { ClassicState, ClassicForceSchema } from "../classic/state";
import { bootstrapClassicScenario, advanceClassicPhase, allReady } from "../classic/phases";
import { applyClassicCardEffects } from "../classic/cardEffects";
import { SeededRng, randomSeedString } from "../logic/rng";
import { pushLog } from "../logic/log";
import { pushDice } from "../logic/dice";
import { saveClassicGameMeta, saveClassicSnapshot, loadLatestSnapshot, deserializeClassicState } from "../logic/persistence";

interface JoinOptions {
  role?: "player" | "white-cell" | "spectator";
  displayName?: string;
}

export class HedgemonyClassicRoom extends Room<ClassicState> {
  override maxClients = 12;
  private rng!: SeededRng;
  private disposeTimer: ReturnType<typeof setTimeout> | undefined;
  private snapshotTimer: ReturnType<typeof setTimeout> | undefined;

  override async onCreate(options: Record<string, unknown>) {
    this.autoDispose = false;
    const restoreId =
      typeof options?.restoreGameId === "string" && options.restoreGameId
        ? options.restoreGameId
        : this.roomId;
    let restored = false;
    try {
      const snap = await loadLatestSnapshot(restoreId);
      if (snap) {
        const state = deserializeClassicState(snap);
        this.setState(state);
        this.rng = new SeededRng(state.seed, state.rollCounter);
        restored = true;
        console.log(`[ClassicRoom] restored ${this.roomId} from ${restoreId} (T${state.turn}P${state.phase}, status=${state.status})`);
      }
    } catch (err) {
      console.warn(`[ClassicRoom] restore from ${restoreId} failed:`, (err as Error).message);
    }

    if (!restored) {
      const state = new ClassicState();
      state.seed = randomSeedString();
      this.setState(state);
      this.rng = new SeededRng(state.seed);
      bootstrapClassicScenario(state);
      console.log(`[ClassicRoom] created ${this.roomId} seed=${state.seed}`);
    }

    this.onMessage("claim-faction", this.handleClaimFaction.bind(this));
    this.onMessage("start-game", this.handleStartGame.bind(this));
    this.onMessage("confirm-phase", this.handleConfirmPhase.bind(this));
    this.onMessage("unconfirm-phase", this.handleUnconfirmPhase.bind(this));
    this.onMessage("signal-cards", this.handleSignalCards.bind(this));
    this.onMessage("play-card", this.handlePlayCard.bind(this));
    // White Cell adjudication
    this.onMessage("wc-place-force", this.handlePlaceForce.bind(this));
    this.onMessage("wc-remove-force", this.handleRemoveForce.bind(this));
    this.onMessage("wc-move-force", this.handleMoveForce.bind(this));
    this.onMessage("wc-adjust-tracker", this.handleAdjustTracker.bind(this));
    this.onMessage("wc-set-modlevel", this.handleSetModLevel.bind(this));
    this.onMessage("wc-roll", this.handleRoll.bind(this));
    this.onMessage("inject-log", this.handleInjectLog.bind(this));
    this.onMessage("pause-game", this.handlePause.bind(this));
    this.onMessage("resume-game", this.handleResume.bind(this));
    this.onMessage("force-advance-phase", this.handleForceAdvance.bind(this));

    this.scheduleIdleDispose();
  }

  override onJoin(client: Client, options: JoinOptions | undefined) {
    this.cancelIdleDispose();
    const role = options?.role ?? "player";
    const p = new ParticipantSchema();
    p.sessionId = client.sessionId;
    p.displayName = options?.displayName ?? `player-${client.sessionId.slice(0, 6)}`;
    p.role = role;
    p.connected = true;
    this.state.participants.set(client.sessionId, p);
    if (!this.state.ownerSessionId) this.state.ownerSessionId = client.sessionId;
    pushLog(this.state, { eventType: "join", message: `${p.displayName} joined as ${role}` });
  }

  override onLeave(client: Client) {
    const p = this.state.participants.get(client.sessionId);
    if (this.state.status === "lobby") {
      this.state.participants.delete(client.sessionId);
      if (this.state.ownerSessionId === client.sessionId) {
        this.state.ownerSessionId = Array.from(this.state.participants.keys())[0] ?? "";
      }
    } else if (p) {
      p.connected = false;
    }
    this.scheduleIdleDispose();
  }

  override async onDispose() {
    this.cancelIdleDispose();
    if (this.snapshotTimer) {
      clearTimeout(this.snapshotTimer);
      this.snapshotTimer = undefined;
    }
    try {
      await Promise.race([
        saveClassicSnapshot(this.roomId, this.state),
        new Promise((res) => setTimeout(res, 3000)),
      ]);
    } catch (err) {
      console.warn(`[ClassicRoom ${this.roomId}] final snapshot failed:`, (err as Error).message);
    }
    console.log(`[ClassicRoom] disposed ${this.roomId}`);
  }

  // --------- player moves ---------

  private handleClaimFaction(client: Client, msg: { factionId: ClassicFactionId }) {
    if (this.state.status !== "lobby") return this.reject(client, "game already started");
    if (!CLASSIC_FACTION_ORDER.includes(msg.factionId)) return this.reject(client, "unknown faction");
    let taken = false;
    this.state.participants.forEach((pp) => {
      if (pp.sessionId !== client.sessionId && pp.factionId === msg.factionId) taken = true;
    });
    if (taken) return this.reject(client, "faction already taken");
    const me = this.state.participants.get(client.sessionId);
    if (!me) return this.reject(client, "not a participant");
    me.factionId = msg.factionId;
    pushLog(this.state, { eventType: "claim-faction", actor: msg.factionId, message: `${me.displayName} claimed ${CLASSIC_FACTIONS[msg.factionId].name}` });
  }

  private handleStartGame(client: Client) {
    if (this.state.ownerSessionId !== client.sessionId) return this.reject(client, "only owner can start");
    if (this.state.status !== "lobby") return this.reject(client, "already started");
    let claimed = 0;
    this.state.participants.forEach((p) => { if (p.role === "player" && p.factionId) claimed += 1; });
    if (claimed < 2) return this.reject(client, "need at least 2 factions claimed");
    this.state.status = "active";
    pushLog(this.state, { eventType: "game-start", message: `Classic game started with ${claimed} factions.` });
    this.scheduleSnapshot();
  }

  private handleConfirmPhase(client: Client) {
    if (this.state.status === "paused") return this.reject(client, "game paused");
    if (this.state.status !== "active") return;
    const f = this.factionFor(client);
    if (!f) return this.reject(client, "not a seated player");
    f.ready = true;
    pushLog(this.state, { eventType: "confirm-phase", actor: f.id, message: `${f.id} confirmed Phase ${this.state.phase}` });
    this.maybeAdvance();
  }

  private handleUnconfirmPhase(client: Client) {
    if (this.state.status !== "active") return;
    const f = this.factionFor(client);
    if (f) f.ready = false;
  }

  private handleSignalCards(client: Client, msg: { cardIds: string[] }) {
    if (this.state.status !== "active") return this.reject(client, "game not active");
    if (this.state.phase !== 1) return this.reject(client, "signaling only in Phase 1 (Red Signaling)");
    const f = this.factionFor(client);
    if (!f) return this.reject(client, "not a seated player");
    if (f.side !== "red") return this.reject(client, "only Red factions signal");
    const ids = (Array.isArray(msg.cardIds) ? msg.cardIds : []).slice(0, 3);
    f.signaledCards.length = 0;
    for (const id of ids) f.signaledCards.push(id);
    pushLog(this.state, { eventType: "signal-cards", actor: f.id, message: `${f.id} signaled ${ids.length} card(s) to Blue.` });
    this.scheduleSnapshot();
  }

  private handlePlayCard(client: Client, msg: { cardId?: string; title?: string; costRp?: number; effects?: ClassicCardEffect[] }) {
    if (this.state.status !== "active") return this.reject(client, "game not active");
    const f = this.factionFor(client);
    if (!f) return this.reject(client, "not a seated player");
    const cardId = (msg.cardId ?? "").trim().slice(0, 80);
    if (!cardId) return this.reject(client, "missing card id");
    const title = (msg.title ?? "").trim().slice(0, 120);
    const isBluePhase = this.state.phase === 2 && f.side === "blue";
    const isRedPhase = this.state.phase === 3 && f.side === "red";
    if (!isBluePhase && !isRedPhase) {
      return this.reject(client, "cards can be played only in your action phase");
    }
    if (f.side === "red" && f.signaledCards.length > 0 && !f.signaledCards.includes(cardId)) {
      return this.reject(client, "red card was not signaled this turn");
    }
    const costRp = Math.max(0, Math.floor(msg.costRp || 0));
    if (costRp > 0) {
      if (f.rp < costRp) return this.reject(client, `insufficient RP (need ${costRp})`);
      f.rp -= costRp;
    }
    f.playedCards.push(cardId);
    const applied = applyClassicCardEffects(this.state, f.id as ClassicFactionId, msg.effects, this.rng);
    const tail = applied.length > 0
      ? ` Effects: ${applied.join("; ")}.`
      : " White Cell adjudicates effects.";
    pushLog(this.state, {
      eventType: "play-card",
      actor: f.id,
      message: `${f.id} played ${title ? `${title} (${cardId})` : cardId}${costRp > 0 ? ` for ${costRp} RP` : ""}.${tail}`,
    });
    this.scheduleSnapshot();
  }

  // --------- White Cell adjudication ---------

  private handlePlaceForce(client: Client, msg: { aor: string; factionId: ClassicFactionId; count: number; modLevel: number }) {
    if (!this.requireWC(client)) return;
    const aor = this.state.aors.get(msg.aor);
    if (!aor) return this.reject(client, "unknown AOR");
    const count = Math.max(1, Math.floor(msg.count || 0));
    const modLevel = Math.max(0, Math.floor(msg.modLevel || 0));
    const existing = aor.forces.find((x) => x.factionId === msg.factionId && x.modLevel === modLevel);
    if (existing) {
      existing.count += count;
    } else {
      const fc = new ClassicForceSchema();
      fc.factionId = msg.factionId; fc.count = count; fc.modLevel = modLevel;
      aor.forces.push(fc);
    }
    pushLog(this.state, { eventType: "wc-place-force", actor: "white-cell", message: `Placed ${count}×Mod${modLevel} ${msg.factionId} FF in ${msg.aor}.` });
    this.scheduleSnapshot();
  }

  private handleRemoveForce(client: Client, msg: { aor: string; factionId: ClassicFactionId; modLevel: number; count: number }) {
    if (!this.requireWC(client)) return;
    const aor = this.state.aors.get(msg.aor);
    if (!aor) return this.reject(client, "unknown AOR");
    const idx = aor.forces.findIndex((x) => x.factionId === msg.factionId && x.modLevel === Math.floor(msg.modLevel));
    if (idx < 0) return this.reject(client, "no matching force stack");
    const stack = aor.forces[idx]!;
    const remove = Math.max(1, Math.floor(msg.count || 0));
    stack.count -= remove;
    if (stack.count <= 0) aor.forces.splice(idx, 1);
    pushLog(this.state, { eventType: "wc-remove-force", actor: "white-cell", message: `Removed ${remove}×Mod${msg.modLevel} ${msg.factionId} FF from ${msg.aor}.` });
    this.scheduleSnapshot();
  }

  private handleMoveForce(client: Client, msg: { fromAor: string; toAor: string; factionId: ClassicFactionId; modLevel: number; count: number }) {
    if (!this.requireWC(client)) return;
    this.handleRemoveForce(client, { aor: msg.fromAor, factionId: msg.factionId, modLevel: msg.modLevel, count: msg.count });
    this.handlePlaceForce(client, { aor: msg.toAor, factionId: msg.factionId, count: msg.count, modLevel: msg.modLevel });
    pushLog(this.state, { eventType: "wc-move-force", actor: "white-cell", message: `Moved ${msg.count}×Mod${msg.modLevel} ${msg.factionId} FF ${msg.fromAor} → ${msg.toAor}.` });
    this.scheduleSnapshot();
  }

  private handleAdjustTracker(client: Client, msg: { factionId: ClassicFactionId; field: "rp" | "ip" | "techLevel" | "readiness"; delta: number }) {
    if (!this.requireWC(client)) return;
    const f = this.state.factions.get(msg.factionId);
    if (!f) return this.reject(client, "unknown faction");
    const delta = Math.floor(msg.delta || 0);
    if (msg.field === "rp") f.rp = Math.max(0, f.rp + delta);
    else if (msg.field === "ip") f.ip = Math.max(0, f.ip + delta);
    else if (msg.field === "techLevel") f.techLevel = Math.max(0, f.techLevel + delta);
    else if (msg.field === "readiness") f.readiness = Math.max(0, f.readiness + delta);
    else return this.reject(client, "unknown tracker field");
    pushLog(this.state, { eventType: "wc-adjust", actor: "white-cell", message: `${msg.factionId} ${msg.field} ${delta >= 0 ? "+" : ""}${delta} → ${f[msg.field]}.` });
    this.scheduleSnapshot();
  }

  private handleSetModLevel(client: Client, msg: { factionId: ClassicFactionId; capability: ClassicCapability; level: number }) {
    if (!this.requireWC(client)) return;
    const f = this.state.factions.get(msg.factionId);
    if (!f) return this.reject(client, "unknown faction");
    if (!CLASSIC_CAPABILITIES.includes(msg.capability)) return this.reject(client, "unknown capability");
    f.modLevels.set(msg.capability, Math.max(0, Math.floor(msg.level)));
    pushLog(this.state, { eventType: "wc-modlevel", actor: "white-cell", message: `${msg.factionId} ${msg.capability} Mod set to ${Math.floor(msg.level)}.` });
    this.scheduleSnapshot();
  }

  private handleRoll(client: Client, msg: { sides?: number; label?: string; modifier?: number }) {
    if (!this.requireWC(client)) return;
    const sides = msg.sides === 6 ? 6 : 10;
    const roll = this.rng.roll(sides);
    const modifier = Math.floor(msg.modifier || 0);
    this.state.rollCounter = this.rng.getCounter();
    pushDice(this.state, {
      rollType: msg.label?.slice(0, 40) || `d${sides}`,
      actor: "white-cell",
      dice: [roll],
      modifierTotal: modifier,
      result: roll + modifier,
    });
    this.scheduleSnapshot();
  }

  private handleInjectLog(client: Client, msg: { message: string }) {
    if (!this.requireWC(client)) return;
    const text = (msg.message ?? "").trim();
    if (!text) return this.reject(client, "empty message");
    pushLog(this.state, { eventType: "wc-note", actor: "white-cell", message: text.slice(0, 500) });
  }

  private handlePause(client: Client) {
    if (!this.requireWC(client)) return;
    if (this.state.status !== "active") return this.reject(client, "game not active");
    this.state.status = "paused";
    pushLog(this.state, { eventType: "pause", actor: "white-cell", message: "White Cell paused the game." });
    this.scheduleMetaSave();
  }

  private handleResume(client: Client) {
    if (!this.requireWC(client)) return;
    if (this.state.status !== "paused") return this.reject(client, "game not paused");
    this.state.status = "active";
    pushLog(this.state, { eventType: "resume", actor: "white-cell", message: "White Cell resumed the game." });
    this.scheduleMetaSave();
    this.maybeAdvance();
  }

  private handleForceAdvance(client: Client) {
    if (!this.requireWC(client)) return;
    if (this.state.status !== "active") return this.reject(client, "game not active");
    pushLog(this.state, { eventType: "force-advance", actor: "white-cell", message: `White Cell force-advanced from Phase ${this.state.phase}.` });
    this.state.factions.forEach((f) => { f.ready = true; });
    this.maybeAdvance();
  }

  // --------- helpers ---------

  private factionFor(client: Client) {
    const p = this.state.participants.get(client.sessionId);
    if (!p || !p.factionId) return null;
    return this.state.factions.get(p.factionId) ?? null;
  }

  private requireWC(client: Client): boolean {
    const p = this.state.participants.get(client.sessionId);
    if (p?.role !== "white-cell") {
      this.reject(client, "White Cell only");
      return false;
    }
    return true;
  }

  private reject(client: Client, reason: string) {
    client.send("error", { reason });
  }

  private maybeAdvance() {
    if (this.state.status !== "active") return;
    if (!allReady(this.state)) return;
    const result = advanceClassicPhase(this.state);
    for (const e of result.events) {
      pushLog(this.state, { eventType: "phase", message: e });
    }
    this.scheduleSnapshot();
  }

  private scheduleSnapshot() {
    if (this.snapshotTimer) clearTimeout(this.snapshotTimer);
    this.snapshotTimer = setTimeout(() => {
      this.snapshotTimer = undefined;
      saveClassicSnapshot(this.roomId, this.state).catch((err) => {
        console.warn(`[ClassicRoom ${this.roomId}] snapshot failed:`, (err as Error).message);
      });
    }, 500);
  }

  private scheduleMetaSave() {
    saveClassicGameMeta(this.roomId, this.state).catch((err) => {
      console.warn(`[ClassicRoom ${this.roomId}] meta save failed:`, (err as Error).message);
    });
  }

  private scheduleIdleDispose() {
    this.cancelIdleDispose();
    if (this.state.status !== "lobby") return;
    this.disposeTimer = setTimeout(() => {
      if (this.clients.length === 0 && this.state.status === "lobby") this.disconnect();
    }, IDLE_DISPOSE_MS);
  }

  private cancelIdleDispose() {
    if (this.disposeTimer) { clearTimeout(this.disposeTimer); this.disposeTimer = undefined; }
  }
}
