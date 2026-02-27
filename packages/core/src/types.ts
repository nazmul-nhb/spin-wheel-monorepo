/** A single segment on the wheel. */
export interface WheelSegment {
	/** Unique identifier for the segment. */
	readonly id: string;
	/** Display label for the segment. */
	readonly label: string;
	/** Relative weight for selection probability (defaults to 1). */
	readonly weight?: number;
	/** Arbitrary payload attached to the segment. */
	readonly data?: unknown;
}

/** Result returned after a spin completes. */
export interface SpinResult {
	/** Index of the winning segment. */
	readonly index: number;
	/** The winning segment. */
	readonly segment: Readonly<WheelSegment>;
	/** Final rotation angle in degrees. */
	readonly finalAngle: number;
}

/** Possible states of the wheel engine. */
export type WheelState = 'idle' | 'spinning' | 'finished';

/** Configuration for the WheelEngine. */
export interface WheelEngineConfig {
	/** Wheel segments. */
	readonly segments: readonly WheelSegment[];
	/** Minimum full rotations during a spin. */
	readonly minSpins?: number;
	/** Maximum full rotations during a spin. */
	readonly maxSpins?: number;
	/** Seed string for deterministic RNG. */
	readonly seed?: string;
}
