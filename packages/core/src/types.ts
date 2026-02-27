/** A single segment on the wheel. */
export interface WheelSegment {
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
export interface SpinResult {
	/** Index of the winning segment. */
	index: number;
	/** The winning segment. */
	segment: WheelSegment;
	/** Final rotation angle in degrees. */
	finalAngle: number;
}

/** Possible states of the wheel engine. */
export type WheelState = 'idle' | 'spinning' | 'finished';

/** Configuration for the WheelEngine. */
export interface WheelEngineConfig {
	/** Wheel segments. */
	segments: WheelSegment[];
	/** Minimum full rotations during a spin. */
	minSpins?: number;
	/** Maximum full rotations during a spin. */
	maxSpins?: number;
	/** Seed string for deterministic RNG. */
	seed?: string;
}
