import type { JournalEntry, AIAnalysisStored } from './JournalEntry.js';

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
	species?: string;
	breed: string;
	age: number;
	ageUnit?: 'years' | 'months' | 'weeks';
	gender: 'male' | 'female' | 'unknown';
	size?: 'tiny' | 'small' | 'medium' | 'large' | 'extra_large';
	profileImageUrl?: string;
	archived?: boolean;
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
	aiAnalysis?: AIAnalysisStored | string;
}

export type PetMood = 'happy' | 'sad' | 'anxious' | 'playful' | 'tired' | 'sick';
export type ActivityLevel = 'low' | 'normal' | 'high' | 'unusual';

export interface PetStats {
	totalEntries: number;
	lastEntry: Date | null;
	healthScore: number;
}
