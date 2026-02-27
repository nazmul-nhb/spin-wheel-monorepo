import { SpinWheelWidget, type WheelSegment } from '@spin-wheel/widget';

const segments: WheelSegment[] = [
	{ id: '1', label: '🍕 Pizza' },
	{ id: '2', label: '🍔 Burger' },
	{ id: '3', label: '🌮 Tacos' },
	{ id: '4', label: '🍣 Sushi' },
	{ id: '5', label: '🥗 Salad' },
	{ id: '6', label: '🍜 Ramen' },
	{ id: '7', label: '🥐 Pastry' },
	{ id: '8', label: '🍝 Pasta' },
];

function setupWheel(
	mountSelector: string,
	btnSelector: string,
	resultSelector: string,
	renderer: 'canvas' | 'svg',
): void {
	const btn = document.querySelector<HTMLButtonElement>(btnSelector);
	const resultEl = document.querySelector<HTMLElement>(resultSelector);
	if (!btn || !resultEl) return;

	const widget = SpinWheelWidget.create(mountSelector, {
		segments,
		renderer,
		durationMs: 4000,
		seed: `demo-${renderer}`,
		onFinish(result) {
			resultEl.textContent = `Winner: ${result.segment.label}`;
		},
	});

	btn.addEventListener('click', () => {
		btn.disabled = true;
		resultEl.textContent = 'Spinning...';
		widget.spin().finally(() => {
			btn.disabled = false;
		});
	});
}

setupWheel('#wheel-canvas', '#btn-canvas', '#result-canvas', 'canvas');
setupWheel('#wheel-svg', '#btn-svg', '#result-svg', 'svg');
