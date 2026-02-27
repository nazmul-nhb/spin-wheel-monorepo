import type { SpinResult, WheelSegment, WheelState } from '@spin-wheel/core';
import type { SpinWheelWidget } from '@spin-wheel/widget';

// ---------------------------------------------------------------------------
// Global augmentations
// ---------------------------------------------------------------------------

declare global {
	interface Window {
		SpinWheel: SpinWheelGlobal;
	}

	interface SpinWheelEventMap {
		'spinwheel:ready': CustomEvent<{ widget: SpinWheelWidget }>;
		'spinwheel:state': CustomEvent<{ state: WheelState }>;
		'spinwheel:finish': CustomEvent<SpinResult>;
	}

	interface HTMLElementEventMap extends SpinWheelEventMap {}
	interface DocumentEventMap extends SpinWheelEventMap {}
}

// ---------------------------------------------------------------------------
// Config for manual init
// ---------------------------------------------------------------------------

/** Options passed to `SpinWheel.create()`. */
export interface SpinWheelCreateConfig {
	readonly segments: readonly WheelSegment[];
	readonly renderer?: 'canvas' | 'svg';
	readonly durationMs?: number;
	readonly minSpins?: number;
	readonly maxSpins?: number;
	readonly seed?: string;
	readonly injectCss?: boolean;
	readonly onFinish?: (result: SpinResult) => void;
	readonly onStateChange?: (state: WheelState) => void;
}

// ---------------------------------------------------------------------------
// Auto-init options
// ---------------------------------------------------------------------------

/** Options for `SpinWheel.autoInit()`. */
export interface AutoInitOptions {
	/** Selector for auto-init targets (defaults to `[data-spin-wheel]`). */
	readonly selector?: string;
	/** Skip CSS injection (defaults to false). */
	readonly injectCss?: boolean;
}

// ---------------------------------------------------------------------------
// Loader options
// ---------------------------------------------------------------------------

/** Options for the async `SpinWheel.load()` helper. */
export interface LoadOptions {
	/** URL of the spin-wheel global script. */
	readonly src: string;
	/** Call autoInit() after loading (defaults to false). */
	readonly autoInit?: boolean;
}

// ---------------------------------------------------------------------------
// Global namespace shape
// ---------------------------------------------------------------------------

/** The public `window.SpinWheel` global namespace. */
export interface SpinWheelGlobal {
	/** Semantic version string. */
	readonly version: string;
	/** Create a widget instance manually. */
	create(elOrSelector: HTMLElement | string, config: SpinWheelCreateConfig): SpinWheelWidget;
	/** Scan the DOM for `[data-spin-wheel]` elements and mount widgets. */
	autoInit(options?: AutoInitOptions): SpinWheelWidget[];
	/** Manually inject the namespaced CSS. */
	injectCss(): void;
	/** Async script loader (used from a tiny bootstrap snippet). */
	load(options: LoadOptions): Promise<SpinWheelGlobal>;
}

// Re-export useful types for consumers
export type { SpinResult, WheelSegment, WheelState } from '@spin-wheel/core';
export type { SpinWheelWidget } from '@spin-wheel/widget';
