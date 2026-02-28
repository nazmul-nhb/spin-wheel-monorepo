import type { WheelSegment } from '@spin-wheel/core';
import { colorForIndex } from '../base.js';

/**
 * Draw a single wheel slice on a canvas context.
 */
export function drawSlice(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    index: number
): void {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = colorForIndex(index);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
}

/**
 * Draw a label along the midpoint of a slice.
 */
export function drawLabel(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    midAngle: number,
    label: string
): void {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(midAngle);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#333';
    ctx.font = `bold ${Math.max(10, radius * 0.08)}px sans-serif`;
    ctx.fillText(label, radius * 0.82, 4);
    ctx.restore();
}

/**
 * Draw the center hub circle.
 */
export function drawHub(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number
): void {
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.1, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 2;
    ctx.stroke();
}

/**
 * Draw the fixed pointer at the top.
 */
export function drawPointer(ctx: CanvasRenderingContext2D, cx: number, topY: number): void {
    const size = 16;
    ctx.beginPath();
    ctx.moveTo(cx, topY);
    ctx.lineTo(cx - size / 2, topY - size);
    ctx.lineTo(cx + size / 2, topY - size);
    ctx.closePath();
    ctx.fillStyle = '#e74c3c';
    ctx.fill();
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 1;
    ctx.stroke();
}

/**
 * Full wheel draw routine. dpr is accepted as a parameter to avoid
 * per-frame lookups of the global devicePixelRatio.
 */
export function drawWheel(
    ctx: CanvasRenderingContext2D,
    segments: readonly WheelSegment[],
    angleDeg: number,
    width: number,
    height: number,
    dpr: number
): void {
    ctx.clearRect(0, 0, width * dpr, height * dpr);

    const cx = (width * dpr) / 2;
    const cy = (height * dpr) / 2;
    const radius = Math.min(cx, cy) * 0.85;

    if (segments.length === 0) return;

    const sliceAngle = (Math.PI * 2) / segments.length;
    const rotRad = (angleDeg * Math.PI) / 180;

    // Offset so the first segment starts centered at top
    const offsetRad = -Math.PI / 2 - sliceAngle / 2 + rotRad;

    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        if (!seg) continue;
        const start = offsetRad + i * sliceAngle;
        const end = start + sliceAngle;
        drawSlice(ctx, cx, cy, radius, start, end, i);

        const mid = start + sliceAngle / 2;
        drawLabel(ctx, cx, cy, radius, mid, seg.label);
    }

    drawHub(ctx, cx, cy, radius);
    drawPointer(ctx, cx, cy - radius - 4);
}
