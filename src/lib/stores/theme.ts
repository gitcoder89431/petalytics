import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'light' | 'dark' | 'auto';

// Get initial theme from localStorage or default to auto
const getInitialTheme = (): Theme => {
	if (!browser) return 'auto';
	const stored = localStorage.getItem('theme') as Theme;
	return stored && ['light', 'dark', 'auto'].includes(stored) ? stored : 'auto';
};

// Create the theme store
export const theme = writable<Theme>(getInitialTheme());

// Subscribe to theme changes and update localStorage
theme.subscribe((value) => {
	if (browser) {
		localStorage.setItem('theme', value);
		updateThemeClass(value);
	}
});

// Function to update the HTML class based on theme
function updateThemeClass(theme: Theme) {
	if (!browser) return;
	
	const root = document.documentElement;
	
	if (theme === 'auto') {
		// Use system preference
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		root.classList.toggle('dark', prefersDark);
	} else {
		root.classList.toggle('dark', theme === 'dark');
	}
}

// Actions
export const themeActions = {
	setTheme(newTheme: Theme) {
		theme.set(newTheme);
	},
	
	toggleTheme() {
		theme.update(current => {
			switch (current) {
				case 'light':
					return 'dark';
				case 'dark':
					return 'light';
				default:
					return 'light';
			}
		});
	}
};

// Listen for system theme changes when in auto mode
if (browser) {
	const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
	mediaQuery.addEventListener('change', () => {
		theme.update(current => {
			if (current === 'auto') {
				updateThemeClass('auto');
			}
			return current;
		});
	});
}