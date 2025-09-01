import { writable } from 'svelte/store';
import type { Guardian } from '../types/Guardian.js';

// Store for the current guardian (user)
export const guardian = writable<Guardian | null>(null);

// Loading state
export const isLoadingGuardian = writable(false);

// Authentication state
export const isAuthenticated = writable(false);

// Actions
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
	}
};