import type { WheelSegment } from '@spin-wheel/core';

/** Easing function signature. */
export type EasingFn = (t: number) => number;

/** Interface that every renderer must implement. */
export interface WheelRenderer {
	/** Mount the renderer inside the given container element. */
	mount(el: HTMLElement): void;

	/** Update the segments to render. */
	setSegments(segments: readonly WheelSegment[]): void;

	/** Snap the wheel to the given angle (degrees) without animating. */
	setAngle(angle: number): void;

	/**
	 * Animate the wheel to a target angle over a duration.
	 * Resolves when the animation completes.
	 */
	rotateTo(angle: number, duration: number, easing: EasingFn): Promise<void>;

	/** Resize the rendered wheel. */
	resize(width: number, height: number): void;

	/** Tear down the renderer and clean up DOM. */
	destroy(): void;
}
