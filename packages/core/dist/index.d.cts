//#region src/types.d.ts
/** A single segment on the wheel. */
interface WheelSegment {
  /** Unique identifier for the segment. */
  id: string;
  /** Display label for the segment. */
  label: string;
  /** Relative weight for selection probability (defaults to 1). */
  weight?: number;
  /** Arbitrary payload attached to the segment. */
  data?: unknown;
}
/** Result returned after a spin completes. */
interface SpinResult {
  /** Index of the winning segment. */
  index: number;
  /** The winning segment. */
  segment: WheelSegment;
  /** Final rotation angle in degrees. */
  finalAngle: number;
}
/** Possible states of the wheel engine. */
type WheelState = "idle" | "spinning" | "finished";
/** Configuration for the WheelEngine. */
interface WheelEngineConfig {
  /** Wheel segments. */
  segments: WheelSegment[];
  /** Minimum full rotations during a spin. */
  minSpins?: number;
  /** Maximum full rotations during a spin. */
  maxSpins?: number;
  /** Seed string for deterministic RNG. */
  seed?: string;
}
//# sourceMappingURL=types.d.ts.map
//#endregion
//#region src/rng.d.ts
/**
 * Creates a seeded pseudo-random number generator using a simple
 * string-hashed mulberry32 algorithm. Returns a function that
 * produces values in [0, 1).
 */
declare function createSeededRng(seed: string): () => number;
//# sourceMappingURL=rng.d.ts.map
//#endregion
//#region src/easing.d.ts
/**
 * Cubic ease-out curve.
 *
 * @param t - Normalized time in [0, 1].
 * @returns Eased value in [0, 1].
 */
declare function easeOutCubic(t: number): number;
//# sourceMappingURL=easing.d.ts.map

//#endregion
//#region src/weighted.d.ts
/**
 * Picks a random index from an array of segments using weighted
 * probability.
 *
 * @param segments - Array of wheel segments.
 * @param rng - A function returning a random number in [0, 1).
 * @returns The selected index.
 */
declare function pickWeightedIndex(segments: readonly WheelSegment[], rng: () => number): number;
//# sourceMappingURL=weighted.d.ts.map
//#endregion
//#region src/angle.d.ts
/**
 * Calculates the final rotation angle so that the target segment
 * lands under a pointer fixed at the TOP (0°/360°).
 *
 * @param index - Zero-based index of the winning segment.
 * @param count - Total number of segments.
 * @param extraSpins - Number of full 360° rotations to prepend.
 * @param rng - A function returning a random number in [0, 1).
 * @returns Final rotation in degrees (always positive, ≥ 360 * extraSpins).
 */
declare function calculateFinalAngle(index: number, count: number, extraSpins: number, rng: () => number): number;
//# sourceMappingURL=angle.d.ts.map
//#endregion
//#region src/engine.d.ts
/** Pure-logic wheel engine. No DOM dependency. */
declare class WheelEngine {
  private segments;
  private state;
  private rng;
  private readonly minSpins;
  private readonly maxSpins;
  private lastResult;
  constructor(config: WheelEngineConfig);
  /** Returns the current wheel state. */
  getState(): WheelState;
  /** Returns the last spin result, if any. */
  getLastResult(): SpinResult | null;
  /** Returns the current segments. */
  getSegments(): readonly WheelSegment[];
  /** Replace the current segments. */
  setSegments(segments: WheelSegment[]): void;
  /**
   * Determines the result and computes the final angle.
   * Result is known BEFORE any animation.
   */
  spin(): SpinResult;
  /** Resets the engine back to idle. */
  reset(): void;
}
//# sourceMappingURL=engine.d.ts.map

//#endregion
export { type SpinResult, WheelEngine, type WheelEngineConfig, type WheelSegment, type WheelState, calculateFinalAngle, createSeededRng, easeOutCubic, pickWeightedIndex };
//# sourceMappingURL=index.d.cts.map