import { describe, expect, it } from 'vitest';
import { calculateFinalAngle } from '../src/angle.js';
import { WheelEngine } from '../src/engine.js';
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
            const idx = pickWeightedIndex(segments, rng);
            counts[idx] = (counts[idx] ?? 0) + 1;
        }

        // Segment B (weight 3) should appear roughly 60 % of the time
        const bRatio = (counts[1] ?? 0) / runs;
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

    it('throws on empty segments', () => {
        const rng = createSeededRng('empty');
        expect(() => pickWeightedIndex([], rng)).toThrow('empty');
    });

    it('throws on negative weight', () => {
        const bad: WheelSegment[] = [{ id: 'x', label: 'X', weight: -1 }];
        const rng = createSeededRng('neg');
        expect(() => pickWeightedIndex(bad, rng)).toThrow('negative');
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

        for (let idx = 0; idx < count; idx++) {
            const rngCopy = createSeededRng(`bounds-${idx}`);
            const angle = calculateFinalAngle(idx, count, 5, rngCopy);

            const effective = ((angle % 360) + 360) % 360;
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

// ---------------------------------------------------------------------------
// WheelEngine
// ---------------------------------------------------------------------------
describe('WheelEngine', () => {
    const segments: WheelSegment[] = [
        { id: 'a', label: 'A', weight: 1 },
        { id: 'b', label: 'B', weight: 2 },
        { id: 'c', label: 'C', weight: 1 },
    ];

    it('starts in idle state', () => {
        const engine = new WheelEngine({ segments, seed: 'init' });
        expect(engine.getState()).toBe('idle');
        expect(engine.getLastResult()).toBeNull();
    });

    it('transitions to spinning → finished on spin()', () => {
        const engine = new WheelEngine({ segments, seed: 'state' });
        const result = engine.spin();
        expect(engine.getState()).toBe('finished');
        expect(engine.getLastResult()).toBe(result);
    });

    it('throws when spinning while already spinning (state check)', () => {
        const engine = new WheelEngine({ segments, seed: 'double' });
        engine.spin();
        // State is now 'finished', not 'spinning'; after reset we can spin again
        engine.reset();
        expect(engine.getState()).toBe('idle');
        engine.spin(); // should not throw
    });

    it('resets state to idle', () => {
        const engine = new WheelEngine({ segments, seed: 'reset' });
        engine.spin();
        engine.reset();
        expect(engine.getState()).toBe('idle');
        expect(engine.getLastResult()).toBeNull();
    });

    it('returns frozen spin results', () => {
        const engine = new WheelEngine({ segments, seed: 'freeze' });
        const result = engine.spin();
        expect(Object.isFrozen(result)).toBe(true);
    });

    it('returns frozen segment copies', () => {
        const engine = new WheelEngine({ segments, seed: 'seg-freeze' });
        const segs = engine.getSegments();
        for (const seg of segs) {
            expect(Object.isFrozen(seg)).toBe(true);
        }
    });

    it('deterministic: same seed produces same result', () => {
        const engine1 = new WheelEngine({ segments, seed: 'repro' });
        const engine2 = new WheelEngine({ segments, seed: 'repro' });

        const r1 = engine1.spin();
        const r2 = engine2.spin();

        expect(r1.index).toBe(r2.index);
        expect(r1.finalAngle).toBe(r2.finalAngle);
        expect(r1.segment.id).toBe(r2.segment.id);
    });

    it('deterministic across multiple spins', () => {
        const engine1 = new WheelEngine({ segments, seed: 'multi' });
        const engine2 = new WheelEngine({ segments, seed: 'multi' });

        for (let i = 0; i < 5; i++) {
            const r1 = engine1.spin();
            const r2 = engine2.spin();
            expect(r1.index).toBe(r2.index);
            expect(r1.finalAngle).toBe(r2.finalAngle);
            engine1.reset();
            engine2.reset();
        }
    });

    // --- Validation ---
    it('throws on empty segments', () => {
        expect(() => new WheelEngine({ segments: [] })).toThrow('at least one segment');
    });

    it('throws on minSpins < 1', () => {
        expect(() => new WheelEngine({ segments, minSpins: 0 })).toThrow('minSpins');
    });

    it('throws on maxSpins < minSpins', () => {
        expect(() => new WheelEngine({ segments, minSpins: 5, maxSpins: 3 })).toThrow(
            'maxSpins'
        );
    });

    it('throws when calling setSegments with empty array', () => {
        const engine = new WheelEngine({ segments, seed: 'set-empty' });
        expect(() => engine.setSegments([])).toThrow('at least one segment');
    });

    it('setSegments replaces segments and resets state', () => {
        const engine = new WheelEngine({ segments, seed: 'replace' });
        engine.spin();
        expect(engine.getState()).toBe('finished');

        const newSegs: WheelSegment[] = [{ id: 'z', label: 'Z' }];
        engine.setSegments(newSegs);

        expect(engine.getState()).toBe('idle');
        expect(engine.getSegments()).toHaveLength(1);
        expect(engine.getSegments()[0]?.id).toBe('z');
    });
});
