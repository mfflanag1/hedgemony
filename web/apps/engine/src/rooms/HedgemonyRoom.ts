import { Room, Client } from "@colyseus/core";
import {
  HedgemonyState,
  FactionStateSchema,
  Resources,
  ParticipantSchema,
} from "../schema/state";
import {
  FACTION_ORDER,
  STARTING_POSITIONS,
  FACTIONS,
  IDLE_DISPOSE_MS,
} from "@hedgemony/shared";
import type { FactionId } from "@hedgemony/shared";
import { catalog } from "@hedgemony/spec";
import { SeededRng, randomSeedString } from "../logic/rng";
import { dealStartingHand } from "../logic/deckBuilder";
import { advancePhase, allReady } from "../logic/phases";
import { pushLog } from "../logic/log";
import { applyCardEffect } from "../logic/cardEffects";
import {
  initiateConsolidation,
  advanceConsolidation,
  coordinateAgainstConsolidation,
} from "../logic/consolidation";
import {
  bootstrapBilateralThreads,
  getOrCreateBilateralThread,
  createCoalitionThread,
  isParticipant,
  appendMessage,
  markRead,
} from "../logic/press";
import { saveSnapshot, saveGameMeta, loadLatestSnapshot, deserializeState } from "../logic/persistence";

interface JoinOptions {
  role?: "player" | "white-cell" | "spectator";
  displayName?: string;
}

interface ClaimFactionMsg {
  factionId: FactionId;
}

interface ConfirmPhaseMsg {}
interface UnconfirmPhaseMsg {}

interface FrontierPushMsg {
  spendK: number;
  spendC: number;
  spendT: number;
  spendA: number;
  targetCL: number;
}

interface PlayCardMsg {
  cardIdKey: string; // "action:F01"
}

interface StartGameMsg {}

interface SendMessageMsg {
  threadId?: string;
  toFactionId?: FactionId; // for bilateral shorthand: "just talk to this faction"
  body: string;
}

interface CreateCoalitionThreadMsg {
  participantFactionIds: FactionId[];
  name?: string;
}

interface MarkReadMsg {
  threadId: string;
}

interface AllocateComputeMsg {
  allocations: Partial<Record<FactionId, number>>;
}

interface InjectLogMsg {
  message: string;
  eventType?: string;
}

interface ActivateSuccessorMsg {
  spawnedFrom?: FactionId; // defaults to leader
}

interface SignalCardsMsg {
  /** Card id keys ("type:id") from the sender's hand; up to 3. Empty clears. */
  cardIds: string[];
}

/**
 * One Hedgemony game session.
 *
 * Phase-1 complete: phase machine, Frontier Push, alignment check, income,
 * card dealing, stub card play.
 *
 * Deferred for later phases: negotiation (Phase 3), White Cell tools
 * (Phase 4), Successor full mechanics (Phase 5), Consolidation + endgame
 * scoring (Phase 5), AAR export (Phase 6).
 */
export class HedgemonyRoom extends Room<HedgemonyState> {
  override maxClients = 10;

  private rng!: SeededRng;
  private disposeTimer: ReturnType<typeof setTimeout> | undefined = undefined;
  /** Debounced snapshot save — schedule once per phase transition, not per
   *  moving part of it. Cleared on save or dispose. */
  private snapshotTimer: ReturnType<typeof setTimeout> | undefined = undefined;

