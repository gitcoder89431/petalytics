<script lang="ts">
	import { onMount } from 'svelte';
	import { petStore, selectedPetStore, petHelpers, selectedPetHelpers } from '$lib/stores/pets';
	import { aiAnalysisHelpers, isAnalyzing, analysisStore } from '$lib/stores/ai-analysis';
	import { ruixenHelpers } from '$lib/stores/ruixen';
	import { PenTool, Brain, Calendar, Activity } from 'lucide-svelte';
	import AIInsightsCard from '../ui/AIInsightsCard.svelte';
	import RuixenInsights from '../ui/RuixenInsights.svelte';
	import DataManager from '../ui/DataManager.svelte';
	import Button from '../ui/Button.svelte';
	import { toast } from '$lib/stores/toast';
	import EmptyState from '../ui/EmptyState.svelte';
	import Skeleton from '../ui/Skeleton.svelte';
	import { rightPanelView, uiHelpers } from '$lib/stores/ui';
	import { guardianStore } from '$lib/stores/guardian';
	import type { RightPanelView } from '$lib/stores/ui';
	import type { PetPanelData } from '$lib/types/Pet';
	import type { JournalEntry } from '$lib/types/JournalEntry';

	// Inline placeholder avatar (rounded square with simple mark)
	const AVATAR_PLACEHOLDER =
		'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHJ4PSIxNiIgZmlsbD0iI0Q2REM2RSIvPjx0ZXh0IHg9IjI0IiB5PSIyOSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFwcGxlIENvbG9yIEVtb2ppIiBmb250LXNpemU9IjE2IiBmaWxsPSIjRkZGIj7wn5i98J+YvTwvdGV4dD48L3N2Zz4=';

	let selectedPet: PetPanelData | null = null;
	let selectedPetId: string | null = null;
	let pets: PetPanelData[] = [];
	let currentView: RightPanelView = 'dashboard';
	let journalInput = '';
	let selectedMood = '';
	let selectedActivity = '';
	let isSubmitting = false;
	let loading = false;
	let apiKeyValid = false;
	let runningInsight = false;
	let runningWeekly = false;
	let weeklyCloudText: string | null = null;
	let weeklyForPetId: string | null = null;

	// Computed values
	$: lastEntry = selectedPet?.journalEntries?.length
		? selectedPet.journalEntries[selectedPet.journalEntries.length - 1]
		: null;

	function formatAge(pet: PetPanelData): string {
		if (!pet || pet.age === undefined || pet.age === null) return '';
		const unit = pet.ageUnit || 'years';
		const abbr = unit === 'years' ? 'y' : unit === 'months' ? 'm' : 'w';
		return `${pet.age} ${abbr}`;
	}

	function petSubtitle(pet: PetPanelData): string {
		const parts: string[] = [];
		if (pet.species) parts.push(pet.species);
		if (pet.breed) parts.push(pet.breed);
		const age = formatAge(pet);
		if (age) parts.push(age);
		return parts.join(' | ');
	}

	function isArchived(p: PetPanelData | null): boolean {
		return !!(p && p.archived);
	}

	function archivedPetsList(): PetPanelData[] {
		return (pets || []).filter((p) => p.archived);
	}

	onMount(() => {
	// Reflect guardian API key validity for cloud capability
		guardianStore.subscribe((g) => {
			apiKeyValid = !!g?.apiKeyValid && !!g?.apiKey;
		});

		// Subscribe first so incoming loads propagate into state
		petStore.subscribe((list) => {
			pets = list || [];
			// Hydrate AI cache from persisted entries on first load of list
			if (pets && pets.length) {
				aiAnalysisHelpers.hydrateFromPets(pets);
			}
			if (selectedPetId) {
				selectedPet = pets.find((p) => p.id === selectedPetId) || null;
			} else if (!selectedPetId && pets.length > 0) {
				// Auto-select the first ACTIVE pet to show a summary by default
				const firstActive = pets.find((p) => !p.archived) || null;
				if (firstActive) {
					selectedPetHelpers.select(firstActive.id);
					uiHelpers.setView('dashboard');
				} else {
					// No active pets: keep selection cleared and default view dashboard
					selectedPetHelpers.clear();
					uiHelpers.setView('dashboard');
				}
			}
		});

		selectedPetStore.subscribe((petId) => {
			selectedPetId = petId;
			selectedPet = petId ? pets.find((p) => p.id === petId) || null : null;
			// Clear weekly cloud text if switching pets
			if (weeklyForPetId && petId !== weeklyForPetId) {
				weeklyCloudText = null;
				weeklyForPetId = null;
			}
			// Keep current view unless user explicitly opened memories.
			// Disable actions via disabled buttons when archived is selected.
		});

		// Drive view from shared UI store
		rightPanelView.subscribe((v) => (currentView = v));

		// Load from storage (will trigger subscriptions above)
		petHelpers.load();
		selectedPetHelpers.load();
	});

	async function submitJournalEntry() {
		if (!journalInput.trim() || !selectedPet) return;

		isSubmitting = true;

		try {
			const now = new Date();
			const entry: JournalEntry = {
				id: Date.now().toString(),
				petId: selectedPet.id,
				type: 'general',
				title: `Journal Entry - ${now.toLocaleDateString()}`,
				content: journalInput.trim(),
				date: now,
				mood: (selectedMood as JournalEntry['mood']) || 'neutral',
				createdAt: now,
				updatedAt: now,
			};

			// Add entry to pet
			petHelpers.addJournalEntry(selectedPet.id, entry);

			// Skip automatic analysis; allow manual triggers via buttons

			// Reset form
			journalInput = '';
			selectedMood = '';
			selectedActivity = '';
			uiHelpers.setView('dashboard');

			// Refresh selected pet data
			selectedPet = petHelpers.getPet(selectedPet.id);
		} catch (error) {
			console.error('Error submitting entry:', error);
		} finally {
			isSubmitting = false;
		}
	}

	async function runLastEntryInsight() {
		if (!selectedPet || !(selectedPet.journalEntries || []).length) return;
		runningInsight = true;
		try {
			if (!apiKeyValid) {
				toast.info('Ruixen is offline', 'Set your API key in Guardian to run cloud analysis');
			}
			const res = await ruixenHelpers.analyzeLastEntryNow(selectedPet);
			const last = (selectedPet.journalEntries || []).slice(-1)[0];
			if (res && last) {
				analysisStore.update((cache) => ({ ...cache, [last.id]: res }));
				const petNow = petHelpers.getPet(selectedPet.id);
				if (petNow) {
					const updatedEntries = (petNow.journalEntries || []).map((e) =>
						e.id === last.id
							? {
									...e,
									aiAnalysis: {
										...res,
										modelId: (selectedPet as any)?.model || undefined,
										analyzedAt: new Date().toISOString(),
									},
								}
							: e
					);
					petHelpers.update(petNow.id, { journalEntries: updatedEntries });
				}
				toast.success('Ruixen insight ready', 'Latest entry analyzed');
			} else {
				toast.info('No entry to analyze');
			}
		} catch (e) {
			const msg = String((e as Error)?.message || e);
			if (/429|Rate limit exceeded/i.test(msg)) {
				toast.info('Ruixen: Daily free limit reached', 'Try again tomorrow or add credits to OpenRouter');
			} else {
				toast.error('Insight failed', (e as Error).message);
			}
		} finally {
			runningInsight = false;
		}
	}

	async function runWeeklyCloud() {
		if (!selectedPet) return;
		runningWeekly = true;
		weeklyCloudText = null;
		try {
			if (!apiKeyValid) {
				toast.info('Ruixen is offline', 'Weekly cloud analysis requires an API key');
				return;
			}
			const text = await ruixenHelpers.analyzeWeeklyCloud(selectedPet);
			if (text) {
				weeklyCloudText = text;
				weeklyForPetId = selectedPet.id;
				toast.success('Weekly cloud analysis ready');
			} else {
				toast.warning('Weekly analysis unavailable', 'Please try again later');
			}
		} catch (e) {
			const msg = String((e as Error)?.message || e);
			if (/429|Rate limit exceeded/i.test(msg)) {
				toast.info('Ruixen: Daily free limit reached', 'Try again tomorrow or add credits to OpenRouter');
			} else {
				toast.error('Weekly analysis failed', (e as Error).message);
			}
		} finally {
			runningWeekly = false;
		}
	}
