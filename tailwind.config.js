/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				// Will be populated with theme system
			},
			fontFamily: {
				mono: ['JetBrains Mono', 'monospace'],
				sans: ['Inter', 'sans-serif'],
			},
		},
	},
	plugins: [],
};