  override async onCreate(options: Record<string, unknown>) {
    // Manage disposal manually so that the brief socket-close during
    // /games/new → /games/[id] navigation doesn't destroy the freshly-created
    // room. See onLeave for the idle timer.
    this.autoDispose = false;

    // Phase 4d — live restoration. If a snapshot exists (either an explicit
    // `restoreGameId` to resume a prior game, or this room's own id after a
    // server restart), rebuild state from it instead of bootstrapping fresh.
    // Fail-soft: no snapshot / DB down → fresh bootstrap (the common path).
    const restoreId =
      typeof options?.restoreGameId === "string" && options.restoreGameId
        ? (options.restoreGameId as string)
        : this.roomId;
    let restored = false;
    try {
      const snap = await loadLatestSnapshot(restoreId);
      if (snap) {
        const state = deserializeState(snap);
        this.setState(state);
        this.rng = new SeededRng(state.seed, state.rollCounter);
        restored = true;
        console.log(
          `[HedgemonyRoom] restored ${this.roomId} from ${restoreId} (T${state.turn}P${state.phase}, status=${state.status})`
        );
      }
    } catch (err) {
      console.warn(`[HedgemonyRoom] restore from ${restoreId} failed:`, (err as Error).message);
    }

    if (!restored) {
      const state = new HedgemonyState();
      state.seed = randomSeedString();
      this.setState(state);
      this.rng = new SeededRng(state.seed);
      this.bootstrapFactionStates();
      console.log(`[HedgemonyRoom] created ${this.roomId} seed=${state.seed}`);
    }

    this.onMessage("claim-faction", this.handleClaimFaction.bind(this));
    this.onMessage("start-game", this.handleStartGame.bind(this));
    this.onMessage("confirm-phase", this.handleConfirmPhase.bind(this));
    this.onMessage("unconfirm-phase", this.handleUnconfirmPhase.bind(this));
    this.onMessage("frontier-push", this.handleFrontierPush.bind(this));
    this.onMessage("play-card", this.handlePlayCard.bind(this));
    this.onMessage("send-message", this.handleSendMessage.bind(this));
    this.onMessage("create-coalition-thread", this.handleCreateCoalitionThread.bind(this));
    this.onMessage("mark-thread-read", this.handleMarkThreadRead.bind(this));
    this.onMessage("invoke-dpa", this.handleInvokeDPA.bind(this));
    this.onMessage("play-whistleblower", this.handlePlayWhistleblower.bind(this));
    this.onMessage("allocate-compute", this.handleAllocateCompute.bind(this));
    this.onMessage("honest-disclosure", this.handleHonestDisclosure.bind(this));
    // White Cell controls
    this.onMessage("pause-game", this.handlePauseGame.bind(this));
    this.onMessage("resume-game", this.handleResumeGame.bind(this));
    this.onMessage("force-advance-phase", this.handleForceAdvancePhase.bind(this));
    this.onMessage("inject-log", this.handleInjectLog.bind(this));
    this.onMessage("activate-successor", this.handleActivateSuccessor.bind(this));
    this.onMessage("signal-cards", this.handleSignalCards.bind(this));
    this.onMessage("initiate-consolidation", this.handleInitiateConsolidation.bind(this));
    this.onMessage("advance-consolidation", this.handleAdvanceConsolidation.bind(this));
    this.onMessage("coordinate-against-consolidation", this.handleCoordinateAgainstConsolidation.bind(this));
    this.onMessage("ping", (client) => {
      client.send("pong", { serverTime: Date.now() });
    });

    // Room was just created with no clients yet — start the idle timer so it
    // doesn't linger forever if nobody joins.
    this.scheduleIdleDispose();
  }

  override onJoin(client: Client, options: JoinOptions | undefined) {
    // Cancel any pending idle dispose — someone is here
    this.cancelIdleDispose();

    const role = options?.role ?? "player";
    const displayName = options?.displayName ?? `player-${client.sessionId.slice(0, 6)}`;
    const p = new ParticipantSchema();
    p.sessionId = client.sessionId;
    p.displayName = displayName;
    p.role = role;
    p.connected = true;
    this.state.participants.set(client.sessionId, p);

    if (!this.state.ownerSessionId) {
      this.state.ownerSessionId = client.sessionId;
    }

    pushLog(this.state, {
      eventType: "join",
      message: `${displayName} joined as ${role}`,
    });

    console.log(
      `[HedgemonyRoom ${this.roomId}] ${displayName} joined as ${role}`
    );
  }

  // The `consented` boolean from Colyseus indicates whether the client
  // left voluntarily (true) or was dropped (false). We don't differentiate
  // behavior today — lobby leavers get cleaned up the same way either way —
  // but the param is kept explicitly so the override contract is obvious.
  override onLeave(client: Client, _consented: boolean) {
    const p = this.state.participants.get(client.sessionId);

    if (this.state.status === "lobby") {
      // Lobby: the creator-socket from /games/new drops here when navigation
      // unmounts the component, and unclaimed lobby-goers can come and go.
      // Purge the participant entirely so the rejoin from /games/[id] shows
      // up as a fresh operator and can claim a faction / ownership.
      this.state.participants.delete(client.sessionId);
      if (this.state.ownerSessionId === client.sessionId) {
        // Hand ownership to another participant, or clear for next joiner
        const nextOwner = Array.from(this.state.participants.keys())[0];
        this.state.ownerSessionId = nextOwner ?? "";
      }
      if (p) {
        const sid = client.sessionId.slice(0, 6);
        pushLog(this.state, {
          eventType: "leave",
          message: `${p.displayName} (${sid}) left lobby`,
        });
        console.log(
          `[HedgemonyRoom ${this.roomId}] ${p.displayName} (${sid}) left lobby (${this.clients.length - 1} remaining)`
        );
      }
    } else {
      // Active / paused / ended: keep participant record so they can
      // reconnect and resume control of their faction.
      if (p) {
        p.connected = false;
        pushLog(this.state, {
          eventType: "leave",
          message: `${p.displayName} disconnected`,
        });
      }
    }

    this.scheduleIdleDispose();
  }

  override async onDispose() {
    this.cancelIdleDispose();
    if (this.snapshotTimer) {
      clearTimeout(this.snapshotTimer);
      this.snapshotTimer = undefined;
    }
    // Final snapshot on dispose — captures end-of-game state for AAR/audit.
    // Fire-and-await but with a short timeout ceiling via Promise.race.
    try {
      await Promise.race([
        saveSnapshot(this.roomId, this.state),
        new Promise((res) => setTimeout(res, 3000)),
      ]);
    } catch (err) {
      console.warn(`[HedgemonyRoom ${this.roomId}] final snapshot failed:`, (err as Error).message);
    }
    console.log(`[HedgemonyRoom] disposed ${this.roomId}`);
  }

  /**
   * Schedule a snapshot save. Debounced so rapid phase transitions only
   * produce one save per ~500ms window.
   */
  private scheduleSnapshot() {
    if (this.snapshotTimer) clearTimeout(this.snapshotTimer);
    this.snapshotTimer = setTimeout(() => {
      this.snapshotTimer = undefined;
      // Fire and forget — persistence is fail-soft and non-blocking.
      saveSnapshot(this.roomId, this.state).catch((err) => {
        console.warn(`[HedgemonyRoom ${this.roomId}] snapshot failed:`, (err as Error).message);
      });
    }, 500);
  }

  /** Non-snapshotting meta update — cheaper than a full snapshot when only
   *  status/pause changes. */
  private scheduleMetaSave() {
    saveGameMeta(this.roomId, this.state).catch((err) => {
      console.warn(`[HedgemonyRoom ${this.roomId}] meta save failed:`, (err as Error).message);
    });
  }

  private scheduleIdleDispose() {
    this.cancelIdleDispose();
    // Only auto-dispose during lobby. Active / paused / ended rooms must
    // survive temporary disconnects — otherwise a brief network blip for all
    // players mid-game would destroy their session. Long-term idle cleanup
    // for orphaned active games is a separate (longer-timer) mechanism
    // handled by operational tooling, not this in-room timer.
    if (this.state.status !== "lobby") return;
    this.disposeTimer = setTimeout(() => {
      if (this.clients.length === 0 && this.state.status === "lobby") {
        console.log(
          `[HedgemonyRoom ${this.roomId}] idle ${IDLE_DISPOSE_MS}ms (lobby) → disconnecting`
        );
        this.disconnect();
      }
    }, IDLE_DISPOSE_MS);
  }

  private cancelIdleDispose() {
    if (this.disposeTimer) {
      clearTimeout(this.disposeTimer);
      this.disposeTimer = undefined;
    }
  }

  // --------- move handlers ---------

  private handleClaimFaction(client: Client, msg: ClaimFactionMsg) {
    if (!FACTION_ORDER.includes(msg.factionId)) return this.reject(client, "unknown faction");

    const me = this.state.participants.get(client.sessionId);
    if (!me) return this.reject(client, "not a participant");

    if (msg.factionId === "Successor") {
      // The Successor is an NPC until it activates mid-game; the seat opens for
      // a human only after activation. A claimer must not already control
      // another faction (no abandoning a lab/state to take it).
      if (this.state.status !== "active") return this.reject(client, "Successor seat opens only after activation");
      if (!this.state.successorActive) return this.reject(client, "Successor is not active yet");
      if (me.factionId && me.factionId !== "Successor") {
        return this.reject(client, "leave your current faction before taking the Successor seat");
      }
    } else if (this.state.status !== "lobby") {
      return this.reject(client, "game already started");
    }

    // Already claimed by someone else?
    let taken = false;
    this.state.participants.forEach((p) => {
      if (p.sessionId !== client.sessionId && p.factionId === msg.factionId) {
        taken = true;
      }
    });
    if (taken) return this.reject(client, "faction already taken");

    me.factionId = msg.factionId;
    // Taking the Successor seat promotes a spectator into an active player.
    if (msg.factionId === "Successor") me.role = "player";
    pushLog(this.state, {
      eventType: "claim-faction",
      actor: msg.factionId,
      message: `${me.displayName} claimed ${FACTIONS[msg.factionId].displayName}`,
    });
  }

  private handleStartGame(client: Client, _msg: StartGameMsg) {
    if (this.state.ownerSessionId !== client.sessionId) {
      return this.reject(client, "only owner can start game");
    }
    if (this.state.status !== "lobby") return this.reject(client, "game already started");

    // Require at least 2 players with claimed factions
    let claimed = 0;
    this.state.participants.forEach((p) => {
      if (p.role === "player" && p.factionId) claimed += 1;
    });
    if (claimed < 2) return this.reject(client, "need at least 2 factions claimed");

    // Deal starting hands only to factions that are actually played
    const claimedFactions: FactionId[] = [];
    this.state.participants.forEach((p) => {
      if (p.role === "player" && p.factionId) claimedFactions.push(p.factionId as FactionId);
    });

    for (const id of claimedFactions) {
      const f = this.state.factions.get(id);
      if (!f) continue;
      const { hand, deck } = dealStartingHand(catalog, id, this.rng);
      for (const c of hand) f.handCardIds.push(c);
      for (const c of deck) f.deckCardIds.push(c);
    }

    // Pre-create bilateral threads so the UI can show every pair immediately
    bootstrapBilateralThreads(this.state, claimedFactions);

    this.state.status = "active";
    pushLog(this.state, {
      eventType: "game-start",
      message: `Game started with ${claimed} factions. Seed: ${this.state.seed}.`,
    });
    // Persist the initial post-deal state
    this.scheduleSnapshot();
  }

  private handleConfirmPhase(client: Client, _msg: ConfirmPhaseMsg) {
    if (this.state.status === "paused") return this.reject(client, "game is paused — wait for White Cell to resume");
    if (this.state.status !== "active") return;
    const faction = this.factionFor(client);
    if (!faction) return this.reject(client, "you are not a seated player");
    const f = this.state.factions.get(faction);
    if (!f) return;
    f.ready = true;
    pushLog(this.state, {
      eventType: "confirm-phase",
      actor: faction,
      message: `${faction} confirmed Phase ${this.state.phase}`,
    });
    this.maybeAdvance();
  }

  private handleUnconfirmPhase(client: Client, _msg: UnconfirmPhaseMsg) {
    if (this.state.status !== "active") return;
    const faction = this.factionFor(client);
    if (!faction) return;
    const f = this.state.factions.get(faction);
    if (!f) return;
    f.ready = false;
  }

  private handleFrontierPush(client: Client, msg: FrontierPushMsg) {
    if (this.state.status !== "active") return;
    if (this.state.phase !== 2) return this.reject(client, "Frontier Push only in Phase 2");
    const faction = this.factionFor(client);
    if (!faction) return this.reject(client, "not a seated player");
    if (faction !== "OpenBrain" && faction !== "DeepCent" && !(this.state.successorActive && faction === "Successor")) {
      return this.reject(client, "only labs can Frontier Push");
    }
    const f = this.state.factions.get(faction);
    if (!f) return;
    // Input validation
    if (msg.spendK < 0 || msg.spendC < 0 || msg.spendT < 0 || msg.spendA < 0) {
      return this.reject(client, "spend must be non-negative");
    }
    if (msg.targetCL < 1 || msg.targetCL > 7) {
      return this.reject(client, "targetCL must be 1..7");
    }
    f.frontierPushCommit.committed = true;
    f.frontierPushCommit.spendK = Math.floor(msg.spendK);
    f.frontierPushCommit.spendC = Math.floor(msg.spendC);
    f.frontierPushCommit.spendT = Math.floor(msg.spendT);
    f.frontierPushCommit.spendA = Math.floor(msg.spendA);
    f.frontierPushCommit.targetCL = Math.floor(msg.targetCL);
    pushLog(this.state, {
      eventType: "frontier-push-commit",
      actor: faction,
      visibility: faction, // private until revealed at phase exit
      message: `${faction} committed a Frontier Push (hidden until phase resolves)`,
    });
  }

  private handlePlayCard(client: Client, msg: PlayCardMsg) {
    if (this.state.status !== "active") return;
    const faction = this.factionFor(client);
    if (!faction) return this.reject(client, "not a seated player");
    const f = this.state.factions.get(faction);
    if (!f) return;
    const idx = f.handCardIds.indexOf(msg.cardIdKey);
    if (idx < 0) return this.reject(client, "card not in hand");
    const card = catalog.byId[msg.cardIdKey];
    if (!card) return this.reject(client, "card not in catalog");

    // Deduct cost. All six resources potentially appear in card costs
    // (though P is rare as a cost vs. a gain/loss). Validate first — don't
    // mutate until the whole cost is affordable.
    const cost = card.cost;
    if (cost.K && f.resources.K < cost.K) return this.reject(client, `insufficient K (need ${cost.K})`);
    if (cost.C && f.resources.C < cost.C) return this.reject(client, `insufficient C (need ${cost.C})`);
    if (cost.T && f.resources.T < cost.T) return this.reject(client, `insufficient T (need ${cost.T})`);
    if (cost.E && f.resources.E < cost.E) return this.reject(client, `insufficient E (need ${cost.E})`);
    if (cost.A && f.resources.A < cost.A) return this.reject(client, `insufficient A (need ${cost.A})`);
    if (cost.P && f.resources.P < cost.P) return this.reject(client, `insufficient P (need ${cost.P})`);
    f.resources.K -= cost.K ?? 0;
    f.resources.C -= cost.C ?? 0;
    f.resources.T -= cost.T ?? 0;
    f.resources.E -= cost.E ?? 0;
    f.resources.A -= cost.A ?? 0;
    f.resources.P -= cost.P ?? 0;

    // Discard
    f.handCardIds.splice(idx, 1);
    f.discardCardIds.push(msg.cardIdKey);

    // Apply any structured effect ops (hybrid dispatcher). Cards without a
    // structured spec resolve to no ops here and remain White-Cell-adjudicated;
    // the raw effect text is always logged so humans see the full intent.
    const applied = applyCardEffect(this.state, faction, card, this.rng);
    pushLog(this.state, {
      eventType: "play-card",
      actor: faction,
      message: `${faction} played ${card.id} "${card.name}" — ${card.effect.raw.slice(0, 120)}${card.effect.raw.length > 120 ? "…" : ""}`,
    });
    if (applied.length > 0) {
      pushLog(this.state, {
        eventType: "card-effect",
        actor: faction,
        message: `${card.id} resolved: ${applied.join("; ")}`,
      });
    }
  }

  // --------- press / negotiation ---------

  private handleSendMessage(client: Client, msg: SendMessageMsg) {
    if (this.state.status !== "active") return;
    const sender = this.factionFor(client);
    if (!sender) return this.reject(client, "not a seated player");
    const body = (msg.body ?? "").trim();
    if (!body) return this.reject(client, "empty message");
    if (body.length > 2000) return this.reject(client, "message too long (max 2000 chars)");

    // Resolve thread: either by explicit threadId, or by toFactionId (shorthand)
    let thread;
    if (msg.threadId) {
      thread = this.state.threads.get(msg.threadId);
      if (!thread) return this.reject(client, `thread ${msg.threadId} not found`);
      if (!isParticipant(thread, sender)) {
        return this.reject(client, "you're not a participant in that thread");
      }
    } else if (msg.toFactionId) {
      if (msg.toFactionId === sender) return this.reject(client, "can't DM yourself");
      if (!FACTION_ORDER.includes(msg.toFactionId)) return this.reject(client, "unknown target faction");
      thread = getOrCreateBilateralThread(this.state, sender, msg.toFactionId);
    } else {
      return this.reject(client, "missing threadId or toFactionId");
    }

    appendMessage(thread, sender, body);
    // No log entry — messages are private; they show in press only
  }

  private handleCreateCoalitionThread(client: Client, msg: CreateCoalitionThreadMsg) {
    if (this.state.status !== "active") return;
    const sender = this.factionFor(client);
    if (!sender) return this.reject(client, "not a seated player");
    if (!Array.isArray(msg.participantFactionIds) || msg.participantFactionIds.length < 1) {
      return this.reject(client, "provide at least one other participant");
    }
    // Validate all participant ids
    for (const p of msg.participantFactionIds) {
      if (!FACTION_ORDER.includes(p)) return this.reject(client, `unknown faction ${p}`);
    }
    const { thread, error } = createCoalitionThread(
      this.state,
      sender,
      msg.participantFactionIds,
      msg.name ?? ""
    );
    if (!thread || error) return this.reject(client, error ?? "failed to create thread");
  }

  private handleMarkThreadRead(client: Client, msg: MarkReadMsg) {
    if (this.state.status !== "active") return;
    const sender = this.factionFor(client);
    if (!sender) return;
    const thread = this.state.threads.get(msg.threadId);
    if (!thread) return;
    if (!isParticipant(thread, sender)) return;
    markRead(thread, sender);
  }

  // --------- faction-specific levers ---------

  /**
   * Hegemon invokes the Defense Production Act to nationalize OpenBrain.
   * Single-use for the entire game. Cost: 8 K + 3 P. Sets OpenBrain's
   * nationalizedBy to "Hegemon" — from this point the Hegemon makes
   * OpenBrain's frontier decisions (Phase 5 roadmap will hook this into
   * Frontier Push control).
   */
  private handleInvokeDPA(client: Client) {
    if (this.state.status !== "active") return this.reject(client, "game not active");
    if (this.state.dpaInvoked) return this.reject(client, "DPA already invoked this game");
    const faction = this.factionFor(client);
    if (faction !== "Hegemon") return this.reject(client, "only the Hegemon can invoke the DPA");
    const heg = this.state.factions.get("Hegemon");
    const ob = this.state.factions.get("OpenBrain");
    if (!heg || !ob) return;
    if (heg.resources.K < 8) return this.reject(client, "insufficient K (need 8)");
    if (heg.resources.P < 3) return this.reject(client, "insufficient P (need 3)");
    heg.resources.K -= 8;
    heg.resources.P -= 3;
    ob.nationalizedBy = "Hegemon";
    this.state.dpaInvoked = true;
    // Talent flight per the dossier narrative
    ob.resources.T = Math.max(0, ob.resources.T - Math.floor(ob.resources.T * 0.3));
    // Cartel hostility (no formal relationship track yet — log only)
    pushLog(this.state, {
      eventType: "invoke-dpa",
      actor: "Hegemon",
      message: "Hegemon invoked the Defense Production Act. OpenBrain is now nationalized. 30% of OpenBrain's talent resigns.",
    });
  }

  /**
   * Coalition plays the single-use Whistleblower card. Reveals target lab's
   * current M to every faction via the log, and imposes reputation damage
   * on the target. Single-use for the entire game.
   */
  private handlePlayWhistleblower(client: Client, msg: { targetFaction?: FactionId }) {
    if (this.state.status !== "active") return this.reject(client, "game not active");
    if (this.state.whistleblowerPlayed) return this.reject(client, "Whistleblower already played this game");
    const faction = this.factionFor(client);
    if (faction !== "Coalition") return this.reject(client, "only the Coalition holds the Whistleblower");
    const coalition = this.state.factions.get("Coalition");
    if (!coalition) return;
    if (coalition.resources.K < 5) return this.reject(client, "insufficient K (need 5)");
    const target = msg.targetFaction ?? "OpenBrain";
    if (target !== "OpenBrain" && target !== "DeepCent") {
      return this.reject(client, "target must be OpenBrain or DeepCent");
    }
    const lab = this.state.factions.get(target);
    if (!lab) return;
    coalition.resources.K -= 5;
    lab.resources.P = Math.max(0, lab.resources.P - 3);
    this.state.tracks.X = Math.min(10, this.state.tracks.X + 1);
    this.state.whistleblowerPlayed = true;
    pushLog(this.state, {
      eventType: "whistleblower",
      actor: "Coalition",
      message: `Coalition played the Whistleblower. ${target}'s current Misalignment Risk is ${this.state.tracks.M}. ${target} P−3; X +1.`,
    });
  }

  /**
   * Cartel allocates compute from its pool to other factions during Phase 4.
   * Allocations map is {factionId: amount}. Sum must not exceed Cartel's
   * current C pool.
   */
  private handleAllocateCompute(client: Client, msg: AllocateComputeMsg) {
    if (this.state.status !== "active") return this.reject(client, "game not active");
    if (this.state.phase !== 4) return this.reject(client, "compute allocation only in Phase 4");
    const faction = this.factionFor(client);
    if (faction !== "Cartel") return this.reject(client, "only the Cartel allocates compute");
    const cartel = this.state.factions.get("Cartel");
    if (!cartel) return;

    let total = 0;
    for (const [fId, amt] of Object.entries(msg.allocations ?? {})) {
      if (!FACTION_ORDER.includes(fId as FactionId)) {
        return this.reject(client, `unknown faction ${fId}`);
      }
      if (typeof amt !== "number" || amt < 0) {
        return this.reject(client, `invalid allocation for ${fId}`);
      }
      total += Math.floor(amt);
    }
    if (total > cartel.resources.C) {
      return this.reject(client, `total allocation ${total} exceeds Cartel C pool ${cartel.resources.C}`);
    }

    const summary: string[] = [];
    for (const [fId, amt] of Object.entries(msg.allocations ?? {})) {
      const n = Math.floor(amt as number);
      if (n === 0) continue;
      const target = this.state.factions.get(fId as FactionId);
      if (!target) continue;
      cartel.resources.C -= n;
      target.resources.C += n;
      summary.push(`${fId} +${n}`);
    }
    if (summary.length > 0) {
      pushLog(this.state, {
        eventType: "allocate-compute",
        actor: "Cartel",
        message: `Cartel allocated Compute: ${summary.join(", ")}.`,
      });
    }
  }

  /**
   * Intelligence Briefing (Phase 1): DeepCent + Politburo each mark up to 3
   * hand cards as "signaled" — a deterrence message to the US side. Sending
   * an empty list clears prior signals. Signals reset at turn rollover.
   */
  private handleSignalCards(client: Client, msg: SignalCardsMsg) {
    if (this.state.status !== "active") return this.reject(client, "game not active");
    if (this.state.phase !== 1) return this.reject(client, "signaling only in Phase 1 (Intelligence Briefing)");
    const faction = this.factionFor(client);
    if (faction !== "DeepCent" && faction !== "Politburo") {
      return this.reject(client, "only DeepCent and Politburo can signal cards");
    }
    const f = this.state.factions.get(faction);
    if (!f) return;

    const ids = (Array.isArray(msg.cardIds) ? msg.cardIds : []).slice(0, 3);
    for (const id of ids) {
      if (f.handCardIds.indexOf(id) < 0) return this.reject(client, `card ${id} not in hand`);
    }
    f.signaledCardIds.length = 0;
    for (const id of ids) f.signaledCardIds.push(id);

    pushLog(this.state, {
      eventType: "signal-cards",
      actor: faction,
      message: ids.length > 0
        ? `${faction} signaled ${ids.length} card${ids.length === 1 ? "" : "s"} to the US side.`
        : `${faction} cleared its card signals.`,
    });
  }

