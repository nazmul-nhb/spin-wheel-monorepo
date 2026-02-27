# @spin-wheel/renderer

Canvas and SVG renderers for the Spin Wheel SDK. Handles all visual rendering, animation (via `requestAnimationFrame`), and DOM management. Pair with [`@spin-wheel/core`](../core/README.md) for the logic layer, or use [`@spin-wheel/widget`](../widget/README.md) which combines both.

## Install

```bash
npm install @spin-wheel/renderer
```

**Peer dependency:** `@spin-wheel/core` (installed automatically with npm 7+).

## Quick Start

```ts
import { WheelEngine } from '@spin-wheel/core';
import { CanvasRenderer, easeOutCubic } from '@spin-wheel/renderer';

const segments = [
  { id: '1', label: 'Prize A' },
  { id: '2', label: 'Prize B' },
  { id: '3', label: 'Prize C' },
];

// 1. Set up the renderer
const renderer = new CanvasRenderer();
renderer.mount(document.getElementById('wheel')!);
renderer.setSegments(segments);
renderer.resize(400, 400);

// 2. Spin the engine
const engine = new WheelEngine({ segments });
const result = engine.spin();

// 3. Animate to the computed angle
await renderer.rotateTo(result.finalAngle, 4000, easeOutCubic);

console.log('Landed on:', result.segment.label);
```

## When to Use This Package

- You need **low-level control** over rendering and animation
- You want to create a **custom widget** with non-standard lifecycle
- You're building a **framework-specific wrapper** and need direct renderer access

For a ready-to-use widget, use [`@spin-wheel/widget`](../widget/README.md) instead.

---

## API Reference

### Renderers

Both renderers implement the `WheelRenderer` interface and extend `BaseRenderer`.

#### `CanvasRenderer`

Renders the wheel to a `<canvas>` element. Handles device-pixel-ratio scaling automatically.

```ts
import { CanvasRenderer } from '@spin-wheel/renderer';

const renderer = new CanvasRenderer();
```

**Best for:** Smooth animations, high segment counts, pixel-perfect rendering.

#### `SvgRenderer`

Renders the wheel as an `<svg>` element. Segment paths are built **once** — per-frame updates only rotate the `<g>` group transform, making it highly efficient.

```ts
import { SvgRenderer } from '@spin-wheel/renderer';

const renderer = new SvgRenderer();
```

**Best for:** Accessibility, CSS styling, crisp scaling at any resolution.

---

### `WheelRenderer` Interface

Both renderers implement this interface:

```ts
interface WheelRenderer {
  mount(el: HTMLElement): void;
  setSegments(segments: readonly WheelSegment[]): void;
  setAngle(angle: number): void;
  rotateTo(angle: number, duration: number, easing: EasingFn): Promise<void>;
  resize(width: number, height: number): void;
  destroy(): void;
}
```

#### `renderer.mount(el: HTMLElement): void`

Mount the renderer into a DOM container. Creates either a `<canvas>` or `<svg>` element as a child.

#### `renderer.setSegments(segments: WheelSegment[]): void`

Set the segments to render. For `SvgRenderer`, this triggers a full SVG path rebuild. For `CanvasRenderer`, segments are drawn on the next frame.

#### `renderer.setAngle(angle: number): void`

Set the wheel rotation angle in degrees (no animation).

#### `renderer.rotateTo(angle, duration, easing): Promise<void>`

Animate the wheel from its current angle to the target angle. Returns a promise that resolves when the animation completes.

```ts
await renderer.rotateTo(2520, 4000, easeOutCubic);
```

- Uses `requestAnimationFrame` internally
- Starting a new animation **cancels** any in-progress animation (the previous promise rejects)
- Safe to call after `destroy()` — guards prevent drawing

#### `renderer.resize(width: number, height: number): void`

Update the renderer dimensions. `CanvasRenderer` recalculates DPR scaling; `SvgRenderer` updates the `viewBox`.

#### `renderer.destroy(): void`

Remove the rendered element from the DOM and release resources. Cancels any running animation. Idempotent.

---

### `BaseRenderer` (Abstract)

If you need a custom renderer, extend `BaseRenderer`:

```ts
import { BaseRenderer } from '@spin-wheel/renderer';

class WebGLRenderer extends BaseRenderer {
  protected onMount(el: HTMLElement): void { /* create WebGL canvas */ }
  protected draw(): void { /* render frame */ }
  protected onResize(): void { /* update viewport */ }
  protected onDestroy(): void { /* cleanup GL context */ }
}
```

| Abstract method | Called when                                                    |
| --------------- | -------------------------------------------------------------- |
| `onMount(el)`   | `mount()` is called                                            |
| `draw()`        | Every animation frame, or after `setAngle()` / `setSegments()` |
| `onResize()`    | `resize()` is called                                           |
| `onDestroy()`   | `destroy()` is called                                          |

| Optional override     | Description                                                                             |
| --------------------- | --------------------------------------------------------------------------------------- |
| `onSegmentsChanged()` | Called after `setSegments()`. No-op by default. Used by `SvgRenderer` to rebuild paths. |

| Protected field | Type                      | Default | Description                         |
| --------------- | ------------------------- | ------- | ----------------------------------- |
| `container`     | `HTMLElement \| null`     | `null`  | Mounted container element           |
| `segments`      | `readonly WheelSegment[]` | `[]`    | Current segments                    |
| `currentAngle`  | `number`                  | `0`     | Current rotation in degrees         |
| `width`         | `number`                  | `300`   | Render width                        |
| `height`        | `number`                  | `300`   | Render height                       |
| `destroyed`     | `boolean`                 | `false` | Whether `destroy()` has been called |

---

### Utility Exports

#### `SEGMENT_COLORS: readonly string[]`

Default color palette (10 colors) cycled across segments:

```ts
['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
 '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9']
```

#### `colorForIndex(index: number): string`

Get the color for a segment by index (wraps around the palette).

```ts
import { colorForIndex } from '@spin-wheel/renderer';

colorForIndex(0);  // '#FF6B6B'
colorForIndex(12); // '#45B7D1' (wraps at 10)
```

#### `EasingFn`

```ts
type EasingFn = (t: number) => number;
```

Any function mapping `[0, 1]` → `[0, 1]`. Used by `rotateTo()`. The `easeOutCubic` function from `@spin-wheel/core` is the recommended default.

---

## Visual Layout

Both renderers draw wheels with the same layout:

- **Radius:** 85% of `min(width, height) / 2`
- **Pointer:** Red triangle at **top center** (12 o'clock)
- **Hub:** White circle at center (10% of radius)
- **First segment:** Centered at the top
- **Colors:** Cycled from `SEGMENT_COLORS`
- **Labels:** Rendered along the midpoint of each segment arc, 65% from center

## License

MIT
