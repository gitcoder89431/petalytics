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
	private baseUrl = '/api/ai/analyze';
	private model: string;

	constructor(apiKey: string, _model: string = 'openai/gpt-oss-120b:free') {
		this.apiKey = apiKey;
		// Hard-enforce the chosen free model for all calls
		this.model = 'openai/gpt-oss-120b:free';
	}

	async analyzeJournalEntry(pet: PetPanelData, entry: JournalEntry): Promise<AnalysisResult> {
		const prompt = this.buildAnalysisPrompt(pet, entry);
	const referer = typeof window !== 'undefined' ? window.location.origin : undefined;

		if (typeof window !== 'undefined' && (import.meta as any)?.env?.DEV) {
			console.debug('[Ruixen] Prompt (journal)', {
				model: this.model,
				len: prompt.length,
				preview: prompt.slice(0, 500),
			});
		}

		try {
	    const response = await fetch(this.baseUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
		    apiKey: this.apiKey,
		    model: this.model,
					messages: [
						{
							role: 'system',
							content:
								'You are a veterinary AI assistant. Be concise, factual, and non-creative. Do not invent names, dates, stories, or narrative titles. Use only the provided pet info and journal text. Output must be valid JSON only.',
						},
						{
							role: 'user',
							content: prompt,
						},
					],
					max_tokens: 450,
					temperature: 0.2,
					top_p: 0.1,
					stop: ['<|', '```'],
				}),
			});

			if (!response.ok) {
				const body = await response.text().catch(() => '');
				throw new Error(`API Error: ${response.status} ${body}`);
			}

			const data = await response.json();
			const content = data.choices[0].message.content;
			if (typeof window !== 'undefined' && (import.meta as any)?.env?.DEV) {
				console.debug('[Ruixen] Response (journal) preview', String(content).slice(0, 300));
			}
			const parsed = this.parseAnalysisResponse(content);
			return this.sanitizeAnalysis(parsed, pet, entry);
		} catch (error) {
			console.error('AI Analysis Error:', error);
			throw error;
		}
	}

	async analyzeWeeklySummary(pet: PetPanelData): Promise<string> {
		const sevenDays = (pet.journalEntries || [])
			.slice()
			.filter((e) => Date.now() - new Date(e.date as any).getTime() <= 7 * 24 * 60 * 60 * 1000)
			.map((e) => `- ${new Date(e.date as any).toLocaleDateString()}: ${e.content}`)
			.join('\n') || 'No entries in last 7 days.';

		const prompt = `Summarize the last 7 days for ${pet.name} in 4-6 concise bullet points focused on mood, activity, appetite, and any warning signs.

STRICT RULES:
- Use only the provided entries; do not invent stories, people, or dates.
- No creative writing, titles, emojis, or flourishes.
- Keep language plain and factual.
- Use '-' bullet lines only.

PET: ${pet.name} (${pet.breed || pet.species || 'pet'}, ${pet.age ?? 'unknown'}y)
LAST 7 DAYS:\n${sevenDays}`;

	const referer = typeof window !== 'undefined' ? window.location.origin : undefined;
	const response = await fetch(this.baseUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
		apiKey: this.apiKey,
		model: this.model,
				messages: [
					{
						role: 'system',
						content:
							'You are a veterinary AI assistant. Be concise and factual; never write fiction or narrative prose. Use only provided inputs.'
					},
					{ role: 'user', content: prompt },
				],
				max_tokens: 350,
				temperature: 0.2,
				top_p: 0.1,
				stop: ['<|', '```'],
			}),
		});

		if (!response.ok) {
			const body = await response.text().catch(() => '');
			throw new Error(`API Error: ${response.status} ${body}`);
		}
		const data = await response.json();
		const content: string = data.choices?.[0]?.message?.content || '';
		if (typeof window !== 'undefined' && (import.meta as any)?.env?.DEV) {
			console.debug('[Ruixen] Response (weekly) preview', content.slice(0, 300));
		}
		return content.trim();
	}

	private buildAnalysisPrompt(pet: PetPanelData, entry: JournalEntry): string {
		const recentEntries =
			pet.journalEntries
				?.slice(-5)
				.map((e) => `${e.date}: ${e.content}`)
				.join('\n') || 'No previous entries available';

		return `
Analyze the following pet journal entry for ${pet.name} (a ${pet.age || 'unknown age'}-year-old ${pet.breed || pet.species || 'pet'}).

ENTRY (verbatim): """
${entry.content}
"""

RECENT HISTORY (most recent first):
${recentEntries}

PET INFO:
- Breed/Species: ${pet.breed || pet.species || 'unknown'}
- Age: ${pet.age || 'unknown'} years
- Gender: ${pet.gender || 'unknown'}

STRICT OUTPUT RULES:
- Use ONLY the information provided above; do not invent names, dates, or stories.
- Do NOT produce titles, narratives, or creative prose.
- The summary must be 1-2 plain sentences about the pet's behavior/health in the ENTRY.
- Keep tone neutral and factual; no emojis.
- Output a single JSON object ONLY (no code fences, no extra text).
 - Do NOT repeat or quote the entry text in the output.

JSON FORMAT:
{
	"summary": "1-2 sentence factual summary about the pet's behavior/health in the entry (no titles)",
	"moodTrend": "improving|stable|concerning",
	"activityLevel": "low|normal|high",
	"healthConcerns": ["concern1", "concern2"],
	"recommendations": ["rec1", "rec2"],
	"nextCheckupSuggestion": "When to see vet (if needed)"
}

If the entry lacks enough information, use conservative defaults (moodTrend: "stable", activityLevel: "normal") and recommend observation.`;
	}

	private parseAnalysisResponse(content: string): AnalysisResult {
		try {
			// Normalize content: strip code fences if present
			let raw = content.trim();
			if (raw.startsWith('```')) {
				// remove ```json ... ``` or ``` ... ``` wrappers
				raw = raw.replace(/^```[a-zA-Z]*\n?([\s\S]*?)\n?```$/m, '$1').trim();
			}

			// Try direct parse
			try {
				return JSON.parse(raw);
			} catch {}

			// Try extracting fenced JSON inside the content
			const fenced = content.match(/```json[\s\S]*?```/i) || content.match(/```[\s\S]*?```/);
			if (fenced && fenced[0]) {
				const inner = fenced[0].replace(/```json|```/gi, '').trim();
				try {
					return JSON.parse(inner);
				} catch {}
			}

			// Extract the first JSON-like object and sanitize trailing commas and unterminated quotes
			const braceIndex = content.indexOf('{');
			if (braceIndex !== -1) {
				const lastBrace = content.lastIndexOf('}');
				if (lastBrace > braceIndex) {
					let candidate = content.substring(braceIndex, lastBrace + 1);
					candidate = candidate.replace(/,\s*([}\]])/g, '$1');
					// Ensure summary is a closed string (fix common unterminated quote cases)
					candidate = candidate.replace(
						/("summary"\s*:\s*"[^"}]*)$/m,
						(match) => match + '"'
					);
					return JSON.parse(candidate);
				}
			}

			// Fallback if parsing fails: return a minimal, readable structure
			// Last resort: build a safe, valid object
			const summary = raw
				.replace(/^\{/g, '')
				.replace(/\}$/g, '')
				.replace(/```/g, '')
				.split('\n')[0]
				.trim();
			return {
				summary: summary ? summary.slice(0, 180) + (summary.length > 180 ? '…' : '') : 'No summary available',
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

	private sanitizeAnalysis(
		res: AnalysisResult,
		pet: PetPanelData,
		entry: JournalEntry
	): AnalysisResult {
		const safe = { ...res } as AnalysisResult;
		const s = String(safe.summary || '').trim();
		const looksLikeTitle = /:\s|—|–/.test(s) && /^[A-Z][^.!?]{5,60}$/.test(s.split(/[.!?]/)[0] || '');
		const hasYearOrPerson = /(18|19|20)\d{2}/.test(s) || /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/.test(s);
		const notAboutPet = /(diary|novel|chapter|story|keeper)/i.test(s);
		const hasSpecialTokens = /<\|.*?\|>|```/.test(s);
		if (!s || looksLikeTitle || hasYearOrPerson || notAboutPet) {
			const text = (entry.content || '').replace(/\s+/g, ' ').trim();
			const fallback = text
				? `Entry notes: ${text.slice(0, 160)}${text.length > 160 ? '…' : ''}`
				: `${pet.name}'s entry was recorded; monitor for any changes.`;
			safe.summary = fallback;
		}

		// Remove any special channel/token artifacts if they slipped in
		safe.summary = String(safe.summary || '')
			.replace(/<\|.*?\|>/g, '')
			.replace(/```/g, '')
			.trim();

		// If summary exactly echoes entry content, replace with neutral paraphrase
		const entryTrim = (entry.content || '').replace(/\s+/g, ' ').trim();
		if (safe.summary === entryTrim) {
			safe.summary = entryTrim
				? `Owner noted: ${entryTrim.slice(0, 150)}${entryTrim.length > 150 ? '…' : ''}`
				: `${pet.name}'s entry was recorded; monitor for any changes.`;
		}

		// Normalize arrays
		if (!Array.isArray(safe.healthConcerns)) safe.healthConcerns = [];
		if (!Array.isArray(safe.recommendations)) safe.recommendations = [];
		safe.healthConcerns = safe.healthConcerns.filter((x) => typeof x === 'string').slice(0, 8);
		safe.recommendations = safe.recommendations.filter((x) => typeof x === 'string').slice(0, 8);
		// Clamp enums
		const moods: AnalysisResult['moodTrend'][] = ['improving', 'stable', 'concerning'];
		if (!moods.includes(safe.moodTrend)) safe.moodTrend = 'stable';
		const acts: AnalysisResult['activityLevel'][] = ['low', 'normal', 'high'];
		if (!acts.includes(safe.activityLevel)) safe.activityLevel = 'normal';
		return safe;
	}

	async testConnection(): Promise<boolean> {
		try {
	    const referer = typeof window !== 'undefined' ? window.location.origin : undefined;
	    const response = await fetch(this.baseUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
		    apiKey: this.apiKey,
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

// Fetch available models from OpenRouter API
export async function fetchOpenRouterModels(
	apiKey: string,
	onlyFree: boolean = true
): Promise<string[]> {
	const referer = typeof window !== 'undefined' ? window.location.origin : undefined;
	const resp = await fetch('https://openrouter.ai/api/v1/models', {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
			...(referer ? { 'HTTP-Referer': referer } : {}),
			'X-Title': 'Petalytics',
		},
	});
	if (!resp.ok) {
		throw new Error(`Failed to list models: ${resp.status}`);
	}
	const data = await resp.json();
	const ids: string[] = (data?.data || []).map((m: any) => m?.id).filter(Boolean);
	const filtered = onlyFree ? ids.filter((id) => /:free$/i.test(id)) : ids;
	// Deduplicate and sort for stability
	return Array.from(new Set(filtered)).sort((a, b) => a.localeCompare(b));
}
