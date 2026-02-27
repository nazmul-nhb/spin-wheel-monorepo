# @spin-wheel/embed

Single-file, CDN-friendly embeddable build for the Spin Wheel SDK. Drop one `<script>` tag onto any page — no bundler, no npm, no configuration required.

## Install

### CDN / `<script>` tag (recommended for embed)

```html
<script src="https://cdn.example.com/spin-wheel.global.js"></script>
```

The global bundle exposes `window.SpinWheel`.

### npm (for bundler users)

```bash
npm install @spin-wheel/embed
```

```ts
import { SpinWheelWidget, autoInit, injectCss, load, version } from '@spin-wheel/embed';
```

---

## Quick Start — Manual Init

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

  document.getElementById('wheel').addEventListener('click', () => {
    wheel.spin().then((result) => {
      alert('Winner: ' + result.segment.label);
    });
  });
</script>
```

## Quick Start — Auto-Init (Declarative)

Mount wheels from HTML alone — no JavaScript setup needed:

```html
<div
  data-spin-wheel
  data-spin-button="true"
  data-spin-button-text="Spin to Win!"
  data-renderer="canvas"
  data-duration="4000"
  data-segments='[
    { "id": "10",   "label": "10% Off",     "weight": 3 },
    { "id": "50",   "label": "50% Off",     "weight": 1 },
    { "id": "free", "label": "Free Shipping", "weight": 5 }
  ]'
></div>

<script src="https://cdn.example.com/spin-wheel.global.js"></script>
<script>SpinWheel.autoInit();</script>
```

### `data-*` Attributes

| Attribute               | Type                  | Default    | Description                                    |
| ----------------------- | --------------------- | ---------- | ---------------------------------------------- |
| `data-spin-wheel`       | flag                  | —          | **Required.** Marks the element for auto-init. |
| `data-segments`         | JSON string           | `[]`       | Array of `WheelSegment` objects                |
| `data-renderer`         | `"canvas"` \| `"svg"` | `"canvas"` | Rendering backend                              |
| `data-duration`         | number                | `4000`     | Animation duration in milliseconds             |
| `data-min-spins`        | number                | `4`        | Minimum full rotations                         |
| `data-max-spins`        | number                | `8`        | Maximum full rotations                         |
| `data-seed`             | string                | —          | Deterministic RNG seed                         |
| `data-spin-button`      | `"true"`              | —          | Inject a styled spin button                    |
| `data-spin-button-text` | string                | `"Spin"`   | Button label text                              |

When `data-spin-button="true"` is set, a `<button class="sw-spin-btn">` is appended to the container. It calls `widget.spin()` on click and disables itself during the animation.

---

## Collecting Results

### 1. `await widget.spin()` — manual init

```js
const wheel = SpinWheel.create('#wheel', { segments: [...] });

document.getElementById('spin-btn').addEventListener('click', async () => {
  const result = await wheel.spin();
  console.log(result.index);          // 0-based winning index
  console.log(result.segment.label);  // winning label
  console.log(result.segment.data);   // custom payload
  console.log(result.finalAngle);     // final rotation in degrees
});
```

### 2. `onFinish` callback — manual init

```js
const wheel = SpinWheel.create('#wheel', {
  segments: [...],
  onFinish(result) {
    console.log('Winner:', result.segment.label);
    // Send to analytics, show a modal, etc.
  },
});
```

### 3. DOM events — auto-init

Auto-initialized widgets dispatch Custom Events on the host element. Events **bubble**, so you can listen on any ancestor or `document`.

```js
// Listen for spin results
document.addEventListener('spinwheel:finish', (e) => {
  const { index, segment, finalAngle } = e.detail;
  console.log('Winner:', segment.label);
});

// Listen for state changes
document.addEventListener('spinwheel:state', (e) => {
  console.log('State:', e.detail.state); // 'spinning', 'finished', 'idle'
});

// Get widget instance after init
document.addEventListener('spinwheel:ready', (e) => {
  const widget = e.detail.widget;
  // Now you can call widget.spin() programmatically
});
```

### 4. Combine auto-init button + DOM events

```html
<div
  id="my-wheel"
  data-spin-wheel
  data-spin-button="true"
  data-segments='[{"id":"a","label":"A"},{"id":"b","label":"B"},{"id":"c","label":"C"}]'
></div>

<div id="result-display"></div>

<script src="https://cdn.example.com/spin-wheel.global.js"></script>
<script>
  SpinWheel.autoInit();

  document.getElementById('my-wheel').addEventListener('spinwheel:finish', (e) => {
    document.getElementById('result-display').textContent =
      'You won: ' + e.detail.segment.label;
  });
