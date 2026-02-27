# @spin-wheel/embed

> Single-file, CDN-friendly embeddable build for the Spin Wheel SDK.

Drop one `<script>` tag onto any page — no bundler required.

---

## Quick Start (CDN / `<script>` tag)

```html
<div id="wheel" style="width:320px;height:320px"></div>

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
    wheel.spin().then((r) => console.log('Winner:', r.segment.label));
  });
</script>
```

The global bundle exposes a single `window.SpinWheel` namespace.

---

## Auto-Init (Data Attributes)

Mount wheels declaratively — no JavaScript required:

```html
<div
  data-spin-wheel
  data-renderer="canvas"
  data-duration="4000"
  data-min-spins="5"
  data-max-spins="8"
  data-seed="my-campaign"
  data-spin-button="true"
  data-spin-button-text="Spin to Win!"
  data-segments='[
    {"id":"10","label":"10 %","weight":3},
    {"id":"50","label":"50 %","weight":1},
    {"id":"free","label":"Free spin","weight":5}
  ]'
></div>

<script src="https://cdn.example.com/spin-wheel.global.js"></script>
<script>
  SpinWheel.autoInit();
</script>
```

### Supported `data-*` attributes

| Attribute              | Type   | Default    | Description                          |
| ---------------------- | ------ | ---------- | ------------------------------------ |
| `data-spin-wheel`      | flag   | —          | Marks the element for auto-init      |
| `data-segments`        | JSON   | `[]`       | Array of `WheelSegment` objects      |
| `data-renderer`        | string | `"canvas"` | `"canvas"` or `"svg"`                |
| `data-duration`        | number | `4000`     | Animation duration (ms)              |
| `data-min-spins`       | number | `4`        | Minimum full rotations               |
| `data-max-spins`       | number | `8`        | Maximum full rotations               |
| `data-seed`            | string | —          | Seed for deterministic results       |
| `data-spin-button`     | string | —          | `"true"` to inject a spin button     |
| `data-spin-button-text`| string | `"Spin"`   | Button label text                    |

---

## DOM Events

Auto-init widgets dispatch Custom Events on the host element (they bubble):

| Event               | `detail`                        |
| ------------------- | ------------------------------- |
| `spinwheel:ready`   | `{ widget: SpinWheelWidget }`   |
| `spinwheel:state`   | `{ state: WheelState }`         |
| `spinwheel:finish`  | `SpinResult`                    |

```js
document.addEventListener('spinwheel:finish', (e) => {
  console.log('Winner:', e.detail.segment.label);
});
```

---

## API Reference

### `SpinWheel.create(elOrSelector, config)`

Create a widget manually. Returns a `SpinWheelWidget` instance.

```ts
SpinWheel.create('#wheel', {
  segments: [...],
  renderer: 'canvas',    // or 'svg'
  durationMs: 4000,
  minSpins: 4,
  maxSpins: 8,
  seed: 'my-seed',
  injectCss: true,        // default: true
});
```

### `SpinWheel.autoInit(options?)`

Scan the DOM for `[data-spin-wheel]` and mount widgets. Returns `SpinWheelWidget[]`.

```ts
SpinWheel.autoInit();
SpinWheel.autoInit({ selector: '.my-wheels', injectCss: true });
```

### `SpinWheel.injectCss()`

Manually inject the namespaced CSS (idempotent).

### `SpinWheel.load(options)`

Async script loader for lazy-loading the global bundle:

```js
SpinWheel.load({
  src: 'https://cdn.example.com/spin-wheel.global.js',
  autoInit: true,
}).then((sw) => console.log('Loaded version', sw.version));
```

### `SpinWheel.version`

Semantic version string (e.g. `"1.0.0"`).

---

## ESM / CJS Usage (Bundlers)

```ts
import { SpinWheelWidget, autoInit, injectCss, version } from '@spin-wheel/embed';
```

Tree-shakeable — only what you import gets bundled.

---

## React / Vue Wrapper Guidance

Use `@spin-wheel/widget` directly (it's a dependency of embed):

```tsx
import { SpinWheelWidget } from '@spin-wheel/widget';
import { useEffect, useRef } from 'react';

function SpinWheel({ segments }) {
  const ref = useRef(null);
  const widgetRef = useRef(null);

  useEffect(() => {
    widgetRef.current = SpinWheelWidget.create(ref.current, { segments });
    return () => widgetRef.current?.destroy();
  }, []);

  return <div ref={ref} style={{ width: 300, height: 300 }} />;
}
```

---

## Security Note

`data-segments` is parsed with `JSON.parse()`. **Only use trusted input.** Do not inject user-generated content into `data-segments` attributes without sanitisation — this could enable XSS if the parsed data is reflected into the DOM.

---

## Build Outputs

| File                        | Format | Use Case                      |
| --------------------------- | ------ | ----------------------------- |
| `dist/index.js`             | ESM    | Bundler / `import`            |
| `dist/index.cjs`            | CJS    | Node.js / `require()`         |
| `dist/index.d.ts`           | Types  | TypeScript                    |
| `dist/spin-wheel.global.js` | IIFE   | `<script>` tag / CDN          |
