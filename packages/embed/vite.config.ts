import { createReadStream, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Tiny Vite config that serves the embed demo directory.
 * The global bundle is expected in packages/embed/dist/ after `pnpm build:embed`.
 * We alias /spin-wheel.global.js to the built file so the HTML just works.
 */
export default defineConfig({
    root: resolve(__dirname, 'demo'),
    server: {
        port: 3001,
        open: true,
    },
    plugins: [
        {
            name: 'serve-global-bundle',
            configureServer(server) {
                server.middlewares.use('/spin-wheel.global.js', (_req, res) => {
                    const file = resolve(__dirname, 'dist/spin-wheel.global.js');
                    if (existsSync(file)) {
                        res.setHeader('Content-Type', 'application/javascript');
                        createReadStream(file).pipe(res);
                    } else {
                        res.statusCode = 404;
                        res.end(
                            '/* global bundle not built yet — run pnpm build:embed first */'
                        );
                    }
                });
            },
        },
    ],
});
