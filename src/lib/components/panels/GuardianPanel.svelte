<script lang="ts">
	import { onMount } from 'svelte';
	import ThemeSelector from '../ui/ThemeSelector.svelte';
	import DataManager from '../ui/DataManager.svelte';
	import { ChevronLeft, ChevronRight, User, Key, Settings, CheckCircle, AlertCircle, Terminal } from 'lucide-svelte';
	import { guardianHelpers } from '$lib/stores/guardian.js';
	import { aiAnalysisHelpers } from '$lib/stores/ai-analysis.js';

	let apiKeyInput = '';
	let guardianName = '';
	let preferences = {
		dailyReminders: false,
		aiInsights: true,
		notifications: true,
	};

	let apiKeyStatus = 'unchecked'; // unchecked, checking, valid, invalid
	let showDataManager = false;
	
	// CLI-style editing states
	let editingField: string | null = null;
	let themes = ['everforest', 'gruvbox', 'tokyo-night', 'nord'];
	let currentTheme = 'everforest';
	let themeIndex = 0;

	onMount(() => {
		// Load saved guardian data
		const saved = guardianHelpers.load();
		if (saved) {
			guardianName = saved.name || '';
			apiKeyInput = saved.apiKey || '';
			preferences = { ...preferences, ...saved.preferences };
		}
		
		// Get current theme from document
		const savedTheme = localStorage.getItem('petalytics-theme') || 'everforest';
		currentTheme = savedTheme;
		themeIndex = themes.indexOf(savedTheme);
	});

	function toggleTheme(direction: 'prev' | 'next') {
		if (direction === 'next') {
			themeIndex = (themeIndex + 1) % themes.length;
		} else {
			themeIndex = (themeIndex - 1 + themes.length) % themes.length;
		}
		currentTheme = themes[themeIndex];
		
		// Apply theme
		document.documentElement.className = currentTheme;
		localStorage.setItem('petalytics-theme', currentTheme);
	}

	function togglePreference(key: keyof typeof preferences) {
		preferences[key] = !preferences[key];
		handlePreferenceChange(key);
	}

	function startEdit(field: string) {
		editingField = field;
	}

	function stopEdit() {
		const field = editingField;
		editingField = null;
		saveGuardianInfo();
		if (field === 'apiKey') {
			validateApiKey();
		}
	}

	function handleKeydown(event: KeyboardEvent, field: string) {
		if (event.key === 'Enter') {
			stopEdit();
		} else if (event.key === 'Escape') {
			editingField = null;
		}
	}

	async function validateApiKey() {
		if (!apiKeyInput.trim()) {
			apiKeyStatus = 'unchecked';
			return;
		}

		apiKeyStatus = 'checking';

		try {
			// First try the AI analysis helper for more direct validation
			const isValid = await aiAnalysisHelpers.testConnection();
			if (isValid) {
				apiKeyStatus = 'valid';
				guardianHelpers.updateApiKey(apiKeyInput);
			} else {
				// Fallback to backend validation if direct test fails
				const response = await fetch('/api/ai/validate', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ apiKey: apiKeyInput }),
				});

				if (response.ok) {
					apiKeyStatus = 'valid';
					guardianHelpers.updateApiKey(apiKeyInput);
				} else {
					apiKeyStatus = 'invalid';
				}
			}
		} catch (error) {
			apiKeyStatus = 'invalid';
		}
	}

	function saveGuardianInfo() {
		guardianHelpers.update({
			name: guardianName,
			apiKey: apiKeyInput,
			preferences: preferences,
		});
	}

	function handlePreferenceChange(key: keyof typeof preferences) {
		preferences[key] = !preferences[key];
		saveGuardianInfo();
	}
</script>

<div class="guardian-panel h-full" style="background: var(--petalytics-bg);">
	<!-- CLI-style header -->
	<div class="cli-header p-3 border-b font-mono text-sm" style="border-color: var(--petalytics-border); background: var(--petalytics-surface);">
		<div class="flex items-center space-x-2" style="color: var(--petalytics-pine);">
			<Terminal size={14} />
			<span>guardian@petalytics:~$</span>
		</div>
	</div>

	<div class="cli-content p-3 font-mono text-sm overflow-y-auto" style="color: var(--petalytics-text);">
		
		<!-- Guardian name row -->
		<div class="cli-row flex items-center hover:bg-gray-800/20 px-2 py-1 rounded transition-colors cursor-pointer" on:click={() => startEdit('guardian')}>
			<span style="color: var(--petalytics-subtle);">></span>
			<span style="color: var(--petalytics-foam);">guardian</span>
			<span class="flex-1 text-right" style="color: var(--petalytics-text);">
				{#if editingField === 'guardian'}
					<input
						bind:value={guardianName}
						on:blur={stopEdit}
						on:keydown={(e) => handleKeydown(e, 'guardian')}
						class="bg-transparent border-none outline-none w-full text-right"
						style="color: var(--petalytics-text);"
						placeholder="Pet Guardian Name"
						autofocus
					/>
				{:else}
					{guardianName || 'Not set'}
				{/if}
			</span>
		</div>

		<!-- API Key row -->
		<div class="cli-row flex items-center hover:bg-gray-800/20 px-2 py-1 rounded transition-colors cursor-pointer" on:click={() => startEdit('apiKey')}>
			<span style="color: var(--petalytics-subtle);">></span>
			<span style="color: var(--petalytics-foam);">api_key</span>
			<span class="flex-1 text-right" style="color: var(--petalytics-text);">
				{#if editingField === 'apiKey'}
					<input
						type="password"
						bind:value={apiKeyInput}
						on:blur={stopEdit}
						on:keydown={(e) => handleKeydown(e, 'apiKey')}
						class="bg-transparent border-none outline-none w-full text-right"
						style="color: var(--petalytics-text);"
						placeholder="sk-or-..."
						autofocus
					/>
				{:else}
					{apiKeyInput ? `${apiKeyInput.slice(0, 8)}****` : 'Not set'}
				{/if}
			</span>
			<span class="ml-2">
				{#if apiKeyStatus === 'checking'}
					<span style="color: var(--petalytics-gold);">●</span>
				{:else if apiKeyStatus === 'valid'}
					<span style="color: var(--petalytics-pine);">●</span>
				{:else if apiKeyStatus === 'invalid'}
					<span style="color: var(--petalytics-love);">●</span>
				{:else}
					<span style="color: var(--petalytics-subtle);">○</span>
				{/if}
			</span>
		</div>

		<!-- Theme row -->
		<div class="cli-row flex items-center hover:bg-gray-800/20 px-2 py-1 rounded transition-colors">
			<span style="color: var(--petalytics-subtle);">></span>
			<span style="color: var(--petalytics-foam);">theme</span>
			<span class="flex-1 text-right" style="color: var(--petalytics-text);">
				{currentTheme}
			</span>
			<div class="ml-2 flex items-center space-x-1">
				<button on:click={() => toggleTheme('prev')} class="hover:opacity-70">
					<ChevronLeft size={14} style="color: var(--petalytics-subtle);" />
				</button>
				<button on:click={() => toggleTheme('next')} class="hover:opacity-70">
					<ChevronRight size={14} style="color: var(--petalytics-subtle);" />
				</button>
			</div>
		</div>

		<!-- Separator line -->
		<div class="my-3">
			<div class="border-t" style="border-color: var(--petalytics-border);"></div>
		</div>

		<!-- Preferences section header -->
		<div class="cli-row flex items-center px-2 py-1">
			<span style="color: var(--petalytics-subtle);">#</span>
			<span class="ml-2" style="color: var(--petalytics-gold);">preferences</span>
		</div>
		
		<div class="cli-row flex items-center hover:bg-gray-800/20 px-2 py-1 rounded transition-colors cursor-pointer" on:click={() => togglePreference('dailyReminders')}>
			<span style="color: var(--petalytics-subtle);">></span>
			<span style="color: var(--petalytics-foam);">daily_reminders</span>
			<span class="flex-1 text-right" style="color: var(--petalytics-text);">
				{preferences.dailyReminders ? 'enabled' : 'disabled'}
			</span>
			<span class="ml-2" style="color: {preferences.dailyReminders ? 'var(--petalytics-pine)' : 'var(--petalytics-subtle)'};">
				{preferences.dailyReminders ? '●' : '○'}
			</span>
		</div>

		<div class="cli-row flex items-center hover:bg-gray-800/20 px-2 py-1 rounded transition-colors cursor-pointer" on:click={() => togglePreference('aiInsights')}>
			<span style="color: var(--petalytics-subtle);">></span>
			<span style="color: var(--petalytics-foam);">ai_insights</span>
			<span class="flex-1 text-right" style="color: var(--petalytics-text);">
				{preferences.aiInsights ? 'enabled' : 'disabled'}
			</span>
			<span class="ml-2" style="color: {preferences.aiInsights ? 'var(--petalytics-pine)' : 'var(--petalytics-subtle)'};">
				{preferences.aiInsights ? '●' : '○'}
			</span>
		</div>

		<div class="cli-row flex items-center hover:bg-gray-800/20 px-2 py-1 rounded transition-colors cursor-pointer" on:click={() => togglePreference('notifications')}>
			<span style="color: var(--petalytics-subtle);">></span>
			<span style="color: var(--petalytics-foam);">notifications</span>
			<span class="flex-1 text-right" style="color: var(--petalytics-text);">
				{preferences.notifications ? 'enabled' : 'disabled'}
			</span>
			<span class="ml-2" style="color: {preferences.notifications ? 'var(--petalytics-pine)' : 'var(--petalytics-subtle)'};">
				{preferences.notifications ? '●' : '○'}
			</span>
		</div>

		<!-- Separator line -->
		<div class="my-3">
			<div class="border-t" style="border-color: var(--petalytics-border);"></div>
		</div>

		<!-- Status section header -->
		<div class="cli-row flex items-center px-2 py-1">
			<span style="color: var(--petalytics-subtle);">#</span>
			<span class="ml-2" style="color: var(--petalytics-gold);">status</span>
		</div>
		
		<div class="cli-row flex items-center px-2 py-1">
			<span style="color: var(--petalytics-subtle);">></span>
			<span style="color: var(--petalytics-foam);">api_status</span>
			<span class="flex-1 text-right" style="color: {apiKeyStatus === 'valid' ? 'var(--petalytics-pine)' : apiKeyStatus === 'invalid' ? 'var(--petalytics-love)' : 'var(--petalytics-gold)'};">
				{apiKeyStatus === 'valid' ? 'connected' : apiKeyStatus === 'invalid' ? 'invalid' : apiKeyStatus === 'checking' ? 'checking...' : 'not_set'}
			</span>
		</div>

		<!-- Data management toggle -->
		<div class="cli-row flex items-center hover:bg-gray-800/20 px-2 py-1 rounded transition-colors cursor-pointer" on:click={() => showDataManager = !showDataManager}>
			<span style="color: var(--petalytics-subtle);">></span>
			<span style="color: var(--petalytics-foam);">data_manager</span>
			<span class="flex-1 text-right" style="color: var(--petalytics-text);">
				{showDataManager ? 'show' : 'hidden'}
			</span>
			<ChevronRight 
				size={14} 
				style="color: var(--petalytics-subtle); transform: {showDataManager ? 'rotate(90deg)' : 'rotate(0deg)'}; transition: transform 0.2s;" 
				class="ml-2"
			/>
		</div>

		{#if showDataManager}
			<div class="mt-2 p-2 rounded" style="background: var(--petalytics-overlay);">
				<DataManager />
			</div>
		{/if}
	</div>
</div>
