/**
 * Creates a seeded pseudo-random number generator using a simple
 * string-hashed mulberry32 algorithm. Returns a function that
 * produces values in [0, 1).
 */
export function createSeededRng(seed: string): () => number {
	let h = 0;
	for (let i = 0; i < seed.length; i++) {
		h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
	}

	let state = h >>> 0;

	return (): number => {
		state |= 0;
		state = (state + 0x6d2b79f5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
