/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				gold: {
					DEFAULT: '#c8a951',
					light: '#dfc06b',
					dark: '#a68a3e',
					muted: '#8a7441'
				},
				parchment: '#e8e0d4',
				dark: {
					900: '#0a0a0a',
					800: '#111111',
					700: '#1a1614',
					600: '#242019',
					500: '#2e2921',
					400: '#3d3529'
				}
			},
			fontFamily: {
				cinzel: ['Cinzel', 'serif'],
				body: ['Inter', 'system-ui', 'sans-serif']
			}
		}
	},
	plugins: []
};
