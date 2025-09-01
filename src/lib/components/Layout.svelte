<script lang="ts">
	import { onMount } from 'svelte';
	import { cssVariables } from '$lib/stores/theme.js';
	import GuardianPanel from './panels/GuardianPanel.svelte';
	import PetPanel from './panels/PetPanel.svelte';
	import Viewport from './panels/Viewport.svelte';

	let layoutRef: HTMLDivElement;

	onMount(() => {
		// Apply theme variables to layout (from omarchy-theme-builder)
		cssVariables.subscribe((variables) => {
			if (layoutRef) {
				Object.entries(variables).forEach(([key, value]) => {
					layoutRef.style.setProperty(key, value);
				});
			}
		});
	});
</script>

<div
	bind:this={layoutRef}
	class="layout-container w-screen h-screen overflow-hidden relative"
	style="font-family: 'Inter', sans-serif;"
>
	<!-- Background (adapted from omarchy-theme-builder) -->
	<div class="layout-background absolute inset-0">
		<div
			class="absolute inset-0"
			style="
        background: linear-gradient(135deg, var(--petalytics-bg) 0%, var(--petalytics-surface) 100%);
      "
		></div>
		<!-- Subtle pattern overlay -->
		<div
			class="absolute inset-0 opacity-5"
			style="background-image: repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px);"
		></div>
	</div>

	<!-- Top Bar -->
	<div
		class="top-bar h-12 flex items-center justify-between px-6 border-b relative z-20"
		style="
      background: var(--petalytics-surface);
      border-color: var(--petalytics-border);
      color: var(--petalytics-text);
    "
	>
		<div class="flex items-center space-x-3">
			<div
				class="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center"
			>
				<span class="text-white font-bold text-sm">🐾</span>
			</div>
			<h1 class="text-lg font-semibold" style="color: var(--petalytics-text);">Petalytics</h1>
		</div>

		<div class="text-sm" style="color: var(--petalytics-subtle);">Pet Journal & AI Insights</div>
	</div>

	<!-- Main 3-Panel Layout -->
	<div class="main-layout flex h-full gap-4 p-4 relative z-10" style="height: calc(100vh - 3rem);">
		<!-- Left Column: Stacked Panels -->
		<div class="left-column flex flex-col gap-4 w-1/2 lg:w-2/5">
			<div class="guardian-panel flex-1 frosted-panel">
				<GuardianPanel />
			</div>
			<div class="pet-panel flex-1 frosted-panel">
				<PetPanel />
			</div>
		</div>

		<!-- Right Column: Main Viewport -->
		<div class="viewport-column flex-1 frosted-panel">
			<Viewport />
		</div>
	</div>
</div>

<style>
	.frosted-panel {
		background: var(--petalytics-surface);
		border: 1px solid var(--petalytics-border);
		border-radius: 12px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
		overflow: hidden;
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
	}

	.left-column {
		min-height: 0;
	}

	.left-column .guardian-panel,
	.left-column .pet-panel {
		min-height: 45%;
		max-height: 55%;
	}

	@media (max-width: 768px) {
		.main-layout {
			flex-direction: column;
			gap: 16px;
		}
		.left-column {
			width: 100%;
			flex-direction: row;
			height: 40%;
			gap: 16px;
		}
		.viewport-column {
			width: 100%;
			height: 60%;
		}
	}
</style>
