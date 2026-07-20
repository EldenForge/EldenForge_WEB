import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		environment: 'jsdom',
		include: ['tests/unit/**/*.test.ts'],
		globals: true,
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html'],
			include: ['src/lib/**/*.ts'],
			exclude: ['src/lib/art/**', 'src/lib/api/**']
		}
	}
});
