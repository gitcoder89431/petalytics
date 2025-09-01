import type { JournalEntry } from './JournalEntry.js';

export interface Pet {
	id: string;
	name: string;
	species: string;
	breed?: string;
	birthDate: Date;
	weight?: number;
	guardianId: string;
	photoUrl?: string;
	notes?: string;
	createdAt: Date;
	updatedAt: Date;
	// Additional fields for new pet panel
	age?: number;
	gender?: 'male' | 'female';
	profileImageUrl?: string;
	journalEntries?: JournalEntry[];
}

// New simplified Pet interface for the panel
export interface PetPanelData {
	id: string;
	name: string;
	breed: string;
	age: number;
	gender: 'male' | 'female';
	profileImageUrl?: string;
	createdAt: string;
	journalEntries: PetJournalEntry[];
}

export interface PetJournalEntry {
	id: string;
	petId: string;
	content: string;
	mood: PetMood;
	activityLevel: ActivityLevel;
	date: string;
	aiAnalysis?: string;
}

export type PetMood = 'happy' | 'sad' | 'anxious' | 'playful' | 'tired' | 'sick';
export type ActivityLevel = 'low' | 'normal' | 'high' | 'unusual';

export interface PetStats {
	totalEntries: number;
	lastEntry: Date | null;
	healthScore: number;
}
