# @spin-wheel/widget

High-level spinning wheel widget for the web. Combines the [`@spin-wheel/core`](../core/README.md) engine with a [`@spin-wheel/renderer`](../renderer/README.md) (Canvas or SVG) into a single drop-in component. Mount it, spin it, collect the result.

## Install

```bash
npm install @spin-wheel/widget
```

Peer dependencies `@spin-wheel/core` and `@spin-wheel/renderer` are installed automatically (npm 7+).

## Quick Start

```ts
import { SpinWheelWidget } from '@spin-wheel/widget';

const widget = SpinWheelWidget.create('#wheel', {
  segments: [
    { id: '1', label: '🍕 Pizza', weight: 2 },
    { id: '2', label: '🍔 Burger', weight: 1 },
    { id: '3', label: '🌮 Tacos', weight: 3 },
  ],
});

const result = await widget.spin();
console.log(result.segment.label); // e.g. "🌮 Tacos"
```

## When to Use This Package

- **Bundler-based apps** (Vite, webpack, Rollup, etc.)
- **React / Vue / Svelte** integration (see examples below)
- You want a **complete widget** with animation out of the box

For CDN / `<script>` tag usage without a bundler, use [`@spin-wheel/embed`](../embed/README.md).
For headless / server-side logic only, use [`@spin-wheel/core`](../core/README.md).

---

## API Reference

### `SpinWheelWidget.create(target, config): SpinWheelWidget`

Static factory method (the constructor is private).

```ts
const widget = SpinWheelWidget.create('#wheel', {
  segments: [...],
  renderer: 'canvas',
  durationMs: 4000,
});
```

| Parameter | Type                    | Description                       |
| --------- | ----------------------- | --------------------------------- |
| `target`  | `HTMLElement \| string` | Container element or CSS selector |
| `config`  | `SpinWheelWidgetConfig` | Configuration object              |

**Throws** if the element is not found.

---

### Configuration

```ts
interface SpinWheelWidgetConfig {
  readonly segments: readonly WheelSegment[];
  readonly renderer?: 'canvas' | 'svg';
  readonly durationMs?: number;
  readonly minSpins?: number;
  readonly maxSpins?: number;
  readonly seed?: string;
  readonly onFinish?: (result: SpinResult) => void;
  readonly onStateChange?: (state: WheelState) => void;
}
```

| Option          | Type                | Default      | Description                                            |
| --------------- | ------------------- | ------------ | ------------------------------------------------------ |
| `segments`      | `WheelSegment[]`    | **required** | At least one segment                                   |
| `renderer`      | `'canvas' \| 'svg'` | `'canvas'`   | Rendering backend                                      |
| `durationMs`    | `number`            | `4000`       | Animation duration in milliseconds                     |
| `minSpins`      | `number`            | `4`          | Minimum full rotations before landing                  |
| `maxSpins`      | `number`            | `8`          | Maximum full rotations before landing                  |
| `seed`          | `string`            | `undefined`  | Seed for deterministic RNG (same seed → same sequence) |
| `onFinish`      | `(result) => void`  | —            | Callback when spin animation completes                 |
| `onStateChange` | `(state) => void`   | —            | Callback on state transitions                          |

### Segment

```ts
interface WheelSegment {
  readonly id: string;        // unique identifier
  readonly label: string;     // display text on the wheel
  readonly weight?: number;   // relative probability (default: 1)
  readonly data?: unknown;    // arbitrary payload, available on result.segment.data
}
```

---

### Methods

#### `widget.spin(): Promise<SpinResult>`

Trigger a spin. The winning segment is determined **before** the animation starts (via the core engine). The returned promise resolves **after** the animation completes.

```ts
const result = await widget.spin();
console.log(result.index);          // 0-based winning index
console.log(result.segment.label);  // winning label
console.log(result.segment.data);   // your custom payload
console.log(result.finalAngle);     // final rotation in degrees
```

**Throws** if:

- The widget is destroyed
- A spin is already in progress

**Lifecycle:**

1. State → `spinning` (fires `onStateChange`)
2. Engine computes result (synchronous)
3. Renderer animates to final angle (async, cubic ease-out)
4. `onFinish(result)` callback fires
5. State → `finished` → `idle` (fires `onStateChange` twice)
6. Promise resolves with `SpinResult`

