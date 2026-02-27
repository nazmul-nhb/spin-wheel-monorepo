
//#region src/base.ts
/** Shared colour palette for segments. */
const SEGMENT_COLORS = [
	"#FF6B6B",
	"#4ECDC4",
	"#45B7D1",
	"#96CEB4",
	"#FFEAA7",
	"#DDA0DD",
	"#98D8C8",
	"#F7DC6F",
	"#BB8FCE",
	"#85C1E9"
];
/** Pick a colour for a segment by index. */
function colorForIndex(index) {
	return SEGMENT_COLORS[index % SEGMENT_COLORS.length];
}
/**
* Abstract base providing common state management for renderers.
* Subclasses implement the actual drawing.
*/
var BaseRenderer = class {
	container = null;
	segments = [];
	currentAngle = 0;
	width = 300;
	height = 300;
	mount(el) {
		this.container = el;
		this.onMount(el);
	}
	setSegments(segments) {
		this.segments = segments;
		this.draw();
	}
	setAngle(angle) {
		this.currentAngle = angle;
		this.draw();
	}
	rotateTo(angle, duration, easing) {
		return new Promise((resolve) => {
			const startAngle = this.currentAngle;
			const delta = angle - startAngle;
			const startTime = performance.now();
			const tick = (now) => {
				const elapsed = now - startTime;
				const t = Math.min(elapsed / duration, 1);
				const eased = easing(t);
				this.currentAngle = startAngle + delta * eased;
				this.draw();
				if (t < 1) requestAnimationFrame(tick);
				else {
					this.currentAngle = angle;
					this.draw();
					resolve();
				}
			};
			requestAnimationFrame(tick);
		});
	}
	resize(width, height) {
		this.width = width;
		this.height = height;
		this.onResize();
		this.draw();
	}
	destroy() {
		this.onDestroy();
		this.container = null;
	}
};

//#endregion
//#region src/canvas/draw.ts
/**
* Draw a single wheel slice on a canvas context.
*/
function drawSlice(ctx, cx, cy, radius, startAngle, endAngle, index) {
	ctx.beginPath();
	ctx.moveTo(cx, cy);
	ctx.arc(cx, cy, radius, startAngle, endAngle);
	ctx.closePath();
	ctx.fillStyle = colorForIndex(index);
	ctx.fill();
	ctx.strokeStyle = "#fff";
	ctx.lineWidth = 2;
	ctx.stroke();
}
/**
* Draw a label along the midpoint of a slice.
*/
function drawLabel(ctx, cx, cy, radius, midAngle, label) {
	ctx.save();
	ctx.translate(cx, cy);
	ctx.rotate(midAngle);
	ctx.textAlign = "right";
	ctx.fillStyle = "#333";
	ctx.font = `bold ${Math.max(10, radius * .08)}px sans-serif`;
	ctx.fillText(label, radius * .82, 4);
	ctx.restore();
}
/**
* Draw the center hub circle.
*/
function drawHub(ctx, cx, cy, radius) {
	ctx.beginPath();
	ctx.arc(cx, cy, radius * .1, 0, Math.PI * 2);
	ctx.fillStyle = "#fff";
	ctx.fill();
	ctx.strokeStyle = "#ccc";
	ctx.lineWidth = 2;
	ctx.stroke();
}
/**
* Draw the fixed pointer at the top.
*/
function drawPointer(ctx, cx, topY) {
	const size = 16;
	ctx.beginPath();
	ctx.moveTo(cx, topY);
	ctx.lineTo(cx - size / 2, topY - size);
	ctx.lineTo(cx + size / 2, topY - size);
	ctx.closePath();
	ctx.fillStyle = "#e74c3c";
	ctx.fill();
	ctx.strokeStyle = "#c0392b";
	ctx.lineWidth = 1;
	ctx.stroke();
}
/**
* Full wheel draw routine.
*/
function drawWheel(ctx, segments, angleDeg, width, height) {
	const dpr = typeof devicePixelRatio !== "undefined" ? devicePixelRatio : 1;
	ctx.clearRect(0, 0, width * dpr, height * dpr);
	const cx = width * dpr / 2;
	const cy = height * dpr / 2;
	const radius = Math.min(cx, cy) * .85;
	if (segments.length === 0) return;
	const sliceAngle = Math.PI * 2 / segments.length;
	const rotRad = angleDeg * Math.PI / 180;
	const offsetRad = -Math.PI / 2 - sliceAngle / 2 + rotRad;
	for (let i = 0; i < segments.length; i++) {
		const start = offsetRad + i * sliceAngle;
		const end = start + sliceAngle;
		drawSlice(ctx, cx, cy, radius, start, end, i);
		const mid = start + sliceAngle / 2;
		drawLabel(ctx, cx, cy, radius, mid, segments[i].label);
	}
	drawHub(ctx, cx, cy, radius);
	drawPointer(ctx, cx, cy - radius - 4);
}

//#endregion
//#region src/canvas/CanvasRenderer.ts
/** Canvas-based wheel renderer. */
var CanvasRenderer = class extends BaseRenderer {
	canvas = null;
	ctx = null;
	onMount(el) {
		this.canvas = document.createElement("canvas");
		this.canvas.style.display = "block";
		el.appendChild(this.canvas);
		this.ctx = this.canvas.getContext("2d");
		this.applySize();
	}
	onResize() {
		this.applySize();
	}
	onDestroy() {
		if (this.canvas && this.container) this.container.removeChild(this.canvas);
		this.canvas = null;
		this.ctx = null;
	}
	draw() {
		if (!this.ctx) return;
		drawWheel(this.ctx, this.segments, this.currentAngle, this.width, this.height);
	}
	applySize() {
		if (!this.canvas) return;
		const dpr = typeof devicePixelRatio !== "undefined" ? devicePixelRatio : 1;
		this.canvas.width = this.width * dpr;
		this.canvas.height = this.height * dpr;
		this.canvas.style.width = `${this.width}px`;
		this.canvas.style.height = `${this.height}px`;
	}
};

//#endregion
//#region src/svg/SvgRenderer.ts
const SVG_NS = "http://www.w3.org/2000/svg";
/** Utility to create an SVG element. */
function svgEl(tag, attrs) {
	const el = document.createElementNS(SVG_NS, tag);
	if (attrs) for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
	return el;
}
/** Compute a point on a circle. */
function polarToCartesian(cx, cy, r, angleDeg) {
	const rad = angleDeg * Math.PI / 180;
	return {
		x: cx + r * Math.cos(rad),
		y: cy + r * Math.sin(rad)
	};
}
/** Build an SVG arc path for a wedge. */
function wedgePath(cx, cy, r, startDeg, endDeg) {
	const start = polarToCartesian(cx, cy, r, endDeg);
	const end = polarToCartesian(cx, cy, r, startDeg);
	const largeArc = endDeg - startDeg > 180 ? 1 : 0;
	return [
		`M ${cx} ${cy}`,
		`L ${start.x} ${start.y}`,
		`A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`,
		"Z"
	].join(" ");
}
/** SVG-based wheel renderer. */
var SvgRenderer = class extends BaseRenderer {
	svg = null;
	wheelGroup = null;
	pointerEl = null;
	onMount(el) {
		this.svg = svgEl("svg", {
			viewBox: `0 0 ${this.width} ${this.height}`,
			width: String(this.width),
			height: String(this.height)
		});
		this.svg.style.display = "block";
		this.wheelGroup = svgEl("g");
		this.svg.appendChild(this.wheelGroup);
		this.pointerEl = svgEl("polygon");
		this.svg.appendChild(this.pointerEl);
		el.appendChild(this.svg);
		this.updatePointer();
	}
	onResize() {
		if (!this.svg) return;
		this.svg.setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);
		this.svg.setAttribute("width", String(this.width));
		this.svg.setAttribute("height", String(this.height));
		this.updatePointer();
	}
	onDestroy() {
		if (this.svg && this.container) this.container.removeChild(this.svg);
		this.svg = null;
		this.wheelGroup = null;
		this.pointerEl = null;
	}
	draw() {
		if (!this.wheelGroup || !this.svg) return;
		while (this.wheelGroup.firstChild) this.wheelGroup.removeChild(this.wheelGroup.firstChild);
		const cx = this.width / 2;
		const cy = this.height / 2;
		const radius = Math.min(cx, cy) * .85;
		if (this.segments.length === 0) return;
		const sliceDeg = 360 / this.segments.length;
		const offsetDeg = -90 - sliceDeg / 2;
		for (let i = 0; i < this.segments.length; i++) {
			const startDeg = offsetDeg + i * sliceDeg;
			const endDeg = startDeg + sliceDeg;
			const d = wedgePath(cx, cy, radius, startDeg, endDeg);
			const path = svgEl("path", {
				d,
				fill: colorForIndex(i),
				stroke: "#fff",
				"stroke-width": "2"
			});
			this.wheelGroup.appendChild(path);
			const midDeg = startDeg + sliceDeg / 2;
			const labelR = radius * .65;
			const lp = polarToCartesian(cx, cy, labelR, midDeg);
			const text = svgEl("text", {
				x: String(lp.x),
				y: String(lp.y),
				fill: "#333",
				"font-size": String(Math.max(10, radius * .08)),
				"font-weight": "bold",
				"text-anchor": "middle",
				"dominant-baseline": "central"
			});
			text.textContent = this.segments[i].label;
			this.wheelGroup.appendChild(text);
		}
		const hub = svgEl("circle", {
			cx: String(cx),
			cy: String(cy),
			r: String(radius * .1),
			fill: "#fff",
			stroke: "#ccc",
			"stroke-width": "2"
		});
		this.wheelGroup.appendChild(hub);
		this.wheelGroup.setAttribute("transform", `rotate(${this.currentAngle} ${cx} ${cy})`);
	}
	updatePointer() {
		if (!this.pointerEl) return;
		const cx = this.width / 2;
		const radius = Math.min(this.width, this.height) / 2 * .85;
		const topY = this.height / 2 - radius - 4;
		const size = 16;
		this.pointerEl.setAttribute("points", `${cx},${topY} ${cx - size / 2},${topY - size} ${cx + size / 2},${topY - size}`);
		this.pointerEl.setAttribute("fill", "#e74c3c");
		this.pointerEl.setAttribute("stroke", "#c0392b");
		this.pointerEl.setAttribute("stroke-width", "1");
	}
};

//#endregion
exports.BaseRenderer = BaseRenderer;
exports.CanvasRenderer = CanvasRenderer;
exports.SEGMENT_COLORS = SEGMENT_COLORS;
exports.SvgRenderer = SvgRenderer;
exports.colorForIndex = colorForIndex;
//# sourceMappingURL=index.cjs.map