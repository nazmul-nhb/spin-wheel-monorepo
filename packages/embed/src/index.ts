/**
 * @spin-wheel/embed — ESM / CJS entry point.
 *
 * For bundler users who want the auto-init / loader helpers alongside
 * the widget. Tree-shakeable — only what you import gets bundled.
 */

export { SpinWheelWidget } from '@spin-wheel/widget';
export { autoInit } from './autoInit.js';
export { injectCss } from './css.js';
export { load } from './loader.js';
export type {
    AutoInitOptions,
    LoadOptions,
    SpinResult,
    SpinWheelCreateConfig,
    SpinWheelGlobal,
    WheelSegment,
    WheelState,
} from './types.js';

/** Embed SDK version. */
export const version = '1.0.0';
