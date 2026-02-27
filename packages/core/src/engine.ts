import { calculateFinalAngle } from './angle.js';
import { createSeededRng } from './rng.js';
import type { SpinResult, WheelEngineConfig, WheelSegment, WheelState } from './types.js';
import { pickWeightedIndex } from './weighted.js';

/** Pure-logic wheel engine. No DOM dependency. */
export class WheelEngine {
	private segments: WheelSegment[];
	private state: WheelState = 'idle';
	private rng: () => number;
	private readonly minSpins: number;
	private readonly maxSpins: number;
	private lastResult: SpinResult | null = null;

	constructor(config: WheelEngineConfig) {
		if (config.segments.length === 0) {
			throw new Error('At least one segment is required.');
		}
		this.segments = [...config.segments];
		this.minSpins = config.minSpins ?? 4;
		this.maxSpins = config.maxSpins ?? 8;
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

	/** Returns the current segments. */
	getSegments(): readonly WheelSegment[] {
		return this.segments;
	}

	/** Replace the current segments. */
	setSegments(segments: WheelSegment[]): void {
		if (segments.length === 0) {
			throw new Error('At least one segment is required.');
		}
		this.segments = [...segments];
		this.reset();
	}

	/**
	 * Determines the result and computes the final angle.
	 * Result is known BEFORE any animation.
	 */
	spin(): SpinResult {
		if (this.state === 'spinning') {
			throw new Error('A spin is already in progress.');
		}

		this.state = 'spinning';

		const index = pickWeightedIndex(this.segments, this.rng);
		const extraSpins =
			this.minSpins + Math.floor(this.rng() * (this.maxSpins - this.minSpins + 1));

		const finalAngle = calculateFinalAngle(
			index,
			this.segments.length,
			extraSpins,
			this.rng
		);

		const segment = this.segments[index]!;
		const result: SpinResult = { index, segment, finalAngle };

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
