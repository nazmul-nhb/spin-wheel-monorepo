import type { WheelSegment } from '@spin-wheel/core';
import type { EasingFn, WheelRenderer } from './types.js';

/** Shared colour palette for segments. */
export const SEGMENT_COLORS: readonly string[] = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEAA7',
    '#DDA0DD',
    '#98D8C8',
    '#F7DC6F',
    '#BB8FCE',
    '#85C1E9',
];

/** Pick a colour for a segment by index. */
export function colorForIndex(index: number): string {
    const len = SEGMENT_COLORS.length;
    return SEGMENT_COLORS[((index % len) + len) % len] ?? '#cccccc';
}

/**
 * Abstract base providing common state management for renderers.
 * Subclasses implement the actual drawing.
 *
 * Handles animation lifecycle, RAF cancellation on destroy, and
 * guards against drawing after the renderer is destroyed.
 */
export abstract class BaseRenderer implements WheelRenderer {
    protected container: HTMLElement | null = null;
    protected segments: readonly WheelSegment[] = [];
    protected currentAngle = 0;
    protected width = 300;
    protected height = 300;

    /** Whether this renderer has been destroyed. */
    protected destroyed = false;

    /** Current RAF handle, used for cancellation. */
    private rafId: number | null = null;

    /** Rejection callback for the active rotateTo promise. */
    private pendingReject: ((reason: Error) => void) | null = null;

    mount(el: HTMLElement): void {
        if (this.destroyed) {
            throw new Error('Cannot mount a destroyed renderer.');
        }
        this.container = el;
        this.onMount(el);
    }

    setSegments(segments: readonly WheelSegment[]): void {
        this.segments = segments;
        this.onSegmentsChanged();
        this.scheduleDraw();
    }

    /**
     * Hook called after segments are replaced.
     * Subclasses can override to rebuild internal structures (e.g. SVG DOM).
     */
    protected onSegmentsChanged(): void {
        /* no-op by default */
    }

    setAngle(angle: number): void {
        this.currentAngle = angle;
        this.scheduleDraw();
    }

    rotateTo(angle: number, duration: number, easing: EasingFn): Promise<void> {
        // Cancel any previously running animation
        this.cancelAnimation();

        return new Promise<void>((resolve, reject) => {
            this.pendingReject = reject;
            const startAngle = this.currentAngle;
            const delta = angle - startAngle;
            const startTime = performance.now();

            const tick = (now: number): void => {
                if (this.destroyed) return;

                const elapsed = now - startTime;
                const t = Math.min(elapsed / duration, 1);
                const eased = easing(t);

                this.currentAngle = startAngle + delta * eased;
                this.draw();

                if (t < 1) {
                    this.rafId = requestAnimationFrame(tick);
                } else {
                    this.currentAngle = angle;
                    this.draw();
                    this.rafId = null;
                    this.pendingReject = null;
                    resolve();
                }
            };

            this.rafId = requestAnimationFrame(tick);
        });
    }

    resize(width: number, height: number): void {
        this.width = width;
        this.height = height;
        this.onResize();
        this.scheduleDraw();
    }

    destroy(): void {
        if (this.destroyed) return;
        this.destroyed = true;
        this.cancelAnimation();
        this.onDestroy();
        this.container = null;
    }

    /** Called when mounting; subclass should create its root element. */
    protected abstract onMount(el: HTMLElement): void;

    /** Called on resize. */
    protected abstract onResize(): void;

    /** Called on destroy. */
    protected abstract onDestroy(): void;

    /** Draw the current state. */
    protected abstract draw(): void;

    /** Draws only if not destroyed and mounted. */
    private scheduleDraw(): void {
        if (!this.destroyed) {
            this.draw();
        }
    }

    /** Cancel any in-flight RAF and reject the pending promise. */
    private cancelAnimation(): void {
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        if (this.pendingReject) {
            this.pendingReject(
                new Error('Animation cancelled (renderer destroyed or new animation started).')
            );
            this.pendingReject = null;
        }
    }
}
