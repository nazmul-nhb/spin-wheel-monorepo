import type { WheelSegment } from '@spin-wheel/core';
import { SpinWheelWidget } from '@spin-wheel/widget';
import { injectCss } from './css.js';
import type { AutoInitOptions } from './types.js';

/**
 * Dispatch a custom DOM event namespaced under `spinwheel:`.
 */
function emit(el: HTMLElement, name: string, detail: unknown): void {
	el.dispatchEvent(new CustomEvent(`spinwheel:${name}`, { bubbles: true, detail }));
}

/**
 * Parse data attributes from a host element into a widget config,
 * mount the widget, and optionally add a spin button.
 */
function mountFromElement(el: HTMLElement): SpinWheelWidget {
	const ds = el.dataset;
	const renderer = (ds.renderer ?? 'canvas') as 'canvas' | 'svg';
	const durationMs = Number(ds.duration) || 4000;
	const minSpins = Number(ds.minSpins) || undefined;
	const maxSpins = Number(ds.maxSpins) || undefined;
	const seed = ds.seed ?? undefined;

	// Parse segments JSON — callers must ensure trusted input
	let segments: WheelSegment[] = [];
	const raw = ds.segments;
	if (raw) {
		try {
			segments = JSON.parse(raw) as WheelSegment[];
		} catch {
			console.error('[SpinWheel] Invalid JSON in data-segments:', raw);
		}
	}

	if (segments.length === 0) {
		console.warn('[SpinWheel] No segments found — skipping mount for', el);
		// Provide a fallback single segment so the widget constructor doesn't throw
		segments = [{ id: '_empty', label: '?' }];
	}

	const widget = SpinWheelWidget.create(el, {
		segments,
		renderer,
		durationMs,
		minSpins,
		maxSpins,
		seed,
		onFinish(result) {
			emit(el, 'finish', result);
		},
		onStateChange(state) {
			emit(el, 'state', { state });
		},
	});

	emit(el, 'ready', { widget });

	// Optional spin button
	const wantsButton = ds.spinButton === 'true';
	if (wantsButton) {
		const btnText = ds.spinButtonText || 'Spin';
		const btn = document.createElement('button');
		btn.className = 'sw-spin-btn';
		btn.textContent = btnText;
		btn.addEventListener('click', () => {
			if (widget.isSpinning || widget.isDestroyed) return;
			btn.disabled = true;
			widget.spin().finally(() => {
				btn.disabled = false;
			});
		});
		el.appendChild(btn);
	}

	return widget;
}

/**
 * Scan the DOM for elements matching `[data-spin-wheel]` and mount a
 * `SpinWheelWidget` on each one.
 *
 * @returns Array of created widget instances.
 */
export function autoInit(options?: AutoInitOptions): SpinWheelWidget[] {
	const selector = options?.selector ?? '[data-spin-wheel]';
	const shouldInjectCss = options?.injectCss !== false;

	if (shouldInjectCss) {
		injectCss();
	}

	const elements = document.querySelectorAll<HTMLElement>(selector);
	const widgets: SpinWheelWidget[] = [];

	for (const el of elements) {
		try {
			widgets.push(mountFromElement(el));
		} catch (err) {
			console.error('[SpinWheel] Failed to auto-init element:', el, err);
		}
	}

	return widgets;
}
