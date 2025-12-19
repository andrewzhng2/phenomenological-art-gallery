import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	plugins: [sveltekit()],
	// Monorepo: load env vars from the repo root (so /phenomenological-art-gallery/.env works)
	envDir: resolve(__dirname, '../..')
});