#### `widget.setSegments(segments: WheelSegment[]): void`

Replace segments at runtime. Resets the wheel angle to 0.

```ts
widget.setSegments([
  { id: 'new1', label: 'New A' },
  { id: 'new2', label: 'New B' },
]);
```

#### `widget.reset(): void`

Reset to initial state — engine back to `idle`, wheel angle to 0.

#### `widget.destroy(): void`

Tear down the widget. Removes DOM elements, cancels any running animation. Idempotent — safe to call multiple times.

### Getters

| Getter               | Type      | Description                                  |
| -------------------- | --------- | -------------------------------------------- |
| `widget.isSpinning`  | `boolean` | `true` while a spin animation is in progress |
| `widget.isDestroyed` | `boolean` | `true` after `destroy()` has been called     |

---

## Collecting Results

Four ways to get the spin result:

### 1. Await the promise (recommended)

```ts
const result = await widget.spin();
```

### 2. `onFinish` callback

```ts
SpinWheelWidget.create('#wheel', {
  segments,
  onFinish(result) {
    console.log('Winner:', result.segment.label);
  },
});
```

### 3. `onStateChange` callback

```ts
SpinWheelWidget.create('#wheel', {
  segments,
  onStateChange(state) {
    if (state === 'finished') {
      // spin just completed
    }
  },
});
```

### 4. Engine-level (via core)

Use `@spin-wheel/core` directly if you need synchronous, headless access.

### `SpinResult`

```ts
interface SpinResult {
  readonly index: number;         // 0-based winning segment index
  readonly segment: WheelSegment; // frozen copy of the winning segment
  readonly finalAngle: number;    // total rotation in degrees
}
```

---

## Framework Integration

### React

```tsx
import { SpinWheelWidget, type SpinResult } from '@spin-wheel/widget';
import { useEffect, useRef } from 'react';

interface Props {
  segments: { id: string; label: string; weight?: number }[];
  onResult?: (result: SpinResult) => void;
}

export function SpinWheel({ segments, onResult }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<SpinWheelWidget | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const w = SpinWheelWidget.create(containerRef.current, {
      segments,
      onFinish: onResult,
    });
    widgetRef.current = w;
    return () => w.destroy();
  }, [segments]);

  return (
    <div>
      <div ref={containerRef} style={{ width: 300, height: 300 }} />
      <button onClick={() => widgetRef.current?.spin()}>Spin!</button>
    </div>
  );
}
```

### Vue

```vue
<script setup lang="ts">
import { SpinWheelWidget, type SpinResult } from '@spin-wheel/widget';
import { onMounted, onUnmounted, ref } from 'vue';

const props = defineProps<{
  segments: { id: string; label: string; weight?: number }[];
}>();
const emit = defineEmits<{ result: [result: SpinResult] }>();

const container = ref<HTMLElement>();
let widget: SpinWheelWidget | null = null;

onMounted(() => {
  if (!container.value) return;
  widget = SpinWheelWidget.create(container.value, {
    segments: props.segments,
    onFinish: (r) => emit('result', r),
  });
});
onUnmounted(() => widget?.destroy());
</script>

<template>
  <div>
    <div ref="container" style="width: 300px; height: 300px" />
    <button @click="widget?.spin()">Spin!</button>
  </div>
</template>
```

### Svelte

```svelte
<script lang="ts">
  import { SpinWheelWidget } from '@spin-wheel/widget';
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';

  export let segments: { id: string; label: string; weight?: number }[];

  const dispatch = createEventDispatcher();
  let container: HTMLElement;
  let widget: SpinWheelWidget | null = null;

  onMount(() => {
    widget = SpinWheelWidget.create(container, {
      segments,
      onFinish: (result) => dispatch('result', result),
    });
  });
  onDestroy(() => widget?.destroy());
</script>

<div>
  <div bind:this={container} style="width: 300px; height: 300px" />
  <button on:click={() => widget?.spin()}>Spin!</button>
</div>
```

---

## Styling

The widget auto-injects minimal CSS on creation:

```css
.sw-container { position: relative; display: inline-block; }
.sw-container canvas,
.sw-container svg { display: block; }
```

The container element receives the `sw-container` CSS class. You can override styles normally:

```css
.sw-container {
  border-radius: 50%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}
```

## License

MIT
