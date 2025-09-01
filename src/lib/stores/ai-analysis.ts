import { writable } from 'svelte/store';
import { AIAnalyzer, type AnalysisResult } from '$lib/utils/ai-analysis';
import { guardianStore } from './guardian';
import type { PetPanelData } from '../types/Pet';
import type { JournalEntry } from '../types/JournalEntry';

export const analysisStore = writable<Record<string, AnalysisResult>>({});
export const isAnalyzing = writable(false);

let analyzer: AIAnalyzer | null = null;

// Initialize analyzer when API key is available
guardianStore.subscribe((guardian) => {
	if (guardian.apiKey && guardian.apiKeyValid) {
		analyzer = new AIAnalyzer(guardian.apiKey, (guardian as any).model || 'anthropic/claude-3.5-sonnet');
	} else {
		analyzer = null;
	}
});

export const aiAnalysisHelpers = {
	async analyzeEntry(pet: PetPanelData, entry: JournalEntry): Promise<AnalysisResult | null> {
		if (!analyzer) {
			throw new Error('API key not configured');
		}

		isAnalyzing.set(true);

		try {
			const result = await analyzer.analyzeJournalEntry(pet, entry);

			// Cache the result
			analysisStore.update((cache) => ({
				...cache,
				[entry.id]: result,
			}));

			return result;
		} catch (error) {
			console.error('Analysis failed:', error);
			return null;
		} finally {
			isAnalyzing.set(false);
		}
	},

	async testConnection(): Promise<boolean> {
		if (!analyzer) return false;
		return analyzer.testConnection();
	},

	getAnalysis(entryId: string): AnalysisResult | null {
		let result = null;
		analysisStore.subscribe((cache) => {
			result = cache[entryId] || null;
		})();
		return result;
	},
};
