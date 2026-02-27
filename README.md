# Spin Wheel SDK

A modular, production-grade spinning wheel SDK for the web. Built as a layered monorepo — use only what you need: from the pure-logic engine through ready-made renderers to a zero-config CDN embed.

## Architecture

```ini
@spin-wheel/core          Pure logic — engine, RNG, weighting, angles (zero DOM)
       ↓
@spin-wheel/renderer      Canvas & SVG renderers (DOM layer)
       ↓
@spin-wheel/widget        High-level widget (engine + renderer)
       ↓
@spin-wheel/embed         CDN-ready global build + auto-init + data attributes
```

Every package ships **ESM + CJS + TypeScript declarations**.
The embed package additionally produces a single IIFE bundle for `<script>` tag usage.

## Packages

| Package                                               | Description                                                      | Install                      |
| ----------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------- |
| [`@spin-wheel/core`](packages/core/README.md)         | Deterministic engine, seeded RNG, weighted selection, angle math | `npm i @spin-wheel/core`     |
| [`@spin-wheel/renderer`](packages/renderer/README.md) | Canvas & SVG renderers with animation                            | `npm i @spin-wheel/renderer` |
| [`@spin-wheel/widget`](packages/widget/README.md)     | Drop-in widget combining engine + renderer                       | `npm i @spin-wheel/widget`   |
| [`@spin-wheel/embed`](packages/embed/README.md)       | Single `<script>` tag CDN build + auto-init                      | `npm i @spin-wheel/embed`    |

---

## Quick Start — CDN (`<script>` tag)

```html
<div id="wheel" style="width: 320px; height: 320px"></div>

<script src="https://cdn.example.com/spin-wheel.global.js"></script>
<script>
  const wheel = SpinWheel.create('#wheel', {
    segments: [
      { id: '1', label: '🍕 Pizza' },
      { id: '2', label: '🍔 Burger' },
      { id: '3', label: '🌮 Tacos' },
    ],
  });

  wheel.spin().then((result) => {
    console.log('Winner:', result.segment.label);
  });
</script>
```

Or **auto-init** with zero JavaScript beyond one call:

```html
<div
  data-spin-wheel
  data-spin-button="true"
  data-segments='[{"id":"a","label":"A"},{"id":"b","label":"B"},{"id":"c","label":"C"}]'
></div>

<script src="https://cdn.example.com/spin-wheel.global.js"></script>
<script>SpinWheel.autoInit();</script>
```

## Quick Start — Bundler (npm / pnpm)

```bash
npm install @spin-wheel/widget
```

```ts
import { SpinWheelWidget } from '@spin-wheel/widget';

const widget = SpinWheelWidget.create('#my-wheel', {
  segments: [
    { id: '1', label: 'Prize A', weight: 2 },
    { id: '2', label: 'Prize B', weight: 1 },
    { id: '3', label: 'Prize C', weight: 3 },
  ],
  renderer: 'canvas',   // or 'svg'
  durationMs: 4000,
  seed: 'campaign-2026',
});

const result = await widget.spin();
console.log(result.index);          // 0-based winning index
console.log(result.segment.label);  // "Prize C"
console.log(result.finalAngle);     // final rotation in degrees
```

---

## Collecting Results

The SDK provides **multiple ways** to capture spin outcomes, depending on which layer you use:

### 1. `await widget.spin()` — recommended

```ts
const result = await widget.spin();
// result: { index, segment, finalAngle }
```

The promise resolves **after** the animation completes with a frozen `SpinResult`.

### 2. `onFinish` callback

```ts
SpinWheelWidget.create('#wheel', {
  segments,
  onFinish(result) {
    console.log('Winner:', result.segment.label);
  },
});
```

### 3. DOM events (embed auto-init)

```js
document.addEventListener('spinwheel:finish', (e) => {
  const { index, segment, finalAngle } = e.detail;
  console.log('Winner:', segment.label);
});
```

### 4. Engine-level (headless / server-side)

```ts
import { WheelEngine } from '@spin-wheel/core';

const engine = new WheelEngine({ segments, seed: 'deterministic' });
const result = engine.spin();         // synchronous, no animation
const same   = engine.getLastResult(); // retrieve again later
```

### `SpinResult` shape

```ts
interface SpinResult {
  readonly index: number;         // 0-based index of winning segment
  readonly segment: WheelSegment; // frozen copy of the winning segment
  readonly finalAngle: number;    // final rotation angle in degrees
}
```

---

## React Integration

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

  const handleSpin = async () => {
    const result = await widgetRef.current?.spin();
    if (result) onResult?.(result);
  };

  return (
    <div>
      <div ref={containerRef} style={{ width: 300, height: 300 }} />
      <button onClick={handleSpin}>Spin!</button>
    </div>
  );
}
```

## Vue Integration

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

async function spin() {
  const result = await widget?.spin();
  if (result) emit('result', result);
}
</script>

<template>
  <div>
    <div ref="container" style="width: 300px; height: 300px" />
    <button @click="spin">Spin!</button>
  </div>
</template>
```

---

## Configuration Reference

### Segment

```ts
interface WheelSegment {
  readonly id: string;       // unique identifier
  readonly label: string;    // display text rendered on the wheel
  readonly weight?: number;  // relative probability weight (default: 1)
  readonly data?: unknown;   // arbitrary payload — available via result.segment.data
}
```

### Widget / Embed Config

| Option          | Type                           | Default      | Description                                                               |
| --------------- | ------------------------------ | ------------ | ------------------------------------------------------------------------- |
| `segments`      | `WheelSegment[]`               | **required** | Array of wheel segments (minimum 1)                                       |
| `renderer`      | `'canvas' \| 'svg'`            | `'canvas'`   | Rendering backend                                                         |
| `durationMs`    | `number`                       | `4000`       | Spin animation duration in milliseconds                                   |
| `minSpins`      | `number`                       | `4`          | Minimum full rotations before landing                                     |
| `maxSpins`      | `number`                       | `8`          | Maximum full rotations before landing                                     |
| `seed`          | `string`                       | `undefined`  | Seed for deterministic RNG (same seed → same sequence)                    |
| `onFinish`      | `(result: SpinResult) => void` | —            | Callback fired when spin animation completes                              |
| `onStateChange` | `(state: WheelState) => void`  | —            | Callback on state transitions (`idle` → `spinning` → `finished` → `idle`) |

### Embed-only Config

| Option      | Type      | Default | Description                          |
| ----------- | --------- | ------- | ------------------------------------ |
| `injectCss` | `boolean` | `true`  | Auto-inject widget CSS on `create()` |

---

## Development

```bash
pnpm install            # install all workspace dependencies
pnpm build              # build all packages + demo
pnpm test               # run unit tests (vitest)
pnpm lint               # biome check
pnpm lint:fix           # auto-fix lint issues
pnpm format             # format with biome
pnpm dev                # start demo dev server (port 3000)
pnpm dev:embed          # start embed demo dev server (port 3001)
pnpm build:embed        # build embed package only
pnpm update-deps        # update all dependencies to latest
```

## Project Structure

```ini
spinning-wheel/
├── packages/
│   ├── core/             @spin-wheel/core
│   │   ├── src/
│   │   │   ├── index.ts          re-exports
│   │   │   ├── types.ts          WheelSegment, SpinResult, WheelState, WheelEngineConfig
│   │   │   ├── engine.ts         WheelEngine class
│   │   │   ├── rng.ts            seeded PRNG (mulberry32)
│   │   │   ├── weighted.ts       weighted random selection
│   │   │   ├── angle.ts          final angle calculation
│   │   │   └── easing.ts         easeOutCubic
│   │   └── tests/
│   │       └── core.test.ts      24 unit tests
│   ├── renderer/         @spin-wheel/renderer
│   │   └── src/
│   │       ├── index.ts          re-exports
│   │       ├── types.ts          WheelRenderer interface, EasingFn
│   │       ├── base.ts           BaseRenderer abstract class + colors
│   │       ├── canvas/           CanvasRenderer + draw helpers
│   │       └── svg/              SvgRenderer (rotation-only per frame)
│   ├── widget/           @spin-wheel/widget
│   │   └── src/
│   │       ├── index.ts          re-exports
│   │       ├── types.ts          SpinWheelWidgetConfig
│   │       ├── SpinWheelWidget.ts  main widget class
│   │       └── style.ts          auto-injected CSS
│   └── embed/            @spin-wheel/embed
│       ├── src/
│       │   ├── index.ts          ESM/CJS entry
│       │   ├── index.global.ts   IIFE entry (window.SpinWheel)
│       │   ├── types.ts          embed-specific types
│       │   ├── loader.ts         async script loader
│       │   ├── autoInit.ts       data-attribute auto-init
│       │   └── css.ts            embed CSS injection
│       ├── demo/                 embed demo page
│       └── build-global.mjs      esbuild IIFE build script
└── demo/                 Vite playground app
    └── src/main.ts
```

## License

MIT
