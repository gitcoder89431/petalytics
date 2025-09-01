// Local storage utility functions for persisting data

import { browser } from '$app/environment';

export class StorageError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'StorageError';
	}
}

// Generic storage functions
export const storage = {
	// Get item from localStorage
	get<T>(key: string, defaultValue?: T): T | null {
		if (!browser) return defaultValue || null;
		
		try {
			const item = localStorage.getItem(key);
			return item ? JSON.parse(item) : defaultValue || null;
		} catch (error) {
			console.error(`Error reading from localStorage key "${key}":`, error);
			return defaultValue || null;
		}
	},

	// Set item in localStorage
	set<T>(key: string, value: T): boolean {
		if (!browser) return false;
		
		try {
			localStorage.setItem(key, JSON.stringify(value));
			return true;
		} catch (error) {
			console.error(`Error writing to localStorage key "${key}":`, error);
			return false;
		}
	},

	// Remove item from localStorage
	remove(key: string): boolean {
		if (!browser) return false;
		
		try {
			localStorage.removeItem(key);
			return true;
		} catch (error) {
			console.error(`Error removing localStorage key "${key}":`, error);
			return false;
		}
	},

	// Clear all localStorage
	clear(): boolean {
		if (!browser) return false;
		
		try {
			localStorage.clear();
			return true;
		} catch (error) {
			console.error('Error clearing localStorage:', error);
			return false;
		}
	},

	// Check if key exists
	has(key: string): boolean {
		if (!browser) return false;
		return localStorage.getItem(key) !== null;
	},

	// Get all keys
	keys(): string[] {
		if (!browser) return [];
		return Object.keys(localStorage);
	}
};

// Specific storage helpers for the app
export const appStorage = {
	// Pet data
	savePets(pets: any[]) {
		return storage.set('petalytics_pets', pets);
	},
	
	loadPets() {
		return storage.get('petalytics_pets', []);
	},
	
	// Guardian data
	saveGuardian(guardian: any) {
		return storage.set('petalytics_guardian', guardian);
	},
	
	loadGuardian() {
		return storage.get('petalytics_guardian', null);
	},
	
	// Theme preference
	saveTheme(theme: string) {
		return storage.set('petalytics_theme', theme);
	},
	
	loadTheme() {
		return storage.get('petalytics_theme', 'auto');
	},
	
	// Journal entries
	saveJournalEntries(entries: any[]) {
		return storage.set('petalytics_journal_entries', entries);
	},
	
	loadJournalEntries() {
		return storage.get('petalytics_journal_entries', []);
	}
};