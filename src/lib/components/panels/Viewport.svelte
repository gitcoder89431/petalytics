<script>
	import { onMount } from 'svelte';
	import { selectedPetStore, petHelpers, selectedPetHelpers } from '$lib/stores/pets';
	import { aiAnalysisHelpers, isAnalyzing } from '$lib/stores/ai-analysis';
	import { PenTool, Brain, Calendar, Heart, Activity } from 'lucide-svelte';
	import AIInsightsCard from '../ui/AIInsightsCard.svelte';

	let selectedPet = null;
	let currentView = 'dashboard'; // dashboard, journal, history
	let journalInput = '';
	let selectedMood = '';
	let selectedActivity = '';
	let isSubmitting = false;

	onMount(() => {
		// Load pets and selected pet from storage
		petHelpers.load();
		selectedPetHelpers.load();

		selectedPetStore.subscribe((petId) => {
			selectedPet = petId ? petHelpers.getPet(petId) : null;
		});
	});

	async function submitJournalEntry() {
		if (!journalInput.trim() || !selectedPet) return;

		isSubmitting = true;

		try {
			const entry = {
				id: Date.now().toString(),
				petId: selectedPet.id,
				content: journalInput.trim(),
				date: new Date().toISOString(),
				mood: selectedMood || 'unknown',
				activityLevel: selectedActivity || 'normal',
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
			currentView = 'dashboard';

			// Refresh selected pet data
			selectedPet = petHelpers.getPet(selectedPet.id);
		} catch (error) {
			console.error('Error submitting entry:', error);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="viewport-container h-full flex flex-col">
	{#if !selectedPet}
		<!-- Welcome Screen -->
		<div class="welcome-screen h-full flex items-center justify-center p-8">
			<div class="text-center max-w-lg">
				<div
					class="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center"
				>
					<Heart size={40} class="text-white" />
				</div>
				<h2 class="text-2xl font-bold mb-4" style="color: var(--petalytics-text);">
					Welcome to Petalytics
				</h2>
				<p class="text-lg mb-6" style="color: var(--petalytics-subtle);">
					Select a pet to start journaling and get AI-powered insights about their well-being.
				</p>
			</div>
		</div>
	{:else}
		<!-- Pet Dashboard -->
		<div class="pet-viewport h-full flex flex-col">
			<!-- Header with pet info and navigation -->
			<div class="viewport-header p-4 border-b" style="border-color: var(--petalytics-border);">
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-3">
						<img
							src={selectedPet.profileImageUrl || '/images/default-pet.png'}
							alt={selectedPet.name}
							class="w-12 h-12 rounded-full object-cover"
						/>
						<div>
							<h2 class="text-xl font-bold" style="color: var(--petalytics-text);">
								{selectedPet.name}
							</h2>
							<p class="text-sm" style="color: var(--petalytics-subtle);">
								{selectedPet.age} year old {selectedPet.breed}
							</p>
						</div>
					</div>

					<div class="flex space-x-2">
						<button
							on:click={() => (currentView = 'dashboard')}
							class="nav-button px-3 py-1 rounded-md text-sm"
							class:active={currentView === 'dashboard'}
						>
							Dashboard
						</button>
						<button
							on:click={() => (currentView = 'journal')}
							class="nav-button px-3 py-1 rounded-md text-sm"
							class:active={currentView === 'journal'}
						>
							New Entry
						</button>
						<button
							on:click={() => (currentView = 'history')}
							class="nav-button px-3 py-1 rounded-md text-sm"
							class:active={currentView === 'history'}
						>
							History
						</button>
					</div>
				</div>
			</div>

			<!-- Content Area -->
			<div class="viewport-content flex-1 p-4 overflow-y-auto">
				{#if currentView === 'dashboard'}
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
									{selectedPet.age}
								</div>
								<div class="text-xs" style="color: var(--petalytics-subtle);">Years Old</div>
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
								<div class="text-2xl font-bold" style="color: var(--petalytics-accent);">
									{selectedPet.breed}
								</div>
								<div class="text-xs" style="color: var(--petalytics-subtle);">Breed</div>
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
									<AIInsightsCard petId={selectedPet.id} />
								{/if}
							</div>
						</div>
					</div>
				{:else if currentView === 'journal'}
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
											<option value="sick">🤒 Unwell</option>
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
				{:else if currentView === 'history'}
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

	.nav-button.active {
		background: var(--petalytics-accent);
		color: var(--petalytics-bg);
	}

	.nav-button:hover:not(.active) {
		opacity: 0.8;
	}
</style>
