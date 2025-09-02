export interface AIAnalysisStored {
	summary: string;
	moodTrend: 'improving' | 'stable' | 'concerning';
	activityLevel: 'low' | 'normal' | 'high';
	healthConcerns: string[];
	recommendations: string[];
	nextCheckupSuggestion?: string;
	modelId?: string;
	analyzedAt?: string;
}

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
	aiAnalysis?: AIAnalysisStored;
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
