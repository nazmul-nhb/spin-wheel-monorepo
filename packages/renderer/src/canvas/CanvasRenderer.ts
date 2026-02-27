import { BaseRenderer } from '../base.js';
import { drawWheel } from './draw.js';

/** Canvas-based wheel renderer. */
export class CanvasRenderer extends BaseRenderer {
	private canvas: HTMLCanvasElement | null = null;
	private ctx: CanvasRenderingContext2D | null = null;

	/** Cached device-pixel-ratio, updated on mount / resize. */
	private dpr = 1;

	protected onMount(el: HTMLElement): void {
		this.canvas = document.createElement('canvas');
		this.canvas.style.display = 'block';
		el.appendChild(this.canvas);
		this.ctx = this.canvas.getContext('2d');
		this.applySize();
	}

	protected onResize(): void {
		this.applySize();
	}

	protected onDestroy(): void {
		if (this.canvas && this.container) {
			this.container.removeChild(this.canvas);
		}
		this.canvas = null;
		this.ctx = null;
	}

	protected draw(): void {
		if (!this.ctx) return;
		drawWheel(this.ctx, this.segments, this.currentAngle, this.width, this.height, this.dpr);
	}

	private applySize(): void {
		if (!this.canvas) return;
		this.dpr = typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 1;
		this.canvas.width = this.width * this.dpr;
		this.canvas.height = this.height * this.dpr;
		this.canvas.style.width = `${this.width}px`;
		this.canvas.style.height = `${this.height}px`;
	}
}