</script>
```

---

## DOM Events Reference

Dispatched on the **host element** (the element with `data-spin-wheel`). All events bubble.

| Event              | `detail`                                        | When                                                          |
| ------------------ | ----------------------------------------------- | ------------------------------------------------------------- |
| `spinwheel:ready`  | `{ widget: SpinWheelWidget }`                   | Immediately after the widget is mounted                       |
| `spinwheel:state`  | `{ state: WheelState }`                         | On every state change: `'spinning'` → `'finished'` → `'idle'` |
| `spinwheel:finish` | `SpinResult` (`{ index, segment, finalAngle }`) | When a spin animation completes                               |

### `SpinResult` Shape

```ts
interface SpinResult {
  readonly index: number;         // 0-based winning segment index
  readonly segment: WheelSegment; // frozen copy: { id, label, weight?, data? }
  readonly finalAngle: number;    // total rotation in degrees
}
```

---

## API Reference

### `SpinWheel.create(target, config)`

Create and mount a widget manually. Returns a `SpinWheelWidget` instance.

```js
const widget = SpinWheel.create('#wheel', {
  segments: [...],
  renderer: 'canvas',    // or 'svg'
  durationMs: 4000,
  minSpins: 4,
  maxSpins: 8,
  seed: 'my-seed',
  injectCss: true,        // default: true
  onFinish(result) { },
  onStateChange(state) { },
});
```

| Option          | Type                | Default      | Description             |
| --------------- | ------------------- | ------------ | ----------------------- |
| `segments`      | `WheelSegment[]`    | **required** | At least one segment    |
| `renderer`      | `'canvas' \| 'svg'` | `'canvas'`   | Rendering backend       |
| `durationMs`    | `number`            | `4000`       | Animation duration (ms) |
| `minSpins`      | `number`            | `4`          | Minimum full rotations  |
| `maxSpins`      | `number`            | `8`          | Maximum full rotations  |
| `seed`          | `string`            | —            | Deterministic RNG seed  |
| `injectCss`     | `boolean`           | `true`       | Auto-inject widget CSS  |
| `onFinish`      | `function`          | —            | Spin result callback    |
| `onStateChange` | `function`          | —            | State change callback   |

#### Widget Methods

```js
await widget.spin();               // spin and get result
widget.setSegments([...]);          // replace segments
widget.reset();                     // reset to idle
widget.destroy();                   // tear down

widget.isSpinning;                  // boolean getter
widget.isDestroyed;                 // boolean getter
```

### `SpinWheel.autoInit(options?)`

Scan the DOM for `[data-spin-wheel]` elements and mount widgets. Returns an array of `SpinWheelWidget` instances.

```js
const widgets = SpinWheel.autoInit();
const widgets = SpinWheel.autoInit({ selector: '.my-wheels' });
const widgets = SpinWheel.autoInit({ injectCss: false });
```

| Option      | Type      | Default               | Description                   |
| ----------- | --------- | --------------------- | ----------------------------- |
| `selector`  | `string`  | `'[data-spin-wheel]'` | CSS selector to find elements |
| `injectCss` | `boolean` | `true`                | Auto-inject CSS               |

### `SpinWheel.injectCss()`

Manually inject the namespaced CSS. Idempotent — safe to call multiple times.

### `SpinWheel.load(options): Promise<SpinWheelGlobal>`

Async script loader for lazy-loading the global bundle:

```js
const sw = await SpinWheel.load({
  src: 'https://cdn.example.com/spin-wheel.global.js',
  autoInit: true,
});
console.log('Loaded version:', sw.version);
```

| Option     | Type      | Default      | Description                     |
| ---------- | --------- | ------------ | ------------------------------- |
| `src`      | `string`  | **required** | URL of the global bundle        |
| `autoInit` | `boolean` | `false`      | Call `autoInit()` after loading |

Idempotent — second call returns a cached promise. If the global already exists, resolves immediately.

### `SpinWheel.version`

Semantic version string (e.g. `"1.0.0"`).

---

## Segment Configuration

```ts
interface WheelSegment {
  readonly id: string;        // unique identifier
  readonly label: string;     // display text
  readonly weight?: number;   // relative probability (default: 1)
  readonly data?: unknown;    // arbitrary payload — available on result.segment.data
}
```

**Weight example:** `[{ weight: 3 }, { weight: 1 }]` → 75% vs 25% probability.

---

## ESM / CJS Usage (Bundlers)

```ts
import { SpinWheelWidget, autoInit, injectCss, version } from '@spin-wheel/embed';
```

Tree-shakeable — only what you import gets bundled.

```ts
import type {
  SpinResult,
  WheelSegment,
  WheelState,
  SpinWheelCreateConfig,
  AutoInitOptions,
  LoadOptions,
  SpinWheelGlobal,
} from '@spin-wheel/embed';
```

---

## Build Outputs

| File                        | Format      | Use Case              |
| --------------------------- | ----------- | --------------------- |
| `dist/index.mjs`            | ESM         | Bundler / `import`    |
| `dist/index.cjs`            | CJS         | Node.js / `require()` |
| `dist/index.d.mts`          | Types (ESM) | TypeScript            |
| `dist/index.d.cts`          | Types (CJS) | TypeScript            |
| `dist/spin-wheel.global.js` | IIFE        | `<script>` tag / CDN  |

---

## Security Note

`data-segments` is parsed with `JSON.parse()`. **Only use trusted input.** Do not inject user-generated content into `data-segments` attributes without sanitization — this could enable XSS if the parsed data is reflected into the DOM.

## License

MIT
