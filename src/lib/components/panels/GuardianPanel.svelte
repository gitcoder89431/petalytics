<script lang="ts">
	import { onMount } from 'svelte';
	import DataManager from '../ui/DataManager.svelte';
	import { ChevronLeft, ChevronRight, User, Key, Settings, CheckCircle, AlertCircle, Terminal } from 'lucide-svelte';
	import { guardianHelpers } from '$lib/stores/guardian.js';
	import { aiAnalysisHelpers } from '$lib/stores/ai-analysis.js';
	import { loadThemePreset, themePresets } from '$lib/stores/theme.js';

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
	const themeKeys = Object.keys(themePresets) as Array<keyof typeof themePresets>;
	let currentThemeKey: keyof typeof themePresets = 'everforest';
	let themeIndex = 0;

	const displayKey = (k: keyof typeof themePresets) => (k === 'tokyoNight' ? 'tokyo-night' : k);

		onMount(() => {
		// Load saved guardian data
		const saved = guardianHelpers.load();
		if (saved) {
			guardianName = saved.name || '';
			apiKeyInput = saved.apiKey || '';
			preferences = { ...preferences, ...saved.preferences };
		}
		
		// Get current theme from localStorage
		const savedTheme = (localStorage.getItem('petalytics-theme') as keyof typeof themePresets) || 'everforest';
		currentThemeKey = themeKeys.includes(savedTheme) ? savedTheme : 'everforest';
		themeIndex = themeKeys.indexOf(currentThemeKey);
	});

	function toggleTheme(direction: 'prev' | 'next') {
		if (direction === 'next') {
			themeIndex = (themeIndex + 1) % themeKeys.length;
		} else {
			themeIndex = (themeIndex - 1 + themeKeys.length) % themeKeys.length;
		}
		currentThemeKey = themeKeys[themeIndex];
		// Apply via store (persists to localStorage and updates CSS vars)
		loadThemePreset(currentThemeKey);
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

	// Keyboard activate handler for elements with role="button"
	function handleActivate(e: KeyboardEvent, action: () => void) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			action();
		}
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
		<div class="cli-row px-2 py-1" role="button" tabindex="0" onclick={() => startEdit('guardian')} onkeydown={(e) => handleActivate(e, () => startEdit('guardian'))}>
			<span class="label" style="color: var(--petalytics-foam);">guardian</span>
			<span class="value" style="color: var(--petalytics-text);">
				{#if editingField === 'guardian'}
					<input
						bind:value={guardianName}
						onblur={stopEdit}
						onkeydown={(e) => handleKeydown(e, 'guardian')}
						class="bg-transparent border-none outline-none w-full text-right input-inline"
						style="color: var(--petalytics-text);"
						placeholder="Pet Guardian Name"
					/>
				{:else}
					{guardianName || 'Not set'}
				{/if}
			</span>
		</div>

		<!-- API Key row -->
		<div class="cli-row px-2 py-1" role="button" tabindex="0" onclick={() => startEdit('apiKey')} onkeydown={(e) => handleActivate(e, () => startEdit('apiKey'))}>
			<span class="label" style="color: var(--petalytics-foam);">api_key</span>
			<span class="value" style="color: var(--petalytics-text);">
				{#if editingField === 'apiKey'}
					<input
						type="password"
						bind:value={apiKeyInput}
						onblur={stopEdit}
						onkeydown={(e) => handleKeydown(e, 'apiKey')}
						class="bg-transparent border-none outline-none w-full text-right input-inline"
						style="color: var(--petalytics-text);"
						placeholder="sk-or-..."
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
		<div class="cli-row px-2 py-1">
			<span class="label" style="color: var(--petalytics-foam);">theme</span>
			<span class="value" style="color: var(--petalytics-text);">
				{displayKey(currentThemeKey)}
			</span>
			<div class="ml-2 flex items-center space-x-1">
				<button type="button" class="arrow-btn" onclick={() => toggleTheme('prev')} aria-label="Previous theme">&lt;</button>
				<button type="button" class="arrow-btn" onclick={() => toggleTheme('next')} aria-label="Next theme">&gt;</button>
			</div>
		</div>

		<!-- Separator line -->
		<div class="my-3">
			<div class="border-t" style="border-color: var(--petalytics-border);"></div>
		</div>

		<!-- Preferences section header -->
		<div class="cli-row px-2 py-1">
			<span style="color: var(--petalytics-subtle);">#</span>
			<span class="ml-2" style="color: var(--petalytics-gold);">preferences</span>
		</div>
		
		<div class="cli-row px-2 py-1" role="button" tabindex="0" aria-pressed={preferences.dailyReminders} onclick={() => togglePreference('dailyReminders')} onkeydown={(e) => handleActivate(e, () => togglePreference('dailyReminders'))}>
			<span class="label" style="color: var(--petalytics-foam);">daily_reminders</span>
			<span class="value" style="color: var(--petalytics-text);">
				{preferences.dailyReminders ? 'enabled' : 'disabled'}
			</span>
			<span class="ml-2" style="color: {preferences.dailyReminders ? 'var(--petalytics-pine)' : 'var(--petalytics-subtle)'};">
				{preferences.dailyReminders ? '●' : '○'}
			</span>
		</div>

		<div class="cli-row px-2 py-1" role="button" tabindex="0" aria-pressed={preferences.aiInsights} onclick={() => togglePreference('aiInsights')} onkeydown={(e) => handleActivate(e, () => togglePreference('aiInsights'))}>
			<span class="label" style="color: var(--petalytics-foam);">ai_insights</span>
			<span class="value" style="color: var(--petalytics-text);">
				{preferences.aiInsights ? 'enabled' : 'disabled'}
			</span>
			<span class="ml-2" style="color: {preferences.aiInsights ? 'var(--petalytics-pine)' : 'var(--petalytics-subtle)'};">
				{preferences.aiInsights ? '●' : '○'}
			</span>
		</div>

		<div class="cli-row px-2 py-1" role="button" tabindex="0" aria-pressed={preferences.notifications} onclick={() => togglePreference('notifications')} onkeydown={(e) => handleActivate(e, () => togglePreference('notifications'))}>
			<span class="label" style="color: var(--petalytics-foam);">notifications</span>
			<span class="value" style="color: var(--petalytics-text);">
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
		<div class="cli-row px-2 py-1">
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
		<div class="cli-row px-2 py-1" role="button" tabindex="0" aria-expanded={showDataManager} onclick={() => showDataManager = !showDataManager} onkeydown={(e) => handleActivate(e, () => (showDataManager = !showDataManager))}>
			<span class="label" style="color: var(--petalytics-foam);">data_manager</span>
			<span class="value" style="color: var(--petalytics-text);">
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

<style>
/* Alacritty-inspired interactive rows */
.cli-row {
	display: flex;
	align-items: center;
	border: 1px solid transparent;
	border-radius: 6px;
	transition: background 140ms ease, border-color 140ms ease, box-shadow 140ms ease;
}
.cli-row[role="button"] {
	cursor: pointer;
}
.cli-row:hover {
	background: var(--petalytics-highlight-low);
	border-color: var(--petalytics-border);
}
.cli-row:focus-within,
.cli-row[role="button"]:focus-visible {
	outline: none;
	background: var(--petalytics-highlight-med);
	border-color: var(--petalytics-accent);
	box-shadow: 0 0 0 2px color-mix(in oklab, var(--petalytics-accent) 40%, transparent);
}
.cli-row[aria-pressed="true"],
.cli-row[aria-expanded="true"] {
	background: var(--petalytics-highlight-high);
	border-color: var(--petalytics-accent);
}
.label {
	color: var(--petalytics-foam);
}
.value {
	margin-left: auto;
	text-align: right;
	flex: 1 1 auto;
}
.input-inline {
	padding: 0;
}
.arrow-btn {
	font-family: 'JetBrains Mono', monospace;
	font-size: 0.85rem;
	line-height: 1rem;
	background: transparent;
	border: 1px solid var(--petalytics-border);
	color: var(--petalytics-subtle);
	padding: 0.15rem 0.4rem;
	border-radius: 4px;
	cursor: pointer;
}
.arrow-btn:hover {
	background: var(--petalytics-highlight-low);
	color: var(--petalytics-text);
}
.arrow-btn:focus-visible {
	outline: none;
	border-color: var(--petalytics-accent);
	box-shadow: 0 0 0 2px color-mix(in oklab, var(--petalytics-accent) 35%, transparent);
}
</style>
