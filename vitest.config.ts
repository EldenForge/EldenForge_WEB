import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		conditions: ['browser']
	},
	test: {
		environment: 'jsdom',
		include: ['tests/unit/**/*.test.ts'],
		globals: true,
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html'],
			include: ['src/lib/**/*.ts', 'src/lib/components/**/*.svelte'],
			exclude: ['src/lib/art/**', 'src/lib/api/**']
		}
	}
});
