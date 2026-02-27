//#region src/rng.ts
/**
* Creates a seeded pseudo-random number generator using a simple
* string-hashed mulberry32 algorithm. Returns a function that
* produces values in [0, 1).
*/
function createSeededRng(seed) {
	let h = 0;
	for (let i = 0; i < seed.length; i++) h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
	let state = h >>> 0;
	return () => {
		state |= 0;
		state = state + 1831565813 | 0;
		let t = Math.imul(state ^ state >>> 15, 1 | state);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}

//#endregion
//#region src/easing.ts
/**
* Cubic ease-out curve.
*
* @param t - Normalized time in [0, 1].
* @returns Eased value in [0, 1].
*/
function easeOutCubic(t) {
	const t1 = t - 1;
	return t1 * t1 * t1 + 1;
}

//#endregion
//#region src/weighted.ts
/**
* Picks a random index from an array of segments using weighted
* probability.
*
* @param segments - Array of wheel segments.
* @param rng - A function returning a random number in [0, 1).
* @returns The selected index.
*/
function pickWeightedIndex(segments, rng) {
	const weights = segments.map((s) => s.weight ?? 1);
	const total = weights.reduce((sum, w) => sum + w, 0);
	let r = rng() * total;
	for (let i = 0; i < weights.length; i++) {
		r -= weights[i];
		if (r <= 0) return i;
	}
	return segments.length - 1;
}

//#endregion
//#region src/angle.ts
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
function calculateFinalAngle(index, count, extraSpins, rng) {
	const segmentAngle = 360 / count;
	const padding = segmentAngle * .1;
	const innerRange = segmentAngle - 2 * padding;
	const randomOffset = padding + rng() * innerRange;
	const targetAngle = 360 - (index * segmentAngle + randomOffset);
	return extraSpins * 360 + (targetAngle % 360 + 360) % 360;
}

//#endregion
//#region src/engine.ts
/** Pure-logic wheel engine. No DOM dependency. */
var WheelEngine = class {
	segments;
	state = "idle";
	rng;
	minSpins;
	maxSpins;
	lastResult = null;
	constructor(config) {
		if (config.segments.length === 0) throw new Error("At least one segment is required.");
		this.segments = [...config.segments];
		this.minSpins = config.minSpins ?? 4;
		this.maxSpins = config.maxSpins ?? 8;
		this.rng = config.seed ? createSeededRng(config.seed) : () => Math.random();
	}
	/** Returns the current wheel state. */
	getState() {
		return this.state;
	}
	/** Returns the last spin result, if any. */
	getLastResult() {
		return this.lastResult;
	}
	/** Returns the current segments. */
	getSegments() {
		return this.segments;
	}
	/** Replace the current segments. */
	setSegments(segments) {
		if (segments.length === 0) throw new Error("At least one segment is required.");
		this.segments = [...segments];
		this.reset();
	}
	/**
	* Determines the result and computes the final angle.
	* Result is known BEFORE any animation.
	*/
	spin() {
		if (this.state === "spinning") throw new Error("A spin is already in progress.");
		this.state = "spinning";
		const index = pickWeightedIndex(this.segments, this.rng);
		const extraSpins = this.minSpins + Math.floor(this.rng() * (this.maxSpins - this.minSpins + 1));
		const finalAngle = calculateFinalAngle(index, this.segments.length, extraSpins, this.rng);
		const segment = this.segments[index];
		const result = {
			index,
			segment,
			finalAngle
		};
		this.lastResult = result;
		this.state = "finished";
		return result;
	}
	/** Resets the engine back to idle. */
	reset() {
		this.state = "idle";
		this.lastResult = null;
	}
};

//#endregion
export { WheelEngine, calculateFinalAngle, createSeededRng, easeOutCubic, pickWeightedIndex };
//# sourceMappingURL=index.js.map