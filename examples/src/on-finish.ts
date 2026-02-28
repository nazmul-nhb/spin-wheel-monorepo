import { SpinWheelWidget } from '@spin-wheel/widget';
import { $, log, segments } from './shared.js';

/**
 * Example 2 — onFinish callback
 *
 * Instead of awaiting the promise, you pass `onFinish` and/or
 * `onStateChange` callbacks in the widget config. These fire
 * automatically when the spin lifecycle progresses.
 */

const logEl = $('#log');
const stateLogEl = $('#state-log');
const btn = $('#btn') as HTMLButtonElement;

let spinCount = 0;

const widget = SpinWheelWidget.create('#wheel', {
    segments,
    renderer: 'svg',
    durationMs: 3500,

    // ✅ onFinish — receives the SpinResult after animation completes
    onFinish(result) {
        spinCount++;
        log(
            logEl,
            `Spin #${spinCount}: ${result.segment.label} (index=${result.index}, angle=${result.finalAngle.toFixed(1)}°)`
        );

        if (result.segment.data) {
            log(logEl, `  ↳ payload: ${JSON.stringify(result.segment.data)}`);
        }
    },

    // ✅ onStateChange — tracks the full lifecycle
    onStateChange(state) {
        log(stateLogEl, `State → ${state}`);
    },
});

btn.addEventListener('click', () => {
    btn.disabled = true;
    // Fire and forget — result is handled by the callback
    widget.spin().finally(() => {
        btn.disabled = false;
    });
});
