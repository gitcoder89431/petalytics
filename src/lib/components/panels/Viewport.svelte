<script lang="ts">
	import { onMount } from 'svelte';
	import { petStore, selectedPetStore, petHelpers, selectedPetHelpers } from '$lib/stores/pets';
	import { aiAnalysisHelpers, isAnalyzing } from '$lib/stores/ai-analysis';
	import { PenTool, Brain, Calendar, Activity } from 'lucide-svelte';
	import AIInsightsCard from '../ui/AIInsightsCard.svelte';
	import EmptyState from '../ui/EmptyState.svelte';
	import Skeleton from '../ui/Skeleton.svelte';
	import { rightPanelView, uiHelpers } from '$lib/stores/ui';
	import type { PetPanelData } from '$lib/types/Pet';
	import type { JournalEntry } from '$lib/types/JournalEntry';

	let selectedPet: PetPanelData | null = null;
	let selectedPetId: string | null = null;
	let pets: PetPanelData[] = [];
	let currentView: 'dashboard' | 'journal' | 'history' | 'memories' | 'confirmArchive' = 'dashboard';
	let journalInput = '';
	let selectedMood = '';
	let selectedActivity = '';
	let isSubmitting = false;
	let loading = false;

	// Computed values
	$: lastEntry = selectedPet?.journalEntries?.length
		? selectedPet.journalEntries[selectedPet.journalEntries.length - 1]
		: null;

	function formatAge(pet: PetPanelData): string {
		if (!pet || (pet.age === undefined || pet.age === null)) return '';
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
		// Subscribe first so incoming loads propagate into state
		petStore.subscribe((list) => {
			pets = list || [];
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

			// Analyze with AI (non-blocking)
			try {
				await aiAnalysisHelpers.analyzeEntry(selectedPet, entry);
			} catch (error) {
				console.error('AI analysis failed:', error);
			}

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
	{:else if !selectedPet && currentView !== 'memories'}
		<EmptyState
			icon="file-text"
			title="No pet selected"
			description="Select a pet from the left panel to view details, add journal entries, and see AI insights."
			actionText="Add a Pet"
			onAction={() => {
					uiHelpers.openCreatePetForm();
			}}
		/>
	{:else}
	<div class="pet-viewport h-full flex flex-col">
			<!-- Header with pet info and navigation -->
			<div class="viewport-header p-4 border-b" style="border-color: var(--petalytics-border); background: var(--petalytics-overlay);">
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-3">
						{#if selectedPet}
							<img
								src={selectedPet.profileImageUrl || '/images/default-pet.png'}
								alt={selectedPet.name}
								class="w-12 h-12 rounded-full object-cover"
							/>
						{/if}
						<div>
							<h2 class="text-xl font-bold" style="color: var(--petalytics-text);">{selectedPet ? selectedPet.name : 'Memories'}</h2>
							<p class="text-xs" style="color: var(--petalytics-subtle);">{selectedPet ? petSubtitle(selectedPet) : 'Archived memories'}</p>
						</div>
					</div>

					{#if currentView === 'memories'}
						<div class="flex space-x-2">
							<button
								on:click={() => {
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
					{/if}
				</div>
			</div>

			<!-- Content Area -->
			<div class="viewport-content flex-1 p-4 overflow-y-auto">
				{#if currentView === 'confirmArchive'}
					<!-- Confirm Archive View -->
					<div class="space-y-4 font-mono">
						<h3 class="text-lg font-semibold" style="color: var(--petalytics-text);">Archive Pet</h3>
						<p>Mark {selectedPet?.name} as passed away?</p>
						<div class="flex justify-end gap-2">
							<button class="button-secondary" on:click={() => uiHelpers.setView('dashboard')}>Cancel</button>
							<button class="button" on:click={() => {
								if (selectedPet) {
									petHelpers.archive(selectedPet.id);
									if (selectedPetId === selectedPet.id) {
										selectedPetHelpers.clear();
									}
								}
								uiHelpers.setView('dashboard');
							}}>Confirm</button>
						</div>
					</div>
				{:else if currentView === 'memories'}
					<!-- Centralized archived memories view -->
					<div class="space-y-4 font-mono">
						<div class="rounded p-3" style="background: color-mix(in oklab, var(--petalytics-overlay) 60%, transparent); border: 1px solid var(--petalytics-border);">
							<div class="flex items-center justify-between">
								<div>
									<div class="text-base font-semibold" style="color: var(--petalytics-text);">Memories</div>
									<div class="text-xs" style="color: var(--petalytics-subtle);">Archived memories</div>
								</div>
								<div class="text-xs px-2 py-1 rounded" style="background: var(--petalytics-surface); color: var(--petalytics-subtle);">
									{archivedPetsList().length} pets
								</div>
							</div>
						</div>

						{#if archivedPetsList().length === 0}
							<div class="text-sm" style="color: var(--petalytics-subtle);">No archived pets yet.</div>
						{:else}
							{#each archivedPetsList() as ap}
								<div class="rounded border p-3 space-y-2" style="background: var(--petalytics-surface); border-color: var(--petalytics-border);">
									<div class="flex items-center justify-between">
										<div class="font-semibold" style="color: var(--petalytics-text);">In loving memory of {ap.name}</div>
										<div class="text-xs" style="color: var(--petalytics-subtle);">{(ap.journalEntries?.length || 0)} memories</div>
									</div>
									{#if (ap.journalEntries?.length || 0) === 0}
										<div class="text-sm" style="color: var(--petalytics-subtle);">No journal entries.</div>
									{:else}
										<div class="space-y-2">
											{#each [...(ap.journalEntries || [])].slice().reverse() as entry}
												<div class="rounded border p-3" style="background: var(--petalytics-surface); border-color: var(--petalytics-border);">
													<div class="flex items-center justify-between mb-2">
														<div class="text-xs" style="color: var(--petalytics-subtle);">
															{new Date(entry.date as any).toLocaleDateString()} — {ap.name}
														</div>
														<div class="text-sm" style="color: var(--petalytics-text);">{entry.mood || '🐾'}</div>
													</div>
													<div class="text-sm" style="color: var(--petalytics-text);">{entry.content}</div>
												</div>
											{/each}
										</div>
									{/if}
								</div>
							{/each}
						{/if}
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
									AI Insights
								</h3>
								{#if selectedPet.journalEntries.length === 0}
									<p class="text-sm" style="color: var(--petalytics-subtle);">
										Add journal entries to get AI-powered insights about {selectedPet.name}'s
										well-being.
									</p>
								{:else}
									<AIInsightsCard petId={selectedPet.id} entryId={lastEntry?.id} />
								{/if}
							</div>
						</div>
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
									<button
										on:click={() => (currentView = 'dashboard')}
										class="button-secondary"
										disabled={isSubmitting}
									>
										Cancel
									</button>
									<button
										on:click={submitJournalEntry}
										class="button flex items-center space-x-2"
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
									</button>
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
								<button on:click={() => (currentView = 'journal')} class="button">
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
</style>
