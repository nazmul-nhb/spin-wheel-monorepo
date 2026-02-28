import type { SpinResult, WheelSegment, WheelState } from '@spin-wheel/core';

/** Configuration for the SpinWheelWidget. */
export interface SpinWheelWidgetConfig {
    /** Wheel segments. */
    readonly segments: readonly WheelSegment[];
    /** Which renderer backend to use (defaults to "canvas"). */
    readonly renderer?: 'canvas' | 'svg';
    /** Duration of the spin animation in milliseconds (defaults to 4000). */
    readonly durationMs?: number;
    /** Minimum full spins (passed to engine). */
    readonly minSpins?: number;
    /** Maximum full spins (passed to engine). */
    readonly maxSpins?: number;
    /** Seed for deterministic results. */
    readonly seed?: string;
    /** Called when a spin finishes with the result. */
    readonly onFinish?: (result: SpinResult) => void;
    /** Called when the engine state changes. */
    readonly onStateChange?: (state: WheelState) => void;
}
