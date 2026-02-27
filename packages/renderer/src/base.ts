import type { WheelSegment } from '@spin-wheel/core';
import type { EasingFn, WheelRenderer } from './types.js';

/** Shared colour palette for segments. */
export const SEGMENT_COLORS: readonly string[] = [
	'#FF6B6B',
	'#4ECDC4',
	'#45B7D1',
	'#96CEB4',
	'#FFEAA7',
	'#DDA0DD',
	'#98D8C8',
	'#F7DC6F',
	'#BB8FCE',
	'#85C1E9',
];

/** Pick a colour for a segment by index. */
export function colorForIndex(index: number): string {
	return SEGMENT_COLORS[index % SEGMENT_COLORS.length]!;
}

/**
 * Abstract base providing common state management for renderers.
 * Subclasses implement the actual drawing.
 */
export abstract class BaseRenderer implements WheelRenderer {
	protected container: HTMLElement | null = null;
	protected segments: readonly WheelSegment[] = [];
	protected currentAngle = 0;
	protected width = 300;
	protected height = 300;

	mount(el: HTMLElement): void {
		this.container = el;
		this.onMount(el);
	}

	setSegments(segments: readonly WheelSegment[]): void {
		this.segments = segments;
		this.draw();
	}

	setAngle(angle: number): void {
		this.currentAngle = angle;
		this.draw();
	}

	rotateTo(angle: number, duration: number, easing: EasingFn): Promise<void> {
		return new Promise<void>((resolve) => {
			const startAngle = this.currentAngle;
			const delta = angle - startAngle;
			const startTime = performance.now();

			const tick = (now: number): void => {
				const elapsed = now - startTime;
				const t = Math.min(elapsed / duration, 1);
				const eased = easing(t);

				this.currentAngle = startAngle + delta * eased;
				this.draw();

				if (t < 1) {
					requestAnimationFrame(tick);
				} else {
					this.currentAngle = angle;
					this.draw();
					resolve();
				}
			};

			requestAnimationFrame(tick);
		});
	}

	resize(width: number, height: number): void {
		this.width = width;
		this.height = height;
		this.onResize();
		this.draw();
	}

	destroy(): void {
		this.onDestroy();
		this.container = null;
	}

	/** Called when mounting; subclass should create its root element. */
	protected abstract onMount(el: HTMLElement): void;

	/** Called on resize. */
	protected abstract onResize(): void;

	/** Called on destroy. */
	protected abstract onDestroy(): void;

	/** Draw the current state. */
	protected abstract draw(): void;
}
