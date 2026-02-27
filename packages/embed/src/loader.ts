import type { LoadOptions, SpinWheelGlobal } from './types.js';

/**
 * Internal cache to ensure the global script is only loaded once.
 */
let loadPromise: Promise<SpinWheelGlobal> | null = null;

/**
 * Asynchronously inject the SpinWheel global script into the page.
 *
 * Usage (from a tiny inline snippet):
 * ```js
 * SpinWheel.load({ src: 'https://cdn.example.com/spin-wheel.global.js', autoInit: true });
 * ```
 *
 * The returned promise resolves with the `window.SpinWheel` global.
 * Multiple calls are idempotent — the script is loaded only once.
 */
export function load(options: LoadOptions): Promise<SpinWheelGlobal> {
	if (loadPromise) return loadPromise;

	loadPromise = new Promise<SpinWheelGlobal>((resolve, reject) => {
		// If the global already exists (script was loaded manually), resolve immediately
		const existing = window.SpinWheel;
		if (existing) {
			if (options.autoInit) existing.autoInit();
			resolve(existing);
			return;
		}

		const script = document.createElement('script');
		script.src = options.src;
		script.async = true;
		script.onload = () => {
			const sw = window.SpinWheel;
			if (!sw) {
				reject(new Error('[SpinWheel] Global not found after script loaded.'));
				return;
			}
			if (options.autoInit) sw.autoInit();
			resolve(sw);
		};
		script.onerror = () => {
			loadPromise = null; // allow retry
			reject(new Error(`[SpinWheel] Failed to load script: ${options.src}`));
		};
		document.head.appendChild(script);
	});

	return loadPromise;
}
