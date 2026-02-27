/**
 * Build the IIFE global bundle using esbuild.
 *
 * tsdown handles ESM + CJS + DTS. This script produces the single-file
 * `dist/spin-wheel.global.js` that can be loaded via <script> tag.
 *
 * All workspace dependencies are bundled into the output so there are
 * zero external runtime deps for CDN consumers.
 */
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));

await build({
	entryPoints: [resolve(__dirname, 'src/index.global.ts')],
	bundle: true,
	format: 'iife',
	globalName: '__SpinWheel_internal__',
	outfile: resolve(__dirname, 'dist/spin-wheel.global.js'),
	minify: true,
	sourcemap: true,
	target: ['es2020'],
	banner: {
		js: `/* @spin-wheel/embed v${pkg.version} | MIT */`,
	},
	define: {
		'process.env.NODE_ENV': '"production"',
	},
});

console.log('✔ Global bundle built → dist/spin-wheel.global.js');
