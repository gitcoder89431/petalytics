<script lang="ts">
	import { onMount } from 'svelte';
	import { cssVariables } from '$lib/stores/theme.js';
	import GuardianPanel from './panels/GuardianPanel.svelte';
	import PetPanel from './panels/PetPanel.svelte';
	import Viewport from './panels/Viewport.svelte';

	let layoutRef: HTMLDivElement;
	let currentTime = '';

	function updateTime() {
		const now = new Date();
		const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		const dayName = days[now.getDay()];
		const hours = now.getHours().toString().padStart(2, '0');
		const minutes = now.getMinutes().toString().padStart(2, '0');
		currentTime = `${dayName} ${hours}:${minutes}`;
	}

	onMount(() => {
		// Apply theme variables to layout
		cssVariables.subscribe((variables) => {
			if (layoutRef) {
				Object.entries(variables).forEach(([key, value]) => {
					layoutRef.style.setProperty(key, value);
				});
			}
		});

		// Update time immediately and then every second
		updateTime();
		const timeInterval = setInterval(updateTime, 1000);

		return () => {
			clearInterval(timeInterval);
		};
	});
</script>

<div
	bind:this={layoutRef}
	class="desktop-container w-screen h-screen overflow-hidden relative"
	style="font-family: 'JetBrains Mono', 'SF Mono', 'Cascadia Code', monospace;"
>
	<!-- Desktop Background -->
	<div class="desktop-background absolute inset-0">
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

	<!-- Top Bar (Waybar-style) -->
	<div
		class="top-bar h-8 flex items-center justify-between px-4 text-xs border-b frosted-glass relative z-20"
		style="
      background: rgba(31, 29, 46, 0.8);
      border-color: var(--petalytics-border);
      color: var(--petalytics-text);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    "
	>
		<!-- Left: Workspaces / Logo -->
		<div class="flex items-center space-x-4">
			<div
				class="px-2 h-5 flex items-center justify-center text-xs font-mono"
				style="background: var(--petalytics-pine); color: var(--petalytics-bg);"
			>
				🐾
			</div>
			<span class="font-mono" style="color: var(--petalytics-foam);">petalytics@desktop</span>
		</div>

		<!-- Center: Current Time -->
		<div class="font-mono font-medium" style="color: var(--petalytics-subtle);">
			{currentTime}
		</div>

		<!-- Right: System Status -->
		<div class="flex items-center space-x-3 text-xs font-mono">
			<div class="flex items-center space-x-1">
				<span style="color: var(--petalytics-foam);">●</span>
				<span style="color: var(--petalytics-subtle);">journal</span>
			</div>
			<div class="flex items-center space-x-1">
				<span style="color: var(--petalytics-gold);">●</span>
				<span style="color: var(--petalytics-subtle);">ai</span>
			</div>
		</div>
	</div>

	<!-- Main Layout -->
	<div
		class="main-layout flex h-full gap-2 p-2 relative z-10"
		style="height: calc(100vh - 2rem);"
	>
		<!-- Left Column: Stacked Panels -->
		<div class="left-column flex flex-col gap-2 flex-1">
			<!-- Guardian Panel -->
			<div class="guardian-panel flex-1 frosted-panel">
				<GuardianPanel />
			</div>
			<!-- Pet Panel -->
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
		background: rgba(25, 23, 36, 0.9);
		border: 1px solid rgba(38, 35, 58, 0.5);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border-radius: 0;
		overflow: hidden;
	}

	.left-column {
		min-height: 0;
		width: 400px;
		flex-shrink: 0;
	}

	.left-column .guardian-panel,
	.left-column .pet-panel {
		min-height: 45%;
		max-height: 55%;
	}

	.viewport-column {
		flex: 1;
		min-width: 0;
	}

	@media (max-width: 768px) {
		.main-layout {
			flex-direction: column;
			gap: 8px;
		}
		.left-column {
			width: 100%;
			flex-direction: row;
			height: 40%;
			gap: 8px;
		}
		.viewport-column {
			height: 60%;
		}
	}
</style>
