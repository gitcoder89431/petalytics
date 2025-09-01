import type { PetPanelData } from '../types/Pet.js';
import type { JournalEntry } from '../types/JournalEntry.js';

export interface AnalysisResult {
	summary: string;
	moodTrend: 'improving' | 'stable' | 'concerning';
	activityLevel: 'low' | 'normal' | 'high';
	healthConcerns: string[];
	recommendations: string[];
	nextCheckupSuggestion?: string;
}

export class AIAnalyzer {
	private apiKey: string;
	private baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
	private model: string;

	constructor(apiKey: string, model: string = 'anthropic/claude-3.5-sonnet') {
		this.apiKey = apiKey;
		this.model = model;
	}

	async analyzeJournalEntry(pet: PetPanelData, entry: JournalEntry): Promise<AnalysisResult> {
		const prompt = this.buildAnalysisPrompt(pet, entry);
		const referer = typeof window !== 'undefined' ? window.location.origin : undefined;

		try {
			const response = await fetch(this.baseUrl, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${this.apiKey}`,
					'Content-Type': 'application/json',
					...(referer ? { 'HTTP-Referer': referer } : {}),
					'X-Title': 'Petalytics',
				},
				body: JSON.stringify({
					model: this.model,
					messages: [
						{
							role: 'system',
							content:
								'You are a veterinary AI assistant specialized in pet health analysis. Provide helpful, accurate insights while encouraging professional veterinary care for serious concerns.',
						},
						{
							role: 'user',
							content: prompt,
						},
					],
					max_tokens: 500,
					temperature: 0.7,
				}),
			});

			if (!response.ok) {
				throw new Error(`API Error: ${response.status}`);
			}

			const data = await response.json();
			return this.parseAnalysisResponse(data.choices[0].message.content);
		} catch (error) {
			console.error('AI Analysis Error:', error);
			throw error;
		}
	}

	private buildAnalysisPrompt(pet: PetPanelData, entry: JournalEntry): string {
		const recentEntries =
			pet.journalEntries
				?.slice(-5)
				.map((e) => `${e.date}: ${e.content}`)
				.join('\n') || 'No previous entries available';

		return `
Analyze this journal entry for ${pet.name}, a ${pet.age || 'unknown age'}-year-old ${pet.breed}:

LATEST ENTRY: "${entry.content}"

RECENT HISTORY:
${recentEntries}

PET INFO:
- Breed: ${pet.breed}
- Age: ${pet.age || 'unknown'} years
- Gender: ${pet.gender || 'unknown'}

Please provide analysis in this JSON format:
{
  "summary": "Brief summary of the entry",
  "moodTrend": "improving|stable|concerning", 
  "activityLevel": "low|normal|high",
  "healthConcerns": ["concern1", "concern2"],
  "recommendations": ["rec1", "rec2"],
  "nextCheckupSuggestion": "When to see vet (if needed)"
}

Consider breed-specific traits, age-related needs, and behavioral patterns. Keep recommendations practical and encouraging.`;
	}

	private parseAnalysisResponse(content: string): AnalysisResult {
		try {
			// Extract JSON from response (in case there's extra text)
			const jsonMatch = content.match(/\{[\s\S]*\}/);
			if (jsonMatch) {
				return JSON.parse(jsonMatch[0]);
			}

			// Fallback parsing if JSON format isn't perfect
			return {
				summary: content.substring(0, 100) + '...',
				moodTrend: 'stable',
				activityLevel: 'normal',
				healthConcerns: [],
				recommendations: ["Continue monitoring your pet's behavior"],
				nextCheckupSuggestion: undefined,
			};
		} catch (error) {
			console.error('Error parsing AI response:', error);
			throw new Error('Failed to parse AI analysis');
		}
	}

	async testConnection(): Promise<boolean> {
		try {
			const referer = typeof window !== 'undefined' ? window.location.origin : undefined;
			const response = await fetch(this.baseUrl, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${this.apiKey}`,
					'Content-Type': 'application/json',
					...(referer ? { 'HTTP-Referer': referer } : {}),
					'X-Title': 'Petalytics',
				},
				body: JSON.stringify({
					model: this.model,
					messages: [{ role: 'user', content: 'test' }],
					max_tokens: 1,
				}),
			});

			return response.ok;
		} catch (error) {
			return false;
		}
	}
}
