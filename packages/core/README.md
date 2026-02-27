# @spin-wheel/core

Pure-logic spinning wheel engine — deterministic RNG, weighted segment selection, and angle calculation. **Zero DOM dependencies.** Works in browsers, Node.js, and any JavaScript runtime.

## Install

```bash
npm install @spin-wheel/core
```

## Quick Start

```ts
import { WheelEngine } from '@spin-wheel/core';

const engine = new WheelEngine({
  segments: [
    { id: '1', label: 'Prize A', weight: 3 },
    { id: '2', label: 'Prize B', weight: 1 },
    { id: '3', label: 'Prize C', weight: 2 },
  ],
  seed: 'my-seed',  // optional — makes results deterministic
});

const result = engine.spin();

console.log(result.index);          // 0-based winning index
console.log(result.segment.label);  // e.g. "Prize A"
console.log(result.finalAngle);     // rotation angle in degrees
```

## When to Use This Package

- **Headless / server-side** — determine winners without a browser
- **Custom rendering** — use your own renderer (Three.js, Pixi, etc.) with the engine
- **Unit testing** — seed-based determinism makes outcomes predictable
- **Building higher-level abstractions** — this is the foundation the other `@spin-wheel/*` packages build on

If you want a ready-made visual wheel, use [`@spin-wheel/widget`](../widget/README.md) instead.

---

## API Reference

### `WheelEngine`

The main class. Manages spin state, weighted selection, and angle computation.

#### Constructor

```ts
new WheelEngine(config: WheelEngineConfig)
```

| Config field | Type             | Default      | Description                                           |
| ------------ | ---------------- | ------------ | ----------------------------------------------------- |
| `segments`   | `WheelSegment[]` | **required** | At least one segment                                  |
| `minSpins`   | `number`         | `4`          | Minimum full rotations                                |
| `maxSpins`   | `number`         | `8`          | Maximum full rotations                                |
| `seed`       | `string`         | `undefined`  | Seed for deterministic RNG. Omit for `Math.random()`. |

**Throws** if:

- `segments` is empty
- `minSpins < 1`
- `maxSpins < minSpins`

#### `engine.spin(): SpinResult`

Determine the winning segment and compute the final angle. The result is known **synchronously** — no animation at this layer.

```ts
const result = engine.spin();
```

Returns a **frozen** `SpinResult`:

```ts
interface SpinResult {
  readonly index: number;         // 0-based winning segment index
  readonly segment: WheelSegment; // frozen copy of the winning segment
  readonly finalAngle: number;    // total rotation in degrees (≥ minSpins × 360)
}
```

**Throws** if the engine is currently in the `'spinning'` state (call `reset()` first).

**State transitions:** `idle` → `spinning` → `finished`

#### `engine.getState(): WheelState`

```ts
type WheelState = 'idle' | 'spinning' | 'finished';
```

Returns the current lifecycle state.

#### `engine.getLastResult(): SpinResult | null`

Retrieve the most recent spin result, or `null` if no spin has occurred.

#### `engine.getSegments(): readonly WheelSegment[]`

Returns a frozen copy of the current segments array.

#### `engine.setSegments(segments: WheelSegment[]): void`

Replace the segments. Resets the engine state to `idle` and clears the last result.

**Throws** if the array is empty.

#### `engine.reset(): void`

Reset the engine to `idle` state — clears `lastResult` so you can spin again.

---

### Types

#### `WheelSegment`

```ts
interface WheelSegment {
  readonly id: string;        // unique identifier
  readonly label: string;     // display text
  readonly weight?: number;   // relative probability (default: 1)
  readonly data?: unknown;    // arbitrary payload
}
```

The `weight` field controls how likely a segment is to be selected. Higher weight = higher probability. Weights are relative — `{ weight: 3 }` vs `{ weight: 1 }` means 75% vs 25%.

#### `WheelEngineConfig`

```ts
interface WheelEngineConfig {
  readonly segments: readonly WheelSegment[];
  readonly minSpins?: number;   // default: 4
  readonly maxSpins?: number;   // default: 8
  readonly seed?: string;       // deterministic RNG seed
}
```

#### `SpinResult`

```ts
interface SpinResult {
  readonly index: number;
  readonly segment: Readonly<WheelSegment>;
  readonly finalAngle: number;
}
```

#### `WheelState`

```ts
type WheelState = 'idle' | 'spinning' | 'finished';
```

---

### Utility Functions

These are also exported for advanced use cases.

#### `createSeededRng(seed: string): () => number`

Create a deterministic PRNG (mulberry32 algorithm). Returns a function that produces values in `[0, 1)`. Same seed always produces the same sequence.

```ts
import { createSeededRng } from '@spin-wheel/core';

const rng = createSeededRng('my-seed');
console.log(rng()); // always 0.4413108...
console.log(rng()); // always 0.6529685...
```

#### `pickWeightedIndex(segments: WheelSegment[], rng: () => number): number`

Select a segment index using weighted random selection. Uses each segment's `weight` field (defaults to `1`).

```ts
import { pickWeightedIndex, createSeededRng } from '@spin-wheel/core';

const segments = [
  { id: '1', label: 'Common', weight: 5 },
  { id: '2', label: 'Rare',   weight: 1 },
];
const rng = createSeededRng('test');
const idx = pickWeightedIndex(segments, rng); // 0 or 1
```

**Throws** on empty segments, negative weights, or zero total weight.

#### `calculateFinalAngle(index, count, extraSpins, rng): number`

Compute the final rotation angle in degrees for a given winning segment.

```ts
import { calculateFinalAngle, createSeededRng } from '@spin-wheel/core';

const angle = calculateFinalAngle(
  2,                       // winning index
  5,                       // total segments
  6,                       // extra full rotations
  createSeededRng('seed'), // RNG
);
// Returns a positive angle ≥ 6 × 360
```

The pointer is at the **top (0°)**. A 10% edge padding ensures the landing never sits right at a segment boundary.

#### `easeOutCubic(t: number): number`

Cubic ease-out function: `1 - (1 - t)³`. Input and output in `[0, 1]`.

---

## Deterministic Mode

Pass a `seed` to make spins fully reproducible:

```ts
const engine1 = new WheelEngine({ segments, seed: 'abc' });
const engine2 = new WheelEngine({ segments, seed: 'abc' });

const r1 = engine1.spin();
const r2 = engine2.spin();

console.log(r1.index === r2.index);           // true
console.log(r1.finalAngle === r2.finalAngle); // true
```

This is useful for:

- **Server-side validation** — verify a client-claimed result
- **Replays** — reproduce exact spin sequences
- **Testing** — predictable outcomes in unit tests

## License

MIT