</script>

<div class="viewport-container h-full flex flex-col font-mono">
	{#if loading}
		<!-- Loading State with Skeleton -->
		<div class="space-y-4">
			<Skeleton height="h-8" />
			<Skeleton showAvatar height="h-20" />
			<Skeleton height="h-6" />
			<Skeleton height="h-4" />
		</div>
	{:else if !selectedPet && currentView !== 'memories' && currentView !== 'dataManager'}
		<div class="h-full grid place-items-center">
			<EmptyState
				icon="file-text"
				title="No pet selected"
				description="Select a pet from the left panel to view details, add journal entries, and see Ruixen insights."
				actionText="Import Data"
				onAction={() => {
					uiHelpers.setView('dataManager');
				}}
				secondaryActionText="Add a Pet"
				onSecondaryAction={() => {
					uiHelpers.openCreatePetForm();
				}}
			/>
		</div>
	{:else}
		<div class="pet-viewport h-full flex flex-col">
			<!-- Header with pet info and navigation -->
			<div
				class="viewport-header p-4 border-b"
				style="border-color: var(--petalytics-border); background: var(--petalytics-overlay);"
			>
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-3">
						{#if selectedPet}
							<img
								src={selectedPet.profileImageUrl || AVATAR_PLACEHOLDER}
								alt={selectedPet.name}
								class="w-12 h-12 rounded-full object-cover"
								onerror={(e) => {
									(e.target as HTMLImageElement).src = AVATAR_PLACEHOLDER;
								}}
							/>
						{/if}
						<div>
							<h2 class="text-xl font-bold" style="color: var(--petalytics-text);">
								{selectedPet
									? selectedPet.name
									: currentView === 'memories'
										? 'Memories'
										: currentView === 'dataManager'
											? 'Data Manager'
											: 'Petalytics'}
							</h2>
							<p class="text-xs" style="color: var(--petalytics-subtle);">
								{selectedPet
									? petSubtitle(selectedPet)
									: currentView === 'memories'
										? 'Archived memories'
										: currentView === 'dataManager'
											? 'Backup, export, and import'
											: ''}
							</p>
						</div>
					</div>

					{#if currentView === 'memories' || currentView === 'dataManager'}
						<div class="flex space-x-2">
							<button
								onclick={() => {
									// return to dashboard; select first active pet if available
									const firstActive = (pets || []).find((p) => !p.archived) || null;
									if (firstActive) {
										selectedPetHelpers.select(firstActive.id);
									} else {
										selectedPetHelpers.clear();
									}
									uiHelpers.setView('dashboard');
								}}
								class="nav-button px-3 py-1 rounded-md text-sm"
							>
								Back to Dashboard
							</button>
						</div>
					{:else if selectedPet}
						<div class="flex space-x-2">
							<button
								class="nav-button px-3 py-1 rounded-md text-sm"
								data-active={currentView === 'dashboard'}
								disabled={!selectedPet || isArchived(selectedPet)}
								onclick={() => uiHelpers.setView('dashboard')}
							>
								Dashboard
							</button>
							<button
								class="nav-button px-3 py-1 rounded-md text-sm"
								data-active={currentView === 'journal'}
								disabled={!selectedPet || isArchived(selectedPet)}
								onclick={() => uiHelpers.setView('journal')}
							>
								New Entry
							</button>
							<button
								class="nav-button px-3 py-1 rounded-md text-sm"
								data-active={currentView === 'history'}
								disabled={!selectedPet || isArchived(selectedPet)}
								onclick={() => uiHelpers.setView('history')}
							>
								History
							</button>
						</div>
					{/if}
				</div>
			</div>

			<!-- Content Area -->
			<div class="viewport-content flex-1 p-4 overflow-y-auto">
				{#if currentView === 'confirmArchive'}
					<!-- Confirm Archive View -->
					<div class="space-y-4 font-mono">
						<h3 class="text-lg font-semibold" style="color: var(--petalytics-text);">
							Archive Pet
						</h3>
						<p>Mark {selectedPet?.name} as passed away?</p>
						<div class="flex justify-end gap-2">
							<Button variant="secondary" onclick={() => uiHelpers.setView('dashboard')}
								>Cancel</Button
							>
							<Button
								variant="primary"
								onclick={() => {
									if (selectedPet) {
										petHelpers.archive(selectedPet.id);
										if (selectedPetId === selectedPet.id) {
											selectedPetHelpers.clear();
										}
									}
									uiHelpers.setView('dashboard');
								}}>Confirm</Button
							>
						</div>
					</div>
				{:else if currentView === 'memories'}
					<!-- Centralized archived memories view -->
					<div class="space-y-4 font-mono">
						<div
							class="rounded p-3"
							style="background: color-mix(in oklab, var(--petalytics-overlay) 60%, transparent); border: 1px solid var(--petalytics-border);"
						>
							<div class="flex items-center justify-between">
								<div>
									<div class="text-base font-semibold" style="color: var(--petalytics-text);">
										Memories
									</div>
									<div class="text-xs" style="color: var(--petalytics-subtle);">
										Archived memories
									</div>
								</div>
								<div
									class="text-xs px-2 py-1 rounded"
									style="background: var(--petalytics-surface); color: var(--petalytics-subtle);"
								>
									{archivedPetsList().length} pets
								</div>
							</div>
						</div>

						{#if archivedPetsList().length === 0}
							<div class="text-sm" style="color: var(--petalytics-subtle);">
								No archived pets yet.
							</div>
						{:else}
							{#each archivedPetsList() as ap}
								<div
									class="rounded border p-3 space-y-2"
									style="background: var(--petalytics-surface); border-color: var(--petalytics-border);"
								>
									<div class="flex items-center justify-between">
										<div class="font-semibold" style="color: var(--petalytics-text);">
											In loving memory of {ap.name}
										</div>
										<div class="text-xs" style="color: var(--petalytics-subtle);">
											{ap.journalEntries?.length || 0} memories
										</div>
									</div>
									{#if (ap.journalEntries?.length || 0) === 0}
										<div class="text-sm" style="color: var(--petalytics-subtle);">
											No journal entries.
										</div>
									{:else}
										<div class="space-y-2">
											{#each [...(ap.journalEntries || [])].slice().reverse() as entry}
												<div
													class="rounded border p-3"
													style="background: var(--petalytics-surface); border-color: var(--petalytics-border);"
												>
													<div class="flex items-center justify-between mb-2">
														<div class="text-xs" style="color: var(--petalytics-subtle);">
															{new Date(entry.date as any).toLocaleDateString()} — {ap.name}
														</div>
														<div class="text-sm" style="color: var(--petalytics-text);">
															{entry.mood || '🐾'}
														</div>
													</div>
													<div class="text-sm" style="color: var(--petalytics-text);">
														{entry.content}
													</div>
												</div>
											{/each}
										</div>
									{/if}
								</div>
							{/each}
						{/if}
					</div>
				{:else if currentView === 'dataManager'}
					<!-- Data Manager full-width in right panel -->
					<div class="space-y-4 font-mono">
						<div
							class="p-2 rounded"
							style="background: var(--petalytics-surface); border: 1px solid var(--petalytics-border);"
						>
							<DataManager />
						</div>
					</div>
				{:else if currentView === 'dashboard' && selectedPet}
					<!-- Dashboard View -->
					<div class="dashboard-grid space-y-4">
						<!-- Stats Cards -->
						<div class="stats-grid grid grid-cols-2 md:grid-cols-4 gap-4">
							<div
								class="stat-card p-4 rounded-lg text-center"
								style="background: var(--petalytics-surface);"
							>
								<div class="text-2xl font-bold" style="color: var(--petalytics-accent);">
									{selectedPet.journalEntries.length}
								</div>
								<div class="text-xs" style="color: var(--petalytics-subtle);">Total Entries</div>
							</div>
							<div
								class="stat-card p-4 rounded-lg text-center"
								style="background: var(--petalytics-surface);"
							>
								<div class="text-2xl font-bold" style="color: var(--petalytics-accent);">
									{formatAge(selectedPet)}
								</div>
								<div class="text-xs" style="color: var(--petalytics-subtle);">Age</div>
							</div>
							<div
								class="stat-card p-4 rounded-lg text-center"
								style="background: var(--petalytics-surface);"
							>
								<div class="text-2xl font-bold" style="color: var(--petalytics-accent);">
									{Math.max(
										0,
										Math.floor(
											(Date.now() - new Date(selectedPet.createdAt).getTime()) /
												(1000 * 60 * 60 * 24)
										)
									)}
								</div>
								<div class="text-xs" style="color: var(--petalytics-subtle);">Days Tracked</div>
							</div>
							<div
								class="stat-card p-4 rounded-lg text-center"
								style="background: var(--petalytics-surface);"
							>
								<div class="text-2xl font-bold truncate" style="color: var(--petalytics-accent);">
									{selectedPet.breed || selectedPet.species || '—'}
								</div>
								<div class="text-xs" style="color: var(--petalytics-subtle);">Breed / Species</div>
							</div>
						</div>

						<!-- Recent Activity & AI Insights -->
						<div class="content-grid grid grid-cols-1 lg:grid-cols-2 gap-4">
							<div
								class="activity-card p-4 rounded-lg"
								style="background: var(--petalytics-surface);"
							>
								<h3
									class="font-semibold mb-3 flex items-center"
									style="color: var(--petalytics-text);"
								>
									<Activity size={16} class="mr-2" style="color: var(--petalytics-accent);" />
									Recent Activity
								</h3>
								{#if selectedPet.journalEntries.length === 0}
									<p class="text-sm" style="color: var(--petalytics-subtle);">
										No entries yet. Click "New Entry" to start journaling!
									</p>
								{:else}
									<div class="space-y-2">
										{#each selectedPet.journalEntries.slice(-3).reverse() as entry}
											<div
												class="entry-preview p-2 rounded"
												style="background: var(--petalytics-overlay);"
											>
												<div class="flex justify-between items-center mb-1">
													<span class="text-xs" style="color: var(--petalytics-subtle);">
														{new Date(entry.date).toLocaleDateString()}
													</span>
													<span class="text-sm">
														{entry.mood === 'happy'
															? '😊'
															: entry.mood === 'sad'
																? '😢'
																: entry.mood === 'playful'
																	? '🎾'
																	: entry.mood === 'tired'
																		? '😴'
																		: '🐾'}
													</span>
												</div>
												<p class="text-sm truncate" style="color: var(--petalytics-text);">
													{entry.content}
												</p>
											</div>
										{/each}
									</div>
								{/if}
							</div>

							<div
								class="insights-card p-4 rounded-lg"
								style="background: var(--petalytics-surface);"
							>
								<h3
									class="font-semibold mb-3 flex items-center"
									style="color: var(--petalytics-text);"
								>
									<Brain size={16} class="mr-2" style="color: var(--petalytics-accent);" />
									Ruixen Insights
								</h3>
								<div class="flex gap-2 mb-3">
									<Button
										variant="secondary"
										disabled={!selectedPet?.journalEntries?.length || runningInsight || isArchived(selectedPet)}
										onclick={runLastEntryInsight}
									>
										{#if runningInsight}
											<div class="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
											<span>Running…</span>
										{:else}
											<span>Analyze latest entry</span>
										{/if}
									</Button>
									<Button
										variant="secondary"
										disabled={!selectedPet || runningWeekly || isArchived(selectedPet)}
										onclick={runWeeklyCloud}
									>
										{#if runningWeekly}
											<div class="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
											<span>Weekly summary…</span>
										{:else}
											<span>Run 1‑week analysis</span>
										{/if}
									</Button>
								</div>
								{#if selectedPet.journalEntries.length === 0}
									<p class="text-sm" style="color: var(--petalytics-subtle);">
										Add journal entries to get AI-powered insights about {selectedPet.name}'s
										well-being.
									</p>
								{:else}
									<AIInsightsCard petId={selectedPet.id} entryId={lastEntry?.id} compact={true} />
								{/if}
							</div>
						</div>

						{#if selectedPet}
							<div class="mt-4">
								<RuixenInsights pet={selectedPet} cloudWeekly={weeklyCloudText} />
							</div>
						{/if}
					</div>
				{:else if currentView === 'journal' && selectedPet}
					<!-- Journal Entry Form -->
					<div class="journal-form max-w-2xl mx-auto">
						<div class="form-card p-6 rounded-lg" style="background: var(--petalytics-surface);">
							<h3 class="text-xl font-semibold mb-4" style="color: var(--petalytics-text);">
								New Entry for {selectedPet.name}
							</h3>

							<div class="space-y-4">
								<!-- Mood & Activity Selectors -->
								<div class="grid grid-cols-2 gap-4">
									<div>
										<label
											for="journal-mood"
											class="block text-sm font-medium mb-2"
											style="color: var(--petalytics-subtle);"
										>
											Mood
										</label>
										<select id="journal-mood" bind:value={selectedMood} class="input w-full">
											<option value="">Select mood...</option>
											<option value="happy">😊 Happy</option>
											<option value="playful">🎾 Playful</option>
											<option value="tired">😴 Tired</option>
											<option value="anxious">😰 Anxious</option>
											<option value="sad">😢 Sad</option>
											<option value="sick">🩺 Unwell</option>
										</select>
									</div>

									<div>
										<label
											for="journal-activity"
											class="block text-sm font-medium mb-2"
											style="color: var(--petalytics-subtle);"
										>
											Activity Level
										</label>
										<select
											id="journal-activity"
											bind:value={selectedActivity}
											class="input w-full"
										>
											<option value="">Select activity...</option>
											<option value="low">Low Activity</option>
											<option value="normal">Normal Activity</option>
											<option value="high">High Activity</option>
											<option value="unusual">Unusual Behavior</option>
										</select>
									</div>
								</div>

								<!-- Journal Text -->
								<div>
									<label
										for="journal-text"
										class="block text-sm font-medium mb-2"
										style="color: var(--petalytics-subtle);"
									>
										What happened today?
									</label>
									<textarea
										id="journal-text"
										bind:value={journalInput}
										placeholder="Describe your pet's behavior, health, activities, or anything noteworthy..."
										class="input w-full h-32 resize-none"
										disabled={isSubmitting}
									></textarea>
								</div>

								<!-- Actions -->
								<div class="flex justify-end space-x-3">
									<Button
										variant="secondary"
										onclick={() => uiHelpers.setView('dashboard')}
										disabled={isSubmitting}
									>
										Cancel
									</Button>
									<Button
										variant="primary"
										onclick={submitJournalEntry}
										disabled={!journalInput.trim() || isSubmitting}
									>
										{#if isSubmitting || $isAnalyzing}
											<div
												class="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"
											></div>
											<span>Analyzing...</span>
										{:else}
											<PenTool size={16} />
											<span>Add Entry</span>
										{/if}
									</Button>
								</div>
							</div>
						</div>
					</div>
				{:else if currentView === 'history' && selectedPet}
					<!-- History View -->
					<div class="history-view max-w-4xl mx-auto">
						<h3 class="text-xl font-semibold mb-4" style="color: var(--petalytics-text);">
							Journal History
						</h3>

						{#if selectedPet.journalEntries.length === 0}
							<div class="empty-state text-center py-12">
								<Calendar size={48} style="color: var(--petalytics-subtle);" class="mx-auto mb-4" />
								<p class="text-lg mb-2" style="color: var(--petalytics-text);">No entries yet</p>
								<button onclick={() => uiHelpers.setView('journal')} class="button">
									Write First Entry
								</button>
							</div>
						{:else}
							<div class="entries-list space-y-4">
								{#each [...selectedPet.journalEntries].reverse() as entry}
									<div
										class="entry-card p-4 rounded-lg border"
										style="background: var(--petalytics-surface); border-color: var(--petalytics-border);"
									>
										<div class="flex justify-between items-start mb-2">
											<span class="text-sm font-medium" style="color: var(--petalytics-text);">
												{new Date(entry.date).toLocaleDateString('en-US', {
													weekday: 'short',
													month: 'short',
													day: 'numeric',
												})}
											</span>
											<div class="flex items-center space-x-2">
												<span class="text-lg">
													{entry.mood === 'happy'
														? '😊'
														: entry.mood === 'sad'
															? '😢'
															: entry.mood === 'playful'
																? '🎾'
																: entry.mood === 'tired'
																	? '😴'
																	: '🐾'}
												</span>
												<span
													class="text-xs px-2 py-1 rounded"
													style="background: var(--petalytics-overlay); color: var(--petalytics-subtle);"
												>
													{entry.activityLevel}
												</span>
											</div>
										</div>
										<p class="text-sm mb-3" style="color: var(--petalytics-text);">
											{entry.content}
										</p>
										<AIInsightsCard entryId={entry.id} compact={true} />
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.nav-button {
		background: var(--petalytics-overlay);
		color: var(--petalytics-text);
		transition: all 0.2s;
	}

	.nav-button:hover {
		opacity: 0.8;
		background: var(--petalytics-highlight-low);
	}

	.nav-button[data-active='true'] {
		background: var(--petalytics-highlight-med);
		border: 1px solid var(--petalytics-accent);
	}

	.nav-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
