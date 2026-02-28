import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
    root: '.',
    server: { port: 3002, open: '/index.html' },
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                'await-spin': resolve(__dirname, 'await-spin.html'),
                'on-finish': resolve(__dirname, 'on-finish.html'),
                'dom-events': resolve(__dirname, 'dom-events.html'),
                headless: resolve(__dirname, 'headless.html'),
            },
        },
    },
});
