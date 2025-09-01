<script lang="ts">
	import { onMount } from 'svelte';
	import ThemeSelector from '../ui/ThemeSelector.svelte';
	import DataManager from '../ui/DataManager.svelte';
	import { User, Key, Settings, CheckCircle, AlertCircle } from 'lucide-svelte';
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

	onMount(() => {
		// Load saved guardian data
		const saved = guardianHelpers.load();
		if (saved) {
			guardianName = saved.name || '';
			apiKeyInput = saved.apiKey || '';
			preferences = { ...preferences, ...saved.preferences };
		}
	});

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

<div class="panel-container h-full flex flex-col">
	<!-- Panel Header -->
	<div class="panel-header">
		<div class="flex items-center space-x-2">
			<User size={18} style="color: var(--petalytics-accent);" />
			<h2 class="text-lg font-semibold">Guardian Settings</h2>
		</div>
	</div>

	<!-- Panel Content -->
	<div class="panel-content flex-1 p-4 space-y-4 overflow-y-auto">
		<!-- Guardian Info -->
		<div class="section">
			<label
				for="guardian-name"
				class="block text-sm font-medium mb-2"
				style="color: var(--petalytics-subtle);"
			>
				Your Name
			</label>
			<input
				id="guardian-name"
				type="text"
				bind:value={guardianName}
				on:blur={saveGuardianInfo}
				class="input w-full"
				placeholder="Pet Guardian Name"
			/>
		</div>

		<!-- API Key Section -->
		<div class="section">
			<label class="block text-sm font-medium mb-2" style="color: var(--petalytics-subtle);">
				<Key size={16} class="inline mr-1" />
				OpenRouter API Key
			</label>
			<div class="flex space-x-2">
				<input
					type="password"
					bind:value={apiKeyInput}
					on:blur={validateApiKey}
					class="input flex-1"
					placeholder="sk-or-..."
				/>
				<div class="flex items-center">
					{#if apiKeyStatus === 'checking'}
						<div
							class="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"
							style="color: var(--petalytics-subtle);"
						></div>
					{:else if apiKeyStatus === 'valid'}
						<CheckCircle size={16} style="color: var(--petalytics-pine);" />
					{:else if apiKeyStatus === 'invalid'}
						<AlertCircle size={16} style="color: var(--petalytics-love);" />
					{/if}
				</div>
			</div>
			<p class="text-xs mt-1" style="color: var(--petalytics-muted);">
				Required for AI analysis features
			</p>
			{#if apiKeyStatus === 'invalid'}
				<p class="text-xs mt-1" style="color: var(--petalytics-love);">
					Invalid API key. Please check your key and try again.
				</p>
			{/if}
		</div>

		<!-- Theme Selection -->
		<div class="section">
			<label
				for="theme-selector"
				class="block text-sm font-medium mb-2"
				style="color: var(--petalytics-subtle);"
			>
				Theme
			</label>
			<ThemeSelector id="theme-selector" />
		</div>

		<!-- Settings -->
		<div class="section">
			<label class="block text-sm font-medium mb-2" style="color: var(--petalytics-subtle);">
				<Settings size={16} class="inline mr-1" />
				Preferences
			</label>
			<div class="space-y-2">
				<label class="flex items-center space-x-2 cursor-pointer">
					<input
						type="checkbox"
						bind:checked={preferences.dailyReminders}
						on:change={() => handlePreferenceChange('dailyReminders')}
						class="w-4 h-4"
					/>
					<span class="text-sm" style="color: var(--petalytics-text);"> Daily reminders </span>
				</label>
				<label class="flex items-center space-x-2 cursor-pointer">
					<input
						type="checkbox"
						bind:checked={preferences.aiInsights}
						on:change={() => handlePreferenceChange('aiInsights')}
						class="w-4 h-4"
					/>
					<span class="text-sm" style="color: var(--petalytics-text);"> AI insights </span>
				</label>
				<label class="flex items-center space-x-2 cursor-pointer">
					<input
						type="checkbox"
						bind:checked={preferences.notifications}
						on:change={() => handlePreferenceChange('notifications')}
						class="w-4 h-4"
					/>
					<span class="text-sm" style="color: var(--petalytics-text);">
						Browser notifications
					</span>
				</label>
			</div>
		</div>

		<!-- Status Section -->
		<div class="section">
			<div class="text-xs" style="color: var(--petalytics-muted);">
				<div class="flex justify-between">
					<span>API Status:</span>
					<span
						class:text-green-400={apiKeyStatus === 'valid'}
						class:text-red-400={apiKeyStatus === 'invalid'}
						class:text-yellow-400={apiKeyStatus === 'checking'}
					>
						{apiKeyStatus === 'valid'
							? 'Connected'
							: apiKeyStatus === 'invalid'
								? 'Invalid'
								: apiKeyStatus === 'checking'
									? 'Checking...'
									: 'Not set'}
					</span>
				</div>
			</div>
		</div>

		<!-- Data Management Section -->
		<div class="section">
			<div class="flex items-center justify-between mb-2">
				<span class="text-sm font-medium" style="color: var(--petalytics-subtle);"
					>Data Management</span
				>
				<button
					on:click={() => (showDataManager = !showDataManager)}
					class="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
				>
					{showDataManager ? 'Hide' : 'Show'} Export/Import
				</button>
			</div>

			{#if showDataManager}
				<DataManager />
			{/if}
		</div>
	</div>
</div>
