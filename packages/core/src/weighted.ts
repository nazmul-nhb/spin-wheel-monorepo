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
    if (segments.length === 0) {
        throw new Error('pickWeightedIndex: segments array must not be empty.');
    }

    const weights = segments.map((s) => {
        const w = s.weight ?? 1;
        if (w < 0) {
            throw new Error(`pickWeightedIndex: segment "${s.id}" has negative weight ${w}.`);
        }
        return w;
    });
    const total = weights.reduce((sum, w) => sum + w, 0);

    if (total <= 0) {
        throw new Error('pickWeightedIndex: total weight must be greater than zero.');
    }

    let r = rng() * total;

    for (let i = 0; i < weights.length; i++) {
        const w = weights[i];
        if (w !== undefined) {
            r -= w;
        }
        if (r <= 0) {
            return i;
        }
    }

    return segments.length - 1;
}
