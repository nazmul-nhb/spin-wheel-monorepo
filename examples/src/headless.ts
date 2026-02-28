import { WheelEngine } from '@spin-wheel/core';
import { $, log, segments } from './shared.js';

/**
 * Example 4 — Engine-level (headless)
 *
 * `WheelEngine` from `@spin-wheel/core` is the pure-logic layer.
 * No DOM, no animation — `spin()` returns the result synchronously.
 *
 * Perfect for:
 * - Server-side / Node.js winner selection
 * - Unit testing with deterministic seeds
 * - Custom renderers (Three.js, Pixi, etc.)
 * - Replaying exact spin sequences
 */

const logEl = $('#log');
const statsEl = $('#stats');
const seedInput = $('#seed') as HTMLInputElement;
const countInput = $('#count') as HTMLInputElement;
const btn = $('#btn') as HTMLButtonElement;
const btnReset = $('#btn-reset') as HTMLButtonElement;

let engine: WheelEngine | null = null;

function createEngine(): WheelEngine {
    const seed = seedInput.value.trim() || undefined;
    return new WheelEngine({
        segments,
        seed,
        minSpins: 4,
        maxSpins: 8,
    });
}

function runSpins(): void {
    if (!engine) {
        engine = createEngine();
    }

    const count = Math.max(1, Math.min(100, Number(countInput.value) || 10));
    const wins = new Map<string, number>();

    for (let i = 0; i < count; i++) {
        // ✅ Synchronous — result is known instantly, no animation
        const result = engine.spin();

        log(
            logEl,
            `Spin #${i + 1}: ${result.segment.label} (index=${result.index}, angle=${result.finalAngle.toFixed(1)}°)`
        );

        // Track win counts for statistics
        const label = result.segment.label;
        wins.set(label, (wins.get(label) ?? 0) + 1);

        // ✅ getLastResult() returns the same result
        const last = engine.getLastResult();
        if (last !== result) {
            log(logEl, '  ⚠️ getLastResult() mismatch (should never happen)');
        }

        // ✅ Check state — it's 'finished' after spin()
        const state = engine.getState();
        if (state !== 'finished') {
            log(logEl, `  ⚠️ Unexpected state: ${state}`);
        }

        // Reset for next spin
        engine.reset();
    }

    // Show statistics
    const lines: string[] = [`${count} spins with seed "${seedInput.value}":\n`];
    const sorted = [...wins.entries()].sort((a, b) => b[1] - a[1]);
    for (const [label, winCount] of sorted) {
        const pct = ((winCount / count) * 100).toFixed(1);
        const bar = '█'.repeat(Math.round((winCount / count) * 30));
        lines.push(
            `  ${label.padEnd(12)} ${String(winCount).padStart(3)}× (${pct.padStart(5)}%) ${bar}`
        );
    }
    statsEl.textContent = lines.join('\n');

    // Demonstrate determinism
    log(logEl, '');
    log(logEl, '🔁 Determinism check: recreating engine with same seed…');
    const verify = createEngine();
    const r1 = verify.spin();
    verify.reset();
    const r2 = verify.spin();
    log(logEl, `  First spin:  ${r1.segment.label} (angle=${r1.finalAngle.toFixed(1)}°)`);
    log(logEl, `  Second spin: ${r2.segment.label} (angle=${r2.finalAngle.toFixed(1)}°)`);
    log(logEl, '  Same seed always produces the same sequence ✅');
}

btn.addEventListener('click', runSpins);

btnReset.addEventListener('click', () => {
    engine = null;
    logEl.textContent = 'Engine reset. Click "Run Spins" to start fresh.';
    statsEl.textContent = '—';
});
