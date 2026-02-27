import type { SpinResult, WheelSegment, WheelState } from '@spin-wheel/core';

/** Configuration for the SpinWheelWidget. */
export interface SpinWheelWidgetConfig {
	/** Wheel segments. */
	segments: WheelSegment[];
	/** Which renderer backend to use (defaults to "canvas"). */
	renderer?: 'canvas' | 'svg';
	/** Duration of the spin animation in milliseconds (defaults to 4000). */
	durationMs?: number;
	/** Minimum full spins (passed to engine). */
	minSpins?: number;
	/** Maximum full spins (passed to engine). */
	maxSpins?: number;
	/** Seed for deterministic results. */
	seed?: string;
	/** Called when a spin finishes with the result. */
	onFinish?: (result: SpinResult) => void;
	/** Called when the engine state changes. */
	onStateChange?: (state: WheelState) => void;
}
