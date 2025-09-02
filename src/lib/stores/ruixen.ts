import { writable } from 'svelte/store';
import { guardianStore } from './guardian.js';
import type { PetPanelData } from '../types/Pet.js';
import type { JournalEntry } from '../types/JournalEntry.js';
import { AIAnalyzer, type AnalysisResult } from '$lib/utils/ai-analysis';

// Ruixen: AI agent orchestrator with rate limiting and helpful offline fallbacks

type QueueTask = {
	pet: PetPanelData;
	entry: JournalEntry;
	resolve: (r: AnalysisResult | null) => void;
	reject: (e: any) => void;
};

const MINUTE_LIMIT = 18; // under 20/min hard limit
const DAILY_FREE_LIMIT = 45; // under 50/day for :free when <10 credits
const DAILY_USAGE_KEY = 'openrouter_daily_usage';

function isBrowser() {
	return typeof window !== 'undefined';
}

function isFreeModel(model: string | undefined) {
	return !!model && /:free$/i.test(model);
}

function loadDailyCount(): { date: string; count: number } {
	if (!isBrowser()) return { date: 'n/a', count: 0 };
	try {
		const raw = localStorage.getItem(DAILY_USAGE_KEY);
		if (!raw) return { date: new Date().toDateString(), count: 0 };
		const parsed = JSON.parse(raw);
		const today = new Date().toDateString();
		if (parsed?.date !== today) return { date: today, count: 0 };
		return { date: parsed.date, count: Number(parsed.count) || 0 };
	} catch {
		return { date: new Date().toDateString(), count: 0 };
	}
}

function saveDailyCount(next: { date: string; count: number }) {
	if (!isBrowser()) return;
	try {
		localStorage.setItem(DAILY_USAGE_KEY, JSON.stringify(next));
	} catch {}
}

class RateLimiter {
	private lastMinute: number[] = [];
	private getDaily = loadDailyCount;
	private setDaily = saveDailyCount;

	canRequest(model: string | undefined): boolean {
		const now = Date.now();
		// prune minute window
		this.lastMinute = this.lastMinute.filter((t) => now - t < 60_000);
		if (this.lastMinute.length >= MINUTE_LIMIT) return false;

		if (isFreeModel(model)) {
			const d = this.getDaily();
			if (d.count >= DAILY_FREE_LIMIT) return false;
		}
		return true;
	}

	record(model: string | undefined) {
		const now = Date.now();
		this.lastMinute.push(now);
		if (isFreeModel(model)) {
			const d = this.getDaily();
			const today = new Date().toDateString();
			const next = { date: today, count: d.date === today ? d.count + 1 : 1 };
			this.setDaily(next);
		}
	}

	msUntilAvailable(): number {
		const now = Date.now();
		this.lastMinute = this.lastMinute.filter((t) => now - t < 60_000);
		if (this.lastMinute.length < MINUTE_LIMIT) return 0;
		const oldest = Math.min(...this.lastMinute);
		return Math.max(0, 60_000 - (now - oldest)) + 50;
	}
}

class Ruixen {
	private apiKey = '';
	private model = 'openai/gpt-oss-20b:free';
	private analyzer: AIAnalyzer | null = null;
	private limiter = new RateLimiter();
	private queue: QueueTask[] = [];
	private running = false;

	// State stores
	public queueSize = writable(0);
	public dailyUsage = writable(loadDailyCount().count);

	constructor() {
		guardianStore.subscribe((g) => {
			this.apiKey = g.apiKey || '';
			this.model = (g as any).model || 'openai/gpt-oss-20b:free';
			this.analyzer = g.apiKey && g.apiKeyValid ? new AIAnalyzer(g.apiKey, this.model) : null;
		});
	}

	requestAnalysis(pet: PetPanelData, entry: JournalEntry): Promise<AnalysisResult | null> {
		return new Promise((resolve, reject) => {
			// If cannot make requests at all, return a lightweight offline hint
			if (!this.analyzer) {
				resolve(this.offlineHeuristic(pet, entry));
				return;
			}

			// Try immediate if allowed
			if (this.limiter.canRequest(this.model)) {
				this.limiter.record(this.model);
				this.dailyUsage.set(loadDailyCount().count);
				this.analyzer
					.analyzeJournalEntry(pet, entry)
					.then(resolve)
					.catch((e) => {
						console.error('Ruixen immediate analysis failed:', e);
						resolve(this.offlineHeuristic(pet, entry));
					});
				return;
			}

			// Else enqueue to respect rate limits
			this.queue.push({ pet, entry, resolve, reject });
			this.queueSize.set(this.queue.length);
			this.runQueue();
		});
	}

	private runQueue() {
		if (this.running) return;
		this.running = true;
		const loop = async () => {
			while (this.queue.length > 0) {
				const next = this.queue[0];
				if (!this.analyzer) {
					// Fallback for entire queue
					next.resolve(this.offlineHeuristic(next.pet, next.entry));
					this.queue.shift();
					this.queueSize.set(this.queue.length);
					continue;
				}

				if (!this.limiter.canRequest(this.model)) {
					const wait = this.limiter.msUntilAvailable();
					await new Promise((r) => setTimeout(r, Math.min(wait, 1500)));
					continue;
				}

				this.limiter.record(this.model);
				this.dailyUsage.set(loadDailyCount().count);
				try {
					const res = await this.analyzer.analyzeJournalEntry(next.pet, next.entry);
					next.resolve(res);
				} catch (e) {
					console.error('Ruixen queued analysis failed:', e);
					next.resolve(this.offlineHeuristic(next.pet, next.entry));
				} finally {
					this.queue.shift();
					this.queueSize.set(this.queue.length);
				}
			}
			this.running = false;
		};
		loop();
	}

