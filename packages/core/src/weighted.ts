import type { WheelSegment } from './types.js';

/**
 * Picks a random index from an array of segments using weighted
 * probability.
 *
 * @param segments - Array of wheel segments.
 * @param rng - A function returning a random number in [0, 1).
 * @returns The selected index.
 */
export function pickWeightedIndex(
	segments: readonly WheelSegment[],
	rng: () => number
): number {
	const weights = segments.map((s) => s.weight ?? 1);
	const total = weights.reduce((sum, w) => sum + w, 0);

	let r = rng() * total;

	for (let i = 0; i < weights.length; i++) {
		r -= weights[i]!;
		if (r <= 0) {
			return i;
		}
	}

	return segments.length - 1;
}
