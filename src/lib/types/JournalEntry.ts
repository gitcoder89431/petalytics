export interface JournalEntry {
	id: string;
	petId: string;
	type: 'health' | 'behavior' | 'diet' | 'activity' | 'general';
	title: string;
	content: string;
	date: Date;
	photos?: string[];
	tags?: string[];
	mood?: 'happy' | 'neutral' | 'sad' | 'excited' | 'tired' | 'anxious';
	aiAnalysis?: {
		insights: string[];
		recommendations: string[];
		confidence: number;
	};
	createdAt: Date;
	updatedAt: Date;
}

export interface JournalEntryInput {
	petId: string;
	type: JournalEntry['type'];
	title: string;
	content: string;
	date?: Date;
	photos?: File[];
	tags?: string[];
	mood?: JournalEntry['mood'];
}