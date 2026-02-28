/**
 * @spin-wheel/embed — IIFE / Global entry point.
 *
 * Exposes a single `window.SpinWheel` namespace with:
 *   .create()   — manual init
 *   .autoInit()  — data-attribute scanning
 *   .injectCss() — manual CSS injection
 *   .load()      — async script loader
 *   .version     — semver string
 */

import { SpinWheelWidget } from '@spin-wheel/widget';
import { autoInit } from './autoInit.js';
import { injectCss } from './css.js';
import { load } from './loader.js';
import type { SpinWheelCreateConfig, SpinWheelGlobal } from './types.js';

const SpinWheel: SpinWheelGlobal = {
    version: '1.0.0',

    create(elOrSelector: HTMLElement | string, config: SpinWheelCreateConfig) {
        if (config.injectCss !== false) {
            injectCss();
        }
        return SpinWheelWidget.create(elOrSelector, config);
    },

    autoInit,
    injectCss,
    load,
};

// Attach to global
window.SpinWheel = SpinWheel;

export default SpinWheel;
