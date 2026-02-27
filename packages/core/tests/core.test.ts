import { describe, expect, it } from 'vitest';
import { calculateFinalAngle } from '../src/angle.js';
import { createSeededRng } from '../src/rng.js';
import type { WheelSegment } from '../src/types.js';
import { pickWeightedIndex } from '../src/weighted.js';

// ---------------------------------------------------------------------------
// Seeded RNG Reproducibility
// ---------------------------------------------------------------------------
describe('createSeededRng', () => {
	it('produces the same sequence for the same seed', () => {
		const rng1 = createSeededRng('test-seed');
		const rng2 = createSeededRng('test-seed');

		const seq1 = Array.from({ length: 20 }, () => rng1());
		const seq2 = Array.from({ length: 20 }, () => rng2());

		expect(seq1).toEqual(seq2);
	});

	it('produces different sequences for different seeds', () => {
		const rng1 = createSeededRng('alpha');
		const rng2 = createSeededRng('beta');

		const seq1 = Array.from({ length: 10 }, () => rng1());
		const seq2 = Array.from({ length: 10 }, () => rng2());

		expect(seq1).not.toEqual(seq2);
	});

	it('returns values in [0, 1)', () => {
		const rng = createSeededRng('bounds');
		for (let i = 0; i < 1000; i++) {
			const v = rng();
			expect(v).toBeGreaterThanOrEqual(0);
			expect(v).toBeLessThan(1);
		}
	});
});

// ---------------------------------------------------------------------------
// Weighted Selection
// ---------------------------------------------------------------------------
describe('pickWeightedIndex', () => {
	const segments: WheelSegment[] = [
		{ id: 'a', label: 'A', weight: 1 },
		{ id: 'b', label: 'B', weight: 3 },
		{ id: 'c', label: 'C', weight: 1 },
	];

	it('returns a valid index', () => {
		const rng = createSeededRng('weight-test');
		for (let i = 0; i < 100; i++) {
			const idx = pickWeightedIndex(segments, rng);
			expect(idx).toBeGreaterThanOrEqual(0);
			expect(idx).toBeLessThan(segments.length);
		}
	});

	it('favours higher-weighted segments over many runs', () => {
		const rng = createSeededRng('dist');
		const counts = [0, 0, 0];
		const runs = 10_000;

		for (let i = 0; i < runs; i++) {
			counts[pickWeightedIndex(segments, rng)]!++;
		}

		// Segment B (weight 3) should appear roughly 60 % of the time
		const bRatio = counts[1]! / runs;
		expect(bRatio).toBeGreaterThan(0.45);
		expect(bRatio).toBeLessThan(0.75);
	});

	it('handles segments with default weight (undefined → 1)', () => {
		const segs: WheelSegment[] = [
			{ id: 'x', label: 'X' },
			{ id: 'y', label: 'Y' },
		];
		const rng = createSeededRng('default-weight');
		const idx = pickWeightedIndex(segs, rng);
		expect(idx === 0 || idx === 1).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Angle Calculation
// ---------------------------------------------------------------------------
describe('calculateFinalAngle', () => {
	it('returns a positive angle ≥ extraSpins * 360', () => {
		const rng = createSeededRng('angle');
		const angle = calculateFinalAngle(0, 8, 5, rng);

		expect(angle).toBeGreaterThanOrEqual(5 * 360);
		expect(angle).toBeLessThanOrEqual(6 * 360);
	});

	it('keeps the landing within the correct segment', () => {
		const count = 8;
		const segAngle = 360 / count;
		const rng = createSeededRng('bounds-check');

		for (let idx = 0; idx < count; idx++) {
			const rngCopy = createSeededRng(`bounds-${idx}`);
			const angle = calculateFinalAngle(idx, count, 5, rngCopy);

			// After removing full rotations, the effective angle should place
			// the target segment at the top (0°).
			const effective = ((angle % 360) + 360) % 360;
			// The segment occupies [idx*segAngle, (idx+1)*segAngle)
			// Landing under the pointer means: 360 - effective ≈ idx*segAngle + offset
			const landing = (((360 - effective) % 360) + 360) % 360;
			const segStart = idx * segAngle;
			const segEnd = segStart + segAngle;

			expect(landing).toBeGreaterThanOrEqual(segStart);
			expect(landing).toBeLessThanOrEqual(segEnd);
		}
	});

	it('respects 10% edge padding', () => {
		const count = 6;
		const segAngle = 360 / count;
		const padding = segAngle * 0.1;
		const rng = createSeededRng('padding');

		for (let i = 0; i < 200; i++) {
			const rngI = createSeededRng(`pad-${i}`);
			const idx = i % count;
			const angle = calculateFinalAngle(idx, count, 4, rngI);
			const effective = ((angle % 360) + 360) % 360;
			const landing = (((360 - effective) % 360) + 360) % 360;
			const segStart = idx * segAngle;

			const offset = landing - segStart;
			expect(offset).toBeGreaterThanOrEqual(padding - 0.01);
			expect(offset).toBeLessThanOrEqual(segAngle - padding + 0.01);
		}
	});
});
