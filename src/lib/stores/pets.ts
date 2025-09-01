import { writable } from 'svelte/store';
import type { Pet, PetStats, PetPanelData } from '../types/Pet.js';
import { appStorage } from '../utils/storage.js';

// Store for all pets
export const pets = writable<Pet[]>([]);

// Store for the currently selected pet
export const selectedPet = writable<Pet | null>(null);

// Store for pet statistics
export const petStats = writable<Map<string, PetStats>>(new Map());

// Loading states
export const isLoadingPets = writable(false);

// Pet Panel specific stores
export const petStore = writable<PetPanelData[]>([]);
export const selectedPetStore = writable<string | null>(null);

// Storage keys
const STORAGE_KEY = 'petalytics_pets';
const SELECTED_PET_KEY = 'petalytics_selected_pet';

// Pet store helpers for panel
export const petHelpers = {
  // Load pets from localStorage
  load() {
    try {
      const pets = appStorage.loadPets();
      petStore.set(pets || []);
      return pets || [];
    } catch (error) {
      console.error('Error loading pets:', error);
      return [];
    }
  },

  // Save pets to localStorage
  save(pets: PetPanelData[]) {
    try {
      appStorage.savePets(pets);
    } catch (error) {
      console.error('Error saving pets:', error);
    }
  },

  // Add new pet
  add(pet: PetPanelData) {
    petStore.update(pets => {
      const updated = [...pets, pet];
      this.save(updated);
      return updated;
    });
  },

  // Update existing pet
  update(petId: string, updates: Partial<PetPanelData>) {
    petStore.update(pets => {
      const updated = pets.map(pet => 
        pet.id === petId ? { ...pet, ...updates } : pet
      );
      this.save(updated);
      return updated;
    });
  },

  // Remove pet
  remove(petId: string) {
    petStore.update(pets => {
      const updated = pets.filter(pet => pet.id !== petId);
      this.save(updated);
      
      // Clear selection if removed pet was selected
      selectedPetStore.update(selectedId => 
        selectedId === petId ? null : selectedId
      );
      
      return updated;
    });
  },

  // Get pet by ID
  getPet(petId: string): PetPanelData | null {
    let foundPet: PetPanelData | null = null;
    petStore.subscribe(pets => {
      foundPet = pets.find(pet => pet.id === petId) || null;
    })();
    return foundPet;
  },

  // Add journal entry to pet
  addJournalEntry(petId: string, entry: any) {
    petStore.update(pets => {
      const updated = pets.map(pet => {
        if (pet.id === petId) {
          return {
            ...pet,
            journalEntries: [...pet.journalEntries, entry]
          };
        }
        return pet;
      });
      this.save(updated);
      return updated;
    });
  },

  // Get all pets
  getAll(callback?: (pets: PetPanelData[]) => void): (() => void) | undefined {
    if (callback) {
      return petStore.subscribe(callback);
    } else {
      let pets: PetPanelData[] = [];
      const unsubscribe = petStore.subscribe(value => { pets = value; });
      unsubscribe();
      return undefined;
    }
  },

  // Get all pets synchronously
  getAllPets(): PetPanelData[] {
    let pets: PetPanelData[] = [];
    const unsubscribe = petStore.subscribe(value => { pets = value; });
    unsubscribe();
    return pets;
  },

  // Import pet data
  importPet(petData: PetPanelData) {
    petStore.update(pets => {
      const existingIndex = pets.findIndex(p => p.id === petData.id);
      let updated: PetPanelData[];
      
      if (existingIndex >= 0) {
        // Update existing pet
        updated = pets.map((pet, index) => 
          index === existingIndex ? petData : pet
        );
      } else {
        // Add new pet
        updated = [...pets, petData];
      }
      
      this.save(updated);
      return updated;
    });
  }
};

// Selected pet helpers
export const selectedPetHelpers = {
  // Load selected pet from localStorage
  load() {
    try {
      const saved = appStorage.loadSelectedPet();
      if (saved) {
        selectedPetStore.set(saved);
        return saved;
      }
    } catch (error) {
      console.error('Error loading selected pet:', error);
    }
    return null;
  },

  // Save selected pet to localStorage
  save(petId: string | null) {
    try {
      appStorage.saveSelectedPet(petId);
    } catch (error) {
      console.error('Error saving selected pet:', error);
    }
  },

  // Select pet
  select(petId: string) {
    selectedPetStore.set(petId);
    this.save(petId);
  },

  // Clear selection
  clear() {
    selectedPetStore.set(null);
    this.save(null);
  }
};

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

// Auto-save selected pet changes
selectedPetStore.subscribe(petId => {
  selectedPetHelpers.save(petId);
});