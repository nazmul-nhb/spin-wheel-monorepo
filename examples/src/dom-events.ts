/**
 * Example 3 — DOM Events (embed auto-init)
 *
 * When using auto-init from @spin-wheel/embed, widgets dispatch typed
 * CustomEvents on the host element. They bubble, so you can listen on
 * `document` or any ancestor.
 *
 * Importing `@spin-wheel/embed` (even just the types) augments
 * `HTMLElementEventMap` and `DocumentEventMap` so all three events
 * — `spinwheel:ready`, `spinwheel:state`, `spinwheel:finish` —
 * are fully typed with no casts required.
 */

import { autoInit, injectCss } from '@spin-wheel/embed';
// The import above also pulls in the global type augmentation for
// `spinwheel:*` events on HTMLElementEventMap / DocumentEventMap.

import { $, log, segments } from './shared.js';

const readyLog = $('#ready-log');
const stateLog = $('#state-log');
const finishLog = $('#finish-log');

// ---------------------------------------------------------------------------
// 1. Listen on `document` — events bubble up from the host element
// ---------------------------------------------------------------------------

// ✅ Fully typed: e.detail is { widget: SpinWheelWidget }
document.addEventListener('spinwheel:ready', (e) => {
	const { widget } = e.detail;
	log(readyLog, `Widget ready! isSpinning=${widget.isSpinning}, isDestroyed=${widget.isDestroyed}`);

	// Add a spin button programmatically via the widget reference
	const btn = document.createElement('button');
	btn.className = 'btn';
	btn.textContent = 'Spin (from ready event)';
	btn.addEventListener('click', () => {
		if (widget.isSpinning) return;
		btn.disabled = true;
		widget.spin().finally(() => {
			btn.disabled = false;
		});
	});
	$('#wheel').after(btn);
});

// ✅ Fully typed: e.detail.state is WheelState ('idle' | 'spinning' | 'finished')
document.addEventListener('spinwheel:state', (e) => {
	const { state } = e.detail;
	log(stateLog, `State → ${state}`);
});

// ✅ Fully typed: e.detail is SpinResult { index, segment, finalAngle }
document.addEventListener('spinwheel:finish', (e) => {
	log(finishLog, `Winner: ${e.detail.segment.label} (index=${e.detail.index}, angle=${e.detail.finalAngle.toFixed(1)}°)`);

	if (e.detail.segment.data) {
		log(finishLog, `  ↳ payload: ${JSON.stringify(e.detail.segment.data)}`);
	}
});

// ---------------------------------------------------------------------------
// 2. You can also listen on a specific element
// ---------------------------------------------------------------------------

const wheelEl = $('#wheel');

wheelEl.addEventListener('spinwheel:finish', (e) => {
	// Same type safety on the element directly
	log(finishLog, `(element listener) segment.id = "${e.detail.segment.id}"`);
});

// ---------------------------------------------------------------------------
// 3. Mount via auto-init programmatically (instead of data-attributes)
// ---------------------------------------------------------------------------

// Set data attributes programmatically to demonstrate auto-init
wheelEl.dataset.spinWheel = '';
wheelEl.dataset.renderer = 'canvas';
wheelEl.dataset.duration = '3500';
wheelEl.dataset.seed = 'dom-events-example';
wheelEl.dataset.segments = JSON.stringify(segments);

injectCss();
autoInit();
