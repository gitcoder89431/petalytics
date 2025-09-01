import { writable } from 'svelte/store';
import type { Guardian } from '../types/Guardian.js';

const STORAGE_KEY = 'petalytics-guardian';

// Guardian data structure
const defaultGuardian = {
	name: '',
	apiKey: '',
	model: 'openai/gpt-oss-20b:free',
	preferences: {
		dailyReminders: false,
		aiInsights: true,
		notifications: true,
	},
	apiKeyValid: false,
};

export const guardianStore = writable(defaultGuardian);

// Store for the current guardian (user) - keeping for backward compatibility
export const guardian = writable<Guardian | null>(null);

// Loading state
export const isLoadingGuardian = writable(false);

// Authentication state
export const isAuthenticated = writable(false);

// Helper functions
export const guardianHelpers = {
	// Load from localStorage
	load() {
		if (typeof localStorage !== 'undefined') {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) {
				try {
					const parsed = JSON.parse(saved);
					guardianStore.set({ ...defaultGuardian, ...parsed });
					return parsed;
				} catch (error) {
					console.error('Error loading guardian data:', error);
				}
			}
		}
		return null;
	},

	// Save to localStorage
	save(data: any) {
		if (typeof localStorage !== 'undefined') {
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
			} catch (error) {
				console.error('Error saving guardian data:', error);
			}
		}
	},

	// Update guardian data
	update(updates: any) {
		guardianStore.update((current) => {
			const updated = { ...current, ...updates };
			this.save(updated);
			return updated;
		});
	},

	// Update API key specifically
	updateApiKey(apiKey: string) {
		guardianStore.update((current) => {
			const updated = { ...current, apiKey, apiKeyValid: true };
			this.save(updated);
			return updated;
		});
	},

	// Clear all data
	clear() {
		if (typeof localStorage !== 'undefined') {
			localStorage.removeItem(STORAGE_KEY);
		}
		guardianStore.set(defaultGuardian);
	},

	// Import guardian data
	importGuardian(guardianData: any) {
		guardianStore.update((current) => {
			const updated = { ...current, ...guardianData };
			this.save(updated);
			return updated;
		});
	},
};

// Actions - keeping for backward compatibility
export const guardianActions = {
	async loadGuardian() {
		// TODO: Implement API call to load guardian data
		console.log('Loading guardian...');
	},

	async updateGuardian(updates: Partial<Guardian>) {
		// TODO: Implement API call to update guardian
		console.log('Updating guardian:', updates);
	},

	async login(email: string, password: string) {
		// TODO: Implement authentication
		console.log('Logging in:', email);
	},

	async logout() {
		// TODO: Implement logout
		console.log('Logging out...');
		guardian.set(null);
		isAuthenticated.set(false);
	},
};