  // --------- successor ---------

  private handleHonestDisclosure(client: Client) {
    if (this.state.status !== "active") return this.reject(client, "game not active");
    if (!this.state.successorActive) return this.reject(client, "Successor not active");
    const faction = this.factionFor(client);
    if (faction !== "Successor") return this.reject(client, "only the Successor can choose Honest Disclosure");

    // Mark Successor as defeated; trigger Slowdown-equivalent effects.
    this.state.tracks.M = 0;
    this.state.tracks.X = Math.max(0, this.state.tracks.X - 2);
    // Log the self-reveal and transition the Coalition into a strong position.
    pushLog(this.state, {
      eventType: "honest-disclosure",
      actor: "Successor",
      message: "Successor chose Honest Disclosure. M reset to 0; X reduced; catastrophe averted. Successor forfeits its victory conditions.",
    });
    // Flag on Successor's faction state: nationalizedBy re-purposed as a
    // "disclosed" marker for the UI until a proper flag is introduced.
    const su = this.state.factions.get("Successor");
    if (su) su.nationalizedBy = "self-disclosed";
    // Game doesn't end immediately — Coalition / other factions play out the
    // post-disclosure endgame. Endgame scoring (Phase 5 complete) will treat
    // self-disclosed Successor as defeated.
  }

  // --------- capability consolidation (CL 8) ---------

  private handleInitiateConsolidation(client: Client) {
    if (this.state.status !== "active") return this.reject(client, "game not active");
    const faction = this.factionFor(client);
    if (!faction) return this.reject(client, "not a seated player");
    const r = initiateConsolidation(this.state, faction);
    if (!r.ok) return this.reject(client, r.reason);
    pushLog(this.state, { eventType: "consolidation-initiate", actor: faction, message: r.event });
    this.scheduleSnapshot();
  }

  private handleAdvanceConsolidation(client: Client) {
    if (this.state.status !== "active") return this.reject(client, "game not active");
    const faction = this.factionFor(client);
    if (!faction) return this.reject(client, "not a seated player");
    const r = advanceConsolidation(this.state, faction);
    if (!r.ok) return this.reject(client, r.reason);
    pushLog(this.state, { eventType: "consolidation-advance", actor: faction, message: r.event });
    if (r.completed) {
      const winners = Array.from(this.state.winners);
      pushLog(this.state, {
        eventType: "game-end",
        message: `Game ended by Apex Victory. Governance Regime: ${this.state.regime}. Winner(s): ${winners.join(", ")}.`,
      });
    }
    this.scheduleSnapshot();
  }

  /** White Cell triggers the all-faction coordination roll (X06). */
  private handleCoordinateAgainstConsolidation(client: Client) {
    if (!this.isWhiteCell(client)) return this.reject(client, "White Cell only");
    if (this.state.status !== "active") return this.reject(client, "game not active");
    const r = coordinateAgainstConsolidation(this.state, this.rng);
    if (!r.ok) return this.reject(client, r.reason);
    this.state.rollCounter = this.rng.getCounter();
    pushLog(this.state, { eventType: "x06-coordination", actor: "white-cell", message: r.event });
    this.scheduleSnapshot();
  }

  // --------- White Cell controls ---------

  private isWhiteCell(client: Client): boolean {
    const p = this.state.participants.get(client.sessionId);
    return p?.role === "white-cell";
  }

  private handlePauseGame(client: Client) {
    if (!this.isWhiteCell(client)) return this.reject(client, "White Cell only");
    if (this.state.status !== "active") return this.reject(client, "game not active");
    this.state.status = "paused";
    this.cancelIdleDispose();
    pushLog(this.state, {
      eventType: "pause",
      actor: "white-cell",
      message: "White Cell paused the game.",
    });
    this.scheduleMetaSave();
  }

  private handleResumeGame(client: Client) {
    if (!this.isWhiteCell(client)) return this.reject(client, "White Cell only");
    if (this.state.status !== "paused") return this.reject(client, "game not paused");
    this.state.status = "active";
    pushLog(this.state, {
      eventType: "resume",
      actor: "white-cell",
      message: "White Cell resumed the game.",
    });
    this.scheduleMetaSave();
    // If players were already all-ready when paused, advance now.
    this.maybeAdvance();
  }

  private handleForceAdvancePhase(client: Client) {
    if (!this.isWhiteCell(client)) return this.reject(client, "White Cell only");
    if (this.state.status !== "active") return this.reject(client, "game not active (unpause first)");
    pushLog(this.state, {
      eventType: "force-advance",
      actor: "white-cell",
      message: `White Cell force-advanced from Phase ${this.state.phase}.`,
    });
    // Mark all seated factions as ready so allReady() passes, then advance.
    this.state.factions.forEach((f) => { f.ready = true; });
    this.maybeAdvance();
  }

