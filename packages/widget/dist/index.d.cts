import { SpinResult, SpinResult as SpinResult$1, WheelSegment, WheelSegment as WheelSegment$1, WheelState, WheelState as WheelState$1 } from "@spin-wheel/core";

//#region src/types.d.ts
/** Configuration for the SpinWheelWidget. */
interface SpinWheelWidgetConfig {
  /** Wheel segments. */
  segments: WheelSegment$1[];
  /** Which renderer backend to use (defaults to "canvas"). */
  renderer?: "canvas" | "svg";
  /** Duration of the spin animation in milliseconds (defaults to 4000). */
  durationMs?: number;
  /** Minimum full spins (passed to engine). */
  minSpins?: number;
  /** Maximum full spins (passed to engine). */
  maxSpins?: number;
  /** Seed for deterministic results. */
  seed?: string;
  /** Called when a spin finishes with the result. */
  onFinish?: (result: SpinResult$1) => void;
  /** Called when the engine state changes. */
  onStateChange?: (state: WheelState$1) => void;
}
//# sourceMappingURL=types.d.ts.map
//#endregion
//#region src/SpinWheelWidget.d.ts
/** Public drop-in widget combining engine and renderer. */
declare class SpinWheelWidget {
  private readonly engine;
  private readonly renderer;
  private readonly container;
  private readonly durationMs;
  private readonly config;
  private spinning;
  private constructor();
  /**
   * Factory method. Accepts either an HTMLElement or a CSS selector.
   */
  static create(elOrSelector: HTMLElement | string, config: SpinWheelWidgetConfig): SpinWheelWidget;
  /** Trigger a spin. Resolves with the result when animation finishes. */
  spin(): Promise<SpinResult$1>;
  /** Replace segments on both engine and renderer. */
  setSegments(segments: WheelSegment$1[]): void;
  /** Reset the widget to initial state. */
  reset(): void;
  /** Tear down. */
  destroy(): void;
  private notify;
}
//# sourceMappingURL=SpinWheelWidget.d.ts.map
//#endregion
export { type SpinResult, SpinWheelWidget, type SpinWheelWidgetConfig, type WheelSegment, type WheelState };
//# sourceMappingURL=index.d.cts.map