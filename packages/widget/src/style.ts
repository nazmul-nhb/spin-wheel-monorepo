const STYLE_ID = 'sw-injected-styles';

/** Minimal CSS for the widget container. Injected once per page. */
const CSS = `
.sw-container {
  position: relative;
  display: inline-block;
}
.sw-container canvas,
.sw-container svg {
  display: block;
}
`;

/** Inject the widget stylesheet into the document head (idempotent). */
export function injectStyles(): void {
	if (document.getElementById(STYLE_ID)) return;
	const style = document.createElement('style');
	style.id = STYLE_ID;
	style.textContent = CSS;
	document.head.appendChild(style);
}
