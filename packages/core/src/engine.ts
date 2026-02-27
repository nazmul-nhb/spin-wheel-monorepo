import { calculateFinalAngle } from './angle.js';
import { createSeededRng } from './rng.js';
import type { SpinResult, WheelEngineConfig, WheelSegment, WheelState } from './types.js';
import { pickWeightedIndex } from './weighted.js';

/** Deep-freeze a segment to prevent external mutation. */
function freezeSegment(seg: WheelSegment): Readonly<WheelSegment> {
	return Object.freeze({ ...seg });
}

/** Pure-logic wheel engine. No DOM dependency. */
export class WheelEngine {
	private segments: readonly Readonly<WheelSegment>[];
	private state: WheelState = 'idle';
	private readonly rng: () => number;
	private readonly minSpins: number;
	private readonly maxSpins: number;
	private lastResult: SpinResult | null = null;

	constructor(config: WheelEngineConfig) {
		if (!config.segments || config.segments.length === 0) {
			throw new Error('WheelEngine: at least one segment is required.');
		}

		const min = config.minSpins ?? 4;
		const max = config.maxSpins ?? 8;

		if (min < 1) {
			throw new Error(`WheelEngine: minSpins must be ≥ 1, got ${min}.`);
		}
		if (max < min) {
			throw new Error(`WheelEngine: maxSpins (${max}) must be ≥ minSpins (${min}).`);
		}

		this.segments = config.segments.map(freezeSegment);
		this.minSpins = min;
		this.maxSpins = max;
		this.rng = config.seed ? createSeededRng(config.seed) : () => Math.random();
	}

	/** Returns the current wheel state. */
	getState(): WheelState {
		return this.state;
	}

	/** Returns the last spin result, if any. */
	getLastResult(): SpinResult | null {
		return this.lastResult;
	}

	/** Returns a frozen copy of the current segments. */
	getSegments(): readonly Readonly<WheelSegment>[] {
		return this.segments;
	}

	/** Replace the current segments. Resets state to idle. */
	setSegments(segments: readonly WheelSegment[]): void {
		if (!segments || segments.length === 0) {
			throw new Error('WheelEngine: at least one segment is required.');
		}
		this.segments = segments.map(freezeSegment);
		this.reset();
	}

	/**
	 * Determines the result and computes the final angle.
	 * Result is known BEFORE any animation.
	 */
	spin(): SpinResult {
		if (this.state === 'spinning') {
			throw new Error('WheelEngine: a spin is already in progress.');
		}

		this.state = 'spinning';

		const index = pickWeightedIndex(this.segments, this.rng);
		const extraSpins = this.minSpins + Math.floor(this.rng() * (this.maxSpins - this.minSpins + 1));

		const finalAngle = calculateFinalAngle(index, this.segments.length, extraSpins, this.rng);

		const segment = this.segments[index];
		if (!segment) {
			throw new Error(`WheelEngine: internal error — invalid index ${index}.`);
		}
		const result: SpinResult = Object.freeze({ index, segment, finalAngle });

		this.lastResult = result;
		this.state = 'finished';

		return result;
	}

	/** Resets the engine back to idle. */
	reset(): void {
		this.state = 'idle';
		this.lastResult = null;
	}
}
