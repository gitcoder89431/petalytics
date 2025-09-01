import { writable } from 'svelte/store';
import type { Pet, PetStats } from '../types/Pet.js';

// Store for all pets
export const pets = writable<Pet[]>([]);

// Store for the currently selected pet
export const selectedPet = writable<Pet | null>(null);

// Store for pet statistics
export const petStats = writable<Map<string, PetStats>>(new Map());

// Loading states
export const isLoadingPets = writable(false);

// Actions
export const petActions = {
	async loadPets() {
		// TODO: Implement API call to load pets
		console.log('Loading pets...');
	},
	
	async addPet(pet: Omit<Pet, 'id' | 'createdAt' | 'updatedAt'>) {
		// TODO: Implement API call to add pet
		console.log('Adding pet:', pet);
	},
	
	async updatePet(id: string, updates: Partial<Pet>) {
		// TODO: Implement API call to update pet
		console.log('Updating pet:', id, updates);
	},
	
	async deletePet(id: string) {
		// TODO: Implement API call to delete pet
		console.log('Deleting pet:', id);
	}
};