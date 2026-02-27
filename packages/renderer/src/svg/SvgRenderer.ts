import { BaseRenderer, colorForIndex } from '../base.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Utility to create an SVG element. */
function svgEl<K extends keyof SVGElementTagNameMap>(
	tag: K,
	attrs?: Record<string, string>
): SVGElementTagNameMap[K] {
	const el = document.createElementNS(SVG_NS, tag);
	if (attrs) {
		for (const [k, v] of Object.entries(attrs)) {
			el.setAttribute(k, v);
		}
	}
	return el;
}

/** Compute a point on a circle. */
function polarToCartesian(
	cx: number,
	cy: number,
	r: number,
	angleDeg: number
): { x: number; y: number } {
	const rad = (angleDeg * Math.PI) / 180;
	return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** Build an SVG arc path for a wedge. */
function wedgePath(
	cx: number,
	cy: number,
	r: number,
	startDeg: number,
	endDeg: number
): string {
	const start = polarToCartesian(cx, cy, r, endDeg);
	const end = polarToCartesian(cx, cy, r, startDeg);
	const largeArc = endDeg - startDeg > 180 ? 1 : 0;
	return [
		`M ${cx} ${cy}`,
		`L ${start.x} ${start.y}`,
		`A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`,
		'Z',
	].join(' ');
}

/** SVG-based wheel renderer. */
export class SvgRenderer extends BaseRenderer {
	private svg: SVGSVGElement | null = null;
	private wheelGroup: SVGGElement | null = null;
	private pointerEl: SVGPolygonElement | null = null;

	protected onMount(el: HTMLElement): void {
		this.svg = svgEl('svg', {
			viewBox: `0 0 ${this.width} ${this.height}`,
			width: String(this.width),
			height: String(this.height),
		});
		this.svg.style.display = 'block';

		this.wheelGroup = svgEl('g');
		this.svg.appendChild(this.wheelGroup);

		// pointer outside the rotation group
		this.pointerEl = svgEl('polygon') as SVGPolygonElement;
		this.svg.appendChild(this.pointerEl);

		el.appendChild(this.svg);
		this.updatePointer();
	}

	protected onResize(): void {
		if (!this.svg) return;
		this.svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
		this.svg.setAttribute('width', String(this.width));
		this.svg.setAttribute('height', String(this.height));
		this.updatePointer();
	}

	protected onDestroy(): void {
		if (this.svg && this.container) {
			this.container.removeChild(this.svg);
		}
		this.svg = null;
		this.wheelGroup = null;
		this.pointerEl = null;
	}

	protected draw(): void {
		if (!this.wheelGroup || !this.svg) return;

		// Clear wheel group
		while (this.wheelGroup.firstChild) {
			this.wheelGroup.removeChild(this.wheelGroup.firstChild);
		}

		const cx = this.width / 2;
		const cy = this.height / 2;
		const radius = Math.min(cx, cy) * 0.85;

		if (this.segments.length === 0) return;

		const sliceDeg = 360 / this.segments.length;
		const offsetDeg = -90 - sliceDeg / 2;

		for (let i = 0; i < this.segments.length; i++) {
			const startDeg = offsetDeg + i * sliceDeg;
			const endDeg = startDeg + sliceDeg;
			const d = wedgePath(cx, cy, radius, startDeg, endDeg);

			const path = svgEl('path', {
				d,
				fill: colorForIndex(i),
				stroke: '#fff',
				'stroke-width': '2',
			});
			this.wheelGroup.appendChild(path);

			// label
			const midDeg = startDeg + sliceDeg / 2;
			const labelR = radius * 0.65;
			const lp = polarToCartesian(cx, cy, labelR, midDeg);
			const text = svgEl('text', {
				x: String(lp.x),
				y: String(lp.y),
				fill: '#333',
				'font-size': String(Math.max(10, radius * 0.08)),
				'font-weight': 'bold',
				'text-anchor': 'middle',
				'dominant-baseline': 'central',
			});
			text.textContent = this.segments[i]!.label;
			this.wheelGroup.appendChild(text);
		}

		// hub
		const hub = svgEl('circle', {
			cx: String(cx),
			cy: String(cy),
			r: String(radius * 0.1),
			fill: '#fff',
			stroke: '#ccc',
			'stroke-width': '2',
		});
		this.wheelGroup.appendChild(hub);

		// rotation
		this.wheelGroup.setAttribute('transform', `rotate(${this.currentAngle} ${cx} ${cy})`);
	}

	private updatePointer(): void {
		if (!this.pointerEl) return;
		const cx = this.width / 2;
		const radius = (Math.min(this.width, this.height) / 2) * 0.85;
		const topY = this.height / 2 - radius - 4;
		const size = 16;
		this.pointerEl.setAttribute(
			'points',
			`${cx},${topY} ${cx - size / 2},${topY - size} ${cx + size / 2},${topY - size}`
		);
		this.pointerEl.setAttribute('fill', '#e74c3c');
		this.pointerEl.setAttribute('stroke', '#c0392b');
		this.pointerEl.setAttribute('stroke-width', '1');
	}
}
