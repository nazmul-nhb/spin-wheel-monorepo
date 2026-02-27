# Spin Wheel SDK

A modular, production-grade spinning wheel SDK for the web.

```
packages/
  core/       — Pure logic: engine, RNG, easing, angles (zero DOM)
  renderer/   — Canvas + SVG renderers (DOM layer)
  widget/     — High-level widget orchestrating engine + renderer
  embed/      — Single-file CDN build with auto-init & data attributes
demo/         — Vite playground (bundler-based)
```

---

## Quick Start — CDN (`<script>` tag, zero config)

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
  wheel.spin().then(r => alert('Winner: ' + r.segment.label));
</script>
```

Or use **auto-init** — no JS needed beyond one call:

```html
<div
  data-spin-wheel
  data-spin-button="true"
  data-segments='[{"id":"a","label":"A"},{"id":"b","label":"B"},{"id":"c","label":"C"}]'
></div>
<script src="https://cdn.example.com/spin-wheel.global.js"></script>
<script>SpinWheel.autoInit();</script>
```

See [packages/embed/README.md](packages/embed/README.md) for full docs.

---

## Quick Start — npm (Bundler)

```bash
npm install @spin-wheel/widget
# or
pnpm add @spin-wheel/widget
```

```ts
import { SpinWheelWidget } from '@spin-wheel/widget';

const widget = SpinWheelWidget.create('#my-wheel', {
  segments: [
    { id: '1', label: 'A', weight: 2 },
    { id: '2', label: 'B', weight: 1 },
  ],
  renderer: 'canvas',
});

const result = await widget.spin();
console.log(result.segment.label);
```

---

## Packages

| Package | Description |
|---|---|
| `@spin-wheel/core` | Pure engine logic — RNG, weighting, angle calc |
| `@spin-wheel/renderer` | Canvas & SVG renderers |
| `@spin-wheel/widget` | High-level widget (engine + renderer) |
| `@spin-wheel/embed` | CDN-ready global build + auto-init |

---

## Development

```bash
pnpm install
pnpm build          # build all packages + demo
pnpm test           # run core unit tests (vitest)
pnpm lint           # biome check
pnpm dev            # start Vite demo (port 3000)
pnpm build:embed    # build the embed global bundle
pnpm dev:embed      # serve the embed demo (port 3001)
```

---

## React / Vue Integration

Use `@spin-wheel/widget` directly:

```tsx
import { SpinWheelWidget } from '@spin-wheel/widget';
import { useEffect, useRef } from 'react';

function Wheel({ segments }) {
  const ref = useRef(null);
  useEffect(() => {
    const w = SpinWheelWidget.create(ref.current, { segments });
    return () => w.destroy();
  }, []);
  return <div ref={ref} style={{ width: 300, height: 300 }} />;
}
```

---

## Architecture

```
@spin-wheel/core (pure JS, no DOM)
       ↓
@spin-wheel/renderer (Canvas + SVG)
       ↓
@spin-wheel/widget (orchestration)
       ↓
@spin-wheel/embed (CDN global + auto-init)
```

All packages ship ESM + CJS + TypeScript declarations.  
The embed package additionally produces a single IIFE bundle for `<script>` tag usage.

---

## License

MIT
