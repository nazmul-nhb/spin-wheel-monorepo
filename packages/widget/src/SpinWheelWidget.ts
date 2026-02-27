import {
	WheelEngine,
	easeOutCubic,
	type SpinResult,
	type WheelSegment,
} from '@spin-wheel/core';
import { CanvasRenderer, SvgRenderer, type WheelRenderer } from '@spin-wheel/renderer';
import { injectStyles } from './style.js';
import type { SpinWheelWidgetConfig } from './types.js';

/** Public drop-in widget combining engine and renderer. */
export class SpinWheelWidget {
	private readonly engine: WheelEngine;
	private readonly renderer: WheelRenderer;
	private readonly container: HTMLElement;
	private readonly durationMs: number;
	private readonly config: SpinWheelWidgetConfig;
	private spinning = false;

	private constructor(el: HTMLElement, config: SpinWheelWidgetConfig) {
		this.config = config;
		this.durationMs = config.durationMs ?? 4000;
		this.container = el;

		this.engine = new WheelEngine({
			segments: config.segments,
			minSpins: config.minSpins,
			maxSpins: config.maxSpins,
			seed: config.seed,
		});

		this.renderer = config.renderer === 'svg' ? new SvgRenderer() : new CanvasRenderer();

		injectStyles();
		el.classList.add('sw-container');

		const size = Math.min(el.clientWidth || 300, el.clientHeight || 300) || 300;
		this.renderer.mount(el);
		this.renderer.resize(size, size);
		this.renderer.setSegments(config.segments);
		this.renderer.setAngle(0);
	}

	/**
	 * Factory method. Accepts either an HTMLElement or a CSS selector.
	 */
	static create(
		elOrSelector: HTMLElement | string,
		config: SpinWheelWidgetConfig
	): SpinWheelWidget {
		const el =
			typeof elOrSelector === 'string' ?
				document.querySelector<HTMLElement>(elOrSelector)
			:	elOrSelector;

		if (!el) {
			throw new Error(
				`SpinWheelWidget: element not found for selector "${String(elOrSelector)}"`
			);
		}

		return new SpinWheelWidget(el, config);
	}

	/** Trigger a spin. Resolves with the result when animation finishes. */
	async spin(): Promise<SpinResult> {
		if (this.spinning) {
			throw new Error('A spin is already in progress.');
		}

		this.spinning = true;
		this.notify('spinning');

		// 1. Determine result BEFORE animation
		const result = this.engine.spin();

		// 2. Animate to final angle
		await this.renderer.rotateTo(result.finalAngle, this.durationMs, easeOutCubic);

		// 3. Emit result
		this.config.onFinish?.(result);
		this.notify('finished');

		// 4. Reset engine state for next spin (keep renderer at final position)
		this.engine.reset();
		this.spinning = false;
		this.notify('idle');

		return result;
	}

	/** Replace segments on both engine and renderer. */
	setSegments(segments: WheelSegment[]): void {
		this.engine.setSegments(segments);
		this.renderer.setSegments(segments);
		this.renderer.setAngle(0);
	}

	/** Reset the widget to initial state. */
	reset(): void {
		this.engine.reset();
		this.renderer.setAngle(0);
		this.spinning = false;
	}

	/** Tear down. */
	destroy(): void {
		this.renderer.destroy();
		this.container.classList.remove('sw-container');
	}

	private notify(state: 'idle' | 'spinning' | 'finished'): void {
		this.config.onStateChange?.(state);
	}
}
