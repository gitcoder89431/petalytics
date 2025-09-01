<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { ChevronLeft, ChevronRight, User, Key, Settings, CheckCircle, AlertCircle, Terminal } from 'lucide-svelte';
	import { guardianHelpers } from '$lib/stores/guardian.js';
	import { aiAnalysisHelpers } from '$lib/stores/ai-analysis.js';
	import { loadThemePreset, themePresets } from '$lib/stores/theme.js';
	import { uiHelpers } from '$lib/stores/ui';
	import { fetchOpenRouterModels } from '$lib/utils/ai-analysis.js';

	let apiKeyInput = '';
	let prevApiKey = '';
	let apiKeyEl: HTMLInputElement | null = null;
	let guardianName = '';
	// Preferences trimmed to real features; remove unused reminders/notifications.
	let preferences: { aiInsights: boolean } = {
		aiInsights: true,
	};

	let apiKeyStatus = 'unchecked'; // unchecked, checking, valid, invalid
	
	// CLI-style editing states
	let editingField: string | null = null;
	const themeKeys = Object.keys(themePresets) as Array<keyof typeof themePresets>;
	let currentThemeKey: keyof typeof themePresets = 'everforest';
	let themeIndex = 0;

	const displayKey = (k: keyof typeof themePresets) => (k === 'tokyoNight' ? 'tokyo-night' : k);
    
	// OpenRouter model selection (dynamic; fallback list shown until fetched)
	let modelList: string[] = [
		'openai/gpt-oss-20b:free',
		'mistralai/mixtral-8x7b-instruct:free',
		'google/gemma-2-9b-it:free',
		'openchat/openchat-7b:free',
	];
	let currentModelIndex = 0;
	let modelsLoading = false;

	function loadModelFromStorage() {
		const saved = guardianHelpers.load();
		const savedModel = saved?.model as string | undefined;
		if (savedModel) {
			const idx = modelList.indexOf(savedModel);
			currentModelIndex = idx >= 0 ? idx : 0;
		} else {
			currentModelIndex = 0;
		}
	}

	function displayModel() {
		return modelList[currentModelIndex] || modelList[0];
	}

	function persistModel() {
		guardianHelpers.update({ model: displayModel() });
	}

	function cycleModel(dir: 'prev' | 'next') {
		if (dir === 'next') {
			currentModelIndex = modelList.length ? (currentModelIndex + 1) % modelList.length : 0;
		} else {
			currentModelIndex = modelList.length ? (currentModelIndex - 1 + modelList.length) % modelList.length : 0;
		}
		persistModel();
	}

	async function loadModels() {
		if (!apiKeyInput) return;
		modelsLoading = true;
		try {
			const list = await fetchOpenRouterModels(apiKeyInput, true);
			if (Array.isArray(list) && list.length) {
				modelList = list;
				// Re-align index to saved model if present
				const savedModel = guardianHelpers.load()?.model as string | undefined;
				if (savedModel) {
					const idx = modelList.indexOf(savedModel);
					currentModelIndex = idx >= 0 ? idx : 0;
				} else {
					currentModelIndex = 0;
				}
			}
		} catch (e) {
			// Ignore; keep fallback list
		} finally {
			modelsLoading = false;
		}
	}

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

	// Get model selection from guardian storage
	loadModelFromStorage();
	// Fetch model list from OpenRouter if API key is present
	loadModels();
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
		// currently only ai_insights is supported
		(preferences as any)[key] = !(preferences as any)[key];
		saveGuardianInfo();
	}

	function startEdit(field: string) {
		if (field === 'apiKey') {
			// Prepare for paste-first UX: clear input and focus the field
			prevApiKey = apiKeyInput;
			editingField = field;
			apiKeyInput = '';
			// Focus after DOM updates
			tick().then(() => {
				apiKeyEl?.focus();
			});
		} else {
			editingField = field;
		}
	}

	function stopEdit() {
		const field = editingField;
		editingField = null;
		// For apiKey, don't overwrite with empty; restore previous if nothing pasted
		if (field === 'apiKey' && !apiKeyInput.trim()) {
			apiKeyInput = prevApiKey;
		}
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

	// removed handlePreferenceChange; inline save in togglePreference

	// Keyboard activate handler for elements with role="button"
	function handleActivate(e: KeyboardEvent, action: () => void) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			action();
		}
	}
	function abbreviateKey(key: string): string {
		const trimmed = (key || '').trim();
		if (!trimmed) return 'Not set';
		if (trimmed.length <= 16) return trimmed;
		const prefix = trimmed.slice(0, 12);
		const suffix = trimmed.slice(-3);
		return `${prefix}...${suffix}`;
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
						bind:this={apiKeyEl}
						type="text"
						bind:value={apiKeyInput}
						onblur={stopEdit}
						onkeydown={(e) => handleKeydown(e, 'apiKey')}
						class="bg-transparent border-none outline-none w-full text-right input-inline"
						style="color: var(--petalytics-text);"
						placeholder="sk-or-..."
						inputmode="text"
						autocapitalize="off"
						autocorrect="off"
						spellcheck={false}
					/>
				{:else}
					{abbreviateKey(apiKeyInput)}
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

		<!-- Model selection (OpenRouter) -->
		<div class="cli-row px-2 py-1">
			<span class="label" style="color: var(--petalytics-foam);">model</span>
			<span class="value" style="color: var(--petalytics-text);">{displayModel()} {#if modelsLoading}(loading...){/if}</span>
			<div class="ml-2 flex items-center space-x-1">
				<button type="button" class="arrow-btn" onclick={() => cycleModel('prev')} aria-label="Previous model">&lt;</button>
				<button type="button" class="arrow-btn" onclick={() => cycleModel('next')} aria-label="Next model">&gt;</button>
				<button type="button" class="arrow-btn" onclick={loadModels} aria-label="Refresh models">↻</button>
			</div>
		</div>

		<!-- Theme row -->
		<div class="cli-row px-2 py-1">
			<span class="label" style="color: var(--petalytics-foam);">theme</span>
			<span class="value" style="color: var(--petalytics-text);">{displayKey(currentThemeKey)}</span>
			<div class="ml-2 flex items-center space-x-1">
				<button type="button" class="arrow-btn" onclick={() => toggleTheme('prev')} aria-label="Previous theme">&lt;</button>
				<button type="button" class="arrow-btn" onclick={() => toggleTheme('next')} aria-label="Next theme">&gt;</button>
			</div>
		</div>

		<!-- Preferences: only ai_insights -->
		<div class="cli-row px-2 py-1" role="button" tabindex="0" aria-pressed={preferences.aiInsights} onclick={() => togglePreference('aiInsights')} onkeydown={(e) => handleActivate(e, () => togglePreference('aiInsights'))}>
			<span class="label" style="color: var(--petalytics-foam);">ai_insights</span>
			<span class="value" style="color: var(--petalytics-text);">{preferences.aiInsights ? 'enabled' : 'disabled'}</span>
			<span class="ml-2" style="color: {preferences.aiInsights ? 'var(--petalytics-pine)' : 'var(--petalytics-subtle)'};">{preferences.aiInsights ? '●' : '○'}</span>
		</div>

		<!-- Separator line -->
		<div class="my-3">
			<div class="border-t" style="border-color: var(--petalytics-border);"></div>
		</div>

		<!-- Data Manager launcher (opens in right panel) -->
		<div class="cli-row px-2 py-1" role="button" tabindex="0" onclick={() => uiHelpers.setView('dataManager')} onkeydown={(e) => handleActivate(e, () => uiHelpers.setView('dataManager'))}>
			<span class="label" style="color: var(--petalytics-foam);">data_manager</span>
			<span class="value" style="color: var(--petalytics-text);">open</span>
			<ChevronRight size={14} style="color: var(--petalytics-subtle);" class="ml-2" />
		</div>
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
.cli-row[aria-pressed="true"] {
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
