/**
 * Seeded pseudo-random number generator (mulberry32).
 * Deterministic given seed; suitable for auditable game RNG.
 *
 * All random rolls in a game must go through this to preserve reproducibility.
 * The seed + roll counter are stored in the Schema so any moment can be
 * reconstructed.
 */

export class SeededRng {
  private state: number;
  private counter: number;

  constructor(seed: string | number, counter = 0) {
    const baseSeed = typeof seed === "number" ? seed : hashString(seed);
    // Advance `counter` times so different counters produce different streams
    let s = baseSeed >>> 0;
    for (let i = 0; i < counter; i++) s = advance(s);
    this.state = s;
    this.counter = counter;
  }

  /** Next uniform [0,1). Auto-increments the consumption counter. */
  next(): number {
    this.state = advance(this.state);
    this.counter++;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [lo, hi] inclusive. */
  nextInt(lo: number, hi: number): number {
    return lo + Math.floor(this.next() * (hi - lo + 1));
  }

  /** Roll a die with `sides` faces, 1-indexed. */
  roll(sides: number): number {
    return this.nextInt(1, sides);
  }

  /** Roll `count` dice with `sides` faces each. */
  rollN(count: number, sides: number): number[] {
    return Array.from({ length: count }, () => this.roll(sides));
  }

  /** Fisher-Yates shuffle using this RNG. Returns a new array. */
  shuffle<T>(items: readonly T[]): T[] {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const tmp = arr[i] as T;
      arr[i] = arr[j] as T;
      arr[j] = tmp;
    }
    return arr;
  }

  /** Total number of times `next()` has been called since construction.
   *  Used to checkpoint state into HedgemonyState.rollCounter so a replay
   *  can reconstruct the exact RNG sequence. */
  getCounter(): number {
    return this.counter;
  }

  /** Export current state for audit. */
  state32(): number {
    return this.state >>> 0;
  }
}

function advance(x: number): number {
  return (x + 0x6d2b79f5) >>> 0;
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function randomSeedString(): string {
  // 48 bits of entropy is plenty for a session id
  const bytes = new Uint8Array(6);
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 6; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
