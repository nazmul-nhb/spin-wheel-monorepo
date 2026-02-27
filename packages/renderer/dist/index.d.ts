import { WheelSegment } from "@spin-wheel/core";

//#region src/types.d.ts
/** Easing function signature. */
type EasingFn = (t: number) => number;
/** Interface that every renderer must implement. */
interface WheelRenderer {
  /** Mount the renderer inside the given container element. */
  mount(el: HTMLElement): void;
  /** Update the segments to render. */
  setSegments(segments: readonly WheelSegment[]): void;
  /** Snap the wheel to the given angle (degrees) without animating. */
  setAngle(angle: number): void;
  /**
   * Animate the wheel to a target angle over a duration.
   * Resolves when the animation completes.
   */
  rotateTo(angle: number, duration: number, easing: EasingFn): Promise<void>;
  /** Resize the rendered wheel. */
  resize(width: number, height: number): void;
  /** Tear down the renderer and clean up DOM. */
  destroy(): void;
}
//# sourceMappingURL=types.d.ts.map
//#endregion
//#region src/base.d.ts
/** Shared colour palette for segments. */
declare const SEGMENT_COLORS: readonly string[];
/** Pick a colour for a segment by index. */
declare function colorForIndex(index: number): string;
/**
 * Abstract base providing common state management for renderers.
 * Subclasses implement the actual drawing.
 */
declare abstract class BaseRenderer implements WheelRenderer {
  protected container: HTMLElement | null;
  protected segments: readonly WheelSegment[];
  protected currentAngle: number;
  protected width: number;
  protected height: number;
  mount(el: HTMLElement): void;
  setSegments(segments: readonly WheelSegment[]): void;
  setAngle(angle: number): void;
  rotateTo(angle: number, duration: number, easing: EasingFn): Promise<void>;
  resize(width: number, height: number): void;
  destroy(): void;
  /** Called when mounting; subclass should create its root element. */
  protected abstract onMount(el: HTMLElement): void;
  /** Called on resize. */
  protected abstract onResize(): void;
  /** Called on destroy. */
  protected abstract onDestroy(): void;
  /** Draw the current state. */
  protected abstract draw(): void;
}
//# sourceMappingURL=base.d.ts.map
//#endregion
//#region src/canvas/CanvasRenderer.d.ts
/** Canvas-based wheel renderer. */
declare class CanvasRenderer extends BaseRenderer {
  private canvas;
  private ctx;
  protected onMount(el: HTMLElement): void;
  protected onResize(): void;
  protected onDestroy(): void;
  protected draw(): void;
  private applySize;
}
//# sourceMappingURL=CanvasRenderer.d.ts.map
//#endregion
//#region src/svg/SvgRenderer.d.ts
/** SVG-based wheel renderer. */
declare class SvgRenderer extends BaseRenderer {
  private svg;
  private wheelGroup;
  private pointerEl;
  protected onMount(el: HTMLElement): void;
  protected onResize(): void;
  protected onDestroy(): void;
  protected draw(): void;
  private updatePointer;
}
//# sourceMappingURL=SvgRenderer.d.ts.map

//#endregion
export { BaseRenderer, CanvasRenderer, type EasingFn, SEGMENT_COLORS, SvgRenderer, type WheelRenderer, colorForIndex };
//# sourceMappingURL=index.d.ts.map