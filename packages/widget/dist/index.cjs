//#region rolldown:runtime
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));

//#endregion
const __spin_wheel_core = __toESM(require("@spin-wheel/core"));
const __spin_wheel_renderer = __toESM(require("@spin-wheel/renderer"));

//#region src/style.ts
const STYLE_ID = "sw-injected-styles";
/** Minimal CSS for the widget container. Injected once per page. */
const CSS = `
.sw-container {
  position: relative;
  display: inline-block;
}
.sw-container canvas,
.sw-container svg {
  display: block;
}
`;
/** Inject the widget stylesheet into the document head (idempotent). */
function injectStyles() {
	if (document.getElementById(STYLE_ID)) return;
	const style = document.createElement("style");
	style.id = STYLE_ID;
	style.textContent = CSS;
	document.head.appendChild(style);
}

//#endregion
//#region src/SpinWheelWidget.ts
/** Public drop-in widget combining engine and renderer. */
var SpinWheelWidget = class SpinWheelWidget {
	engine;
	renderer;
	container;
	durationMs;
	config;
	spinning = false;
	constructor(el, config) {
		this.config = config;
		this.durationMs = config.durationMs ?? 4e3;
		this.container = el;
		this.engine = new __spin_wheel_core.WheelEngine({
			segments: config.segments,
			minSpins: config.minSpins,
			maxSpins: config.maxSpins,
			seed: config.seed
		});
		this.renderer = config.renderer === "svg" ? new __spin_wheel_renderer.SvgRenderer() : new __spin_wheel_renderer.CanvasRenderer();
		injectStyles();
		el.classList.add("sw-container");
		const size = Math.min(el.clientWidth || 300, el.clientHeight || 300) || 300;
		this.renderer.mount(el);
		this.renderer.resize(size, size);
		this.renderer.setSegments(config.segments);
		this.renderer.setAngle(0);
	}
	/**
	* Factory method. Accepts either an HTMLElement or a CSS selector.
	*/
	static create(elOrSelector, config) {
		const el = typeof elOrSelector === "string" ? document.querySelector(elOrSelector) : elOrSelector;
		if (!el) throw new Error(`SpinWheelWidget: element not found for selector "${String(elOrSelector)}"`);
		return new SpinWheelWidget(el, config);
	}
	/** Trigger a spin. Resolves with the result when animation finishes. */
	async spin() {
		if (this.spinning) throw new Error("A spin is already in progress.");
		this.spinning = true;
		this.notify("spinning");
		const result = this.engine.spin();
		await this.renderer.rotateTo(result.finalAngle, this.durationMs, __spin_wheel_core.easeOutCubic);
		this.config.onFinish?.(result);
		this.notify("finished");
		this.engine.reset();
		this.spinning = false;
		this.notify("idle");
		return result;
	}
	/** Replace segments on both engine and renderer. */
	setSegments(segments) {
		this.engine.setSegments(segments);
		this.renderer.setSegments(segments);
		this.renderer.setAngle(0);
	}
	/** Reset the widget to initial state. */
	reset() {
		this.engine.reset();
		this.renderer.setAngle(0);
		this.spinning = false;
	}
	/** Tear down. */
	destroy() {
		this.renderer.destroy();
		this.container.classList.remove("sw-container");
	}
	notify(state) {
		this.config.onStateChange?.(state);
	}
};

//#endregion
exports.SpinWheelWidget = SpinWheelWidget;
//# sourceMappingURL=index.cjs.map