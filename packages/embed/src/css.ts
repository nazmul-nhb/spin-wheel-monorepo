const STYLE_ID = 'sw-embed-styles';

/**
 * Namespaced CSS for the embed layer.
 * Uses the `sw-` prefix exclusively.
 */
const CSS = `
.sw-container {
  position: relative;
  display: inline-block;
}
.sw-container canvas,
.sw-container svg {
  display: block;
}
.sw-spin-btn {
  display: block;
  margin: 0.75rem auto 0;
  padding: 0.5rem 1.6rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  background: #4f46e5;
  color: #fff;
  cursor: pointer;
  transition: background 0.15s ease;
}
.sw-spin-btn:hover:not(:disabled) {
  background: #4338ca;
}
.sw-spin-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
`;

let injected = false;

/** Inject namespaced CSS into the document head (idempotent). */
export function injectCss(): void {
	if (injected || document.getElementById(STYLE_ID)) {
		injected = true;
		return;
	}
	const style = document.createElement('style');
	style.id = STYLE_ID;
	style.textContent = CSS;
	document.head.appendChild(style);
	injected = true;
}
