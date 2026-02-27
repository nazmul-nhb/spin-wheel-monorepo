import type { WheelSegment } from '@spin-wheel/core';

/** Shared segments used across all examples. */
export const segments: WheelSegment[] = [
	{ id: 'pizza', label: '🍕 Pizza', weight: 2 },
	{ id: 'burger', label: '🍔 Burger', weight: 1 },
	{ id: 'tacos', label: '🌮 Tacos', weight: 3 },
	{ id: 'sushi', label: '🍣 Sushi', weight: 1, data: { coupon: 'SUSHI10' } },
	{ id: 'salad', label: '🥗 Salad', weight: 2 },
	{ id: 'ramen', label: '🍜 Ramen', weight: 1, data: { coupon: 'RAMEN20' } },
];

/** Helper to append a log line to a container element. */
export function log(el: HTMLElement, message: string): void {
	const line = document.createElement('div');
	line.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
	el.prepend(line);
}

/** Typed helper to get an element or throw. */
export function $(selector: string): HTMLElement {
	const el = document.querySelector<HTMLElement>(selector);
	if (!el) throw new Error(`Element not found: ${selector}`);
	return el;
}