	// Lightweight local heuristic when we can’t call the API
	private offlineHeuristic(pet: PetPanelData, entry: JournalEntry): AnalysisResult {
		const text = `${entry.title || ''} ${entry.content}`.toLowerCase();
		const signsConcerning =
			/(letharg|not eat|didn\'t eat|no appetite|vomit|diarrhea|labored|wheeze|injur|blood|hiding|corner|less singing|cough)/i.test(
				text
			);
		const moodTrend: AnalysisResult['moodTrend'] = signsConcerning ? 'concerning' : 'stable';
		const activityLevel: AnalysisResult['activityLevel'] = /high|play|ran|energetic/.test(text)
			? 'high'
			: /low|tired|sleep|letharg/i.test(text)
				? 'low'
				: 'normal';
		const concerns: string[] = [];
		if (signsConcerning) {
			if (
				(pet.species || '').toLowerCase().includes('bird') ||
				(pet.breed || '').toLowerCase().includes('cockatiel')
			) {
				concerns.push('Possible respiratory issue or stress (common in birds)');
			} else {
				concerns.push('Monitor appetite and energy; consider vet consult if persists');
			}
		}

		const recs: string[] = [];
		if (signsConcerning) {
			recs.push('Monitor closely for 24 hours');
			recs.push('If no improvement, contact your vet');
		} else {
			recs.push('Keep routine consistent and continue observations');
		}

		return {
			summary: `Ruixen (offline): ${pet.name}\'s entry analyzed with a local heuristic.`,
			moodTrend,
			activityLevel,
			healthConcerns: concerns,
			recommendations: recs,
			nextCheckupSuggestion: undefined,
		};
	}

	weeklySummary(pet: PetPanelData) {
		const last7 = (pet.journalEntries || []).filter((e) => {
			const d = new Date(e.date as any).getTime();
			return Date.now() - d <= 7 * 24 * 60 * 60 * 1000;
		});
		const energy = last7.reduce(
			(acc, e) => acc + (e.activityLevel === 'high' ? 2 : e.activityLevel === 'low' ? 0 : 1),
			0
		);
		const appetiteHints = last7.filter((e) =>
			/eat|appetite|food|breakfast|dinner/i.test(e.content)
		).length;
		const socialHints = last7.filter((e) =>
			/play|walk|cuddle|sing|interaction|social/i.test(e.content)
		).length;
		const trend =
			energy > last7.length ? 'improving' : energy < last7.length ? 'declining' : 'flat';
		return {
			title: `${pet.name}\'s patterns (7 days)`,
			energy: trend,
			appetite: `${Math.round((appetiteHints / Math.max(1, last7.length)) * 100)}% entries mention food`,
			social: socialHints > last7.length / 2 ? 'normal' : 'reduced',
			recommendation:
				socialHints < Math.ceil(last7.length / 3)
					? 'Increase enrichment and interaction time'
					: 'Keep routine',
		};
	}

	speciesInsights(pet: PetPanelData) {
		const species = (pet.breed || pet.species || '').toLowerCase();
		if (species.includes('cockatiel')) {
			return [
				'Prime age may include hormonal changes; be patient with mood swings',
				'Molting season can reduce singing and energy; ensure balanced diet',
				'Aim for 2+ hours of social interaction daily; provide foraging toys',
			];
		}
		if (
			species.includes('parrot') ||
			species.includes('budgie') ||
			(pet.species || '').toLowerCase() === 'bird'
		) {
			return [
				'Birds mask illness; monitor appetite, droppings, and breathing closely',
				'Provide full-spectrum lighting and consistent day/night cycles',
				'Enrichment: rotate toys weekly to prevent boredom',
			];
		}
		if ((pet.species || '').toLowerCase() === 'dog') {
			return [
				'Regular exercise matched to breed energy level prevents behavior issues',
				'Dental care: brush 2-3x weekly or provide dental chews',
				'Annual wellness exam; seniors (7y+) twice yearly',
			];
		}
		if ((pet.species || '').toLowerCase() === 'cat') {
			return [
				'Litter box rule: n+1 boxes; scoop daily to spot issues early',
				'Hydration: consider wet food or fountains to support kidney health',
				'Annual vet exam; seniors (10y+) every 6 months',
			];
		}
		return [
			'Maintain consistent routines; pets thrive on predictability',
			'Track appetite, energy, and mood to catch trends early',
			'When in doubt, consult your veterinarian',
		];
	}

	scheduleReminders(pet: PetPanelData) {
		const created = new Date(pet.createdAt).getTime();
		const daysTracked = Math.max(0, Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24)));
		const vetDue = daysTracked > 365;
		const nailsDue = daysTracked % 60 >= 58 || daysTracked > 60; // rough due within ~2 days window
		const dietDue = daysTracked % 30 >= 28 || daysTracked > 30;
		return [
			{ title: 'Next vet checkup', due: vetDue, note: vetDue ? 'Overdue' : 'Up to date' },
			{ title: 'Nail trimming', due: nailsDue, note: nailsDue ? 'Due soon' : 'Scheduled' },
			{
				title: 'Diet review',
				due: dietDue,
				note: dietDue ? 'Add leafy greens / adjust portions' : 'OK',
			},
		];
	}
}

export const ruixen = new Ruixen();

export const ruixenHelpers = {
	analyzeDaily(pet: PetPanelData, entry: JournalEntry) {
		return ruixen.requestAnalysis(pet, entry);
	},
	weeklySummary(pet: PetPanelData) {
		return ruixen.weeklySummary(pet);
	},
	speciesInsights(pet: PetPanelData) {
		return ruixen.speciesInsights(pet);
	},
	scheduleReminders(pet: PetPanelData) {
		return ruixen.scheduleReminders(pet);
	},
};
