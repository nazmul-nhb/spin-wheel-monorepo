import { SpinWheelWidget } from '@spin-wheel/widget';
import { $, segments } from './shared.js';

/**
 * Example 1 — await widget.spin()
 *
 * The simplest and recommended way to collect the spin result.
 * `widget.spin()` returns a `Promise<SpinResult>` that resolves
 * once the animation finishes.
 */

const resultEl = $('#result');
const btn = $('#btn') as HTMLButtonElement;

const widget = SpinWheelWidget.create('#wheel', {
    segments,
    renderer: 'canvas',
    durationMs: 4000,
});

btn.addEventListener('click', async () => {
    btn.disabled = true;
    resultEl.textContent = 'Spinning…';

    // ✅ The key pattern: await the returned promise
    const result = await widget.spin();

    resultEl.textContent = [
        `✅ Winner: ${result.segment.label}`,
        ``,
        `   index:      ${result.index}`,
        `   segment.id: ${result.segment.id}`,
        `   weight:     ${result.segment.weight ?? 1}`,
        `   data:       ${JSON.stringify(result.segment.data ?? null)}`,
        `   finalAngle: ${result.finalAngle.toFixed(2)}°`,
    ].join('\n');

    btn.disabled = false;
});