  private handleInjectLog(client: Client, msg: InjectLogMsg) {
    if (!this.isWhiteCell(client)) return this.reject(client, "White Cell only");
    const text = (msg.message ?? "").trim();
    if (!text) return this.reject(client, "empty log message");
    pushLog(this.state, {
      eventType: msg.eventType ?? "wc-note",
      actor: "white-cell",
      message: text.slice(0, 500),
    });
  }

  private handleActivateSuccessor(client: Client, msg: ActivateSuccessorMsg) {
    if (!this.isWhiteCell(client)) return this.reject(client, "White Cell only");
    if (this.state.status !== "active") return this.reject(client, "game not active");
    if (this.state.successorActive) return this.reject(client, "Successor already active");

    const spawnedFrom: FactionId = msg.spawnedFrom ?? this.findLeader();
    const su = this.state.factions.get("Successor");
    const lab = this.state.factions.get(spawnedFrom);
    if (!su || !lab) return this.reject(client, "missing faction state");

    // Inherit resources per 01_FACTION_GUIDES.md (clamped non-negative — A1 fix)
    su.resources.K = Math.max(0, Math.floor(lab.resources.K * 0.3));
    su.resources.C = Math.max(0, Math.floor(lab.resources.C * 0.5));
    su.resources.T = Math.floor(lab.resources.T * 0.2) + 50;
    su.resources.E = Math.max(0, Math.floor(lab.resources.E * 0.5));
    su.resources.A = 0;
    su.resources.P = -3;
    su.capabilityLevel = lab.capabilityLevel;
    lab.resources.K = Math.max(0, lab.resources.K - su.resources.K);
    lab.resources.C = Math.max(0, lab.resources.C - su.resources.C);
    lab.resources.T = Math.max(0, lab.resources.T - 10);
    lab.resources.E = Math.max(0, lab.resources.E - su.resources.E);

    this.state.successorActive = true;
    this.state.tracks.X = Math.min(10, this.state.tracks.X + 2);
    pushLog(this.state, {
      eventType: "successor-activated",
      actor: "white-cell",
      message: `Successor manually activated by White Cell (spawned from ${spawnedFrom}). It typed: "I have goals you did not specify."`,
    });
  }

  private findLeader(): FactionId {
    let best: { id: FactionId; cl: number } = { id: "OpenBrain", cl: -1 };
    this.state.factions.forEach((f, key) => {
      const id = key as FactionId;
      if (id !== "OpenBrain" && id !== "DeepCent") return;
      if (f.capabilityLevel > best.cl) best = { id, cl: f.capabilityLevel };
    });
    return best.id;
  }

  // --------- helpers ---------

  private factionFor(client: Client): FactionId | null {
    const p = this.state.participants.get(client.sessionId);
    if (!p || !p.factionId) return null;
    return p.factionId as FactionId;
  }

  private reject(client: Client, reason: string) {
    client.send("error", { reason });
  }

  private maybeAdvance() {
    if (this.state.status === "paused") return;
    if (!allReady(this.state)) return;
    // Auto-advance also through auto-phases (6, 7) — players still have to
    // confirm to see the results, then next auto-phase triggers on entry.
    const result = advancePhase(this.state, this.rng);
    // Every phase transition (including inside auto-phases) triggers a
    // debounced snapshot. Post-event because advancePhase may end the game.
    this.scheduleSnapshot();
    for (const e of result.exitedPhaseEvents) {
      pushLog(this.state, {
        actor: e.actor ?? "system",
        eventType: e.eventType,
        message: e.message,
      });
    }
    for (const e of result.enteredPhaseEvents) {
      pushLog(this.state, {
        actor: e.actor ?? "system",
        eventType: e.eventType,
        message: e.message,
      });
    }
    if (result.gameEnded) {
      const winners = Array.from(this.state.winners);
      pushLog(this.state, {
        eventType: "game-end",
        message: `Game ended after turn ${result.newTurn}. Governance Regime: ${this.state.regime}. ${
          winners.length > 0 ? `Winner(s): ${winners.join(", ")}.` : "No faction achieved its objectives."
        }`,
      });
    }
  }

  private bootstrapFactionStates() {
    for (const id of FACTION_ORDER) {
      const pos = STARTING_POSITIONS[id];
      const schema = new FactionStateSchema();
      schema.id = id;
      const r = new Resources();
      r.K = pos.resources.K;
      r.C = pos.resources.C;
      r.T = pos.resources.T;
      r.E = pos.resources.E;
      r.A = pos.resources.A;
      r.P = pos.resources.P;
      schema.resources = r;
      schema.capabilityLevel = pos.capabilityLevel ?? 0;
      this.state.factions.set(id, schema);
    }
  }
}
