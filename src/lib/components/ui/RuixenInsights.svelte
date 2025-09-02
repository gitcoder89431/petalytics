<script lang="ts">
	import { Activity, Calendar } from 'lucide-svelte';
	import type { PetPanelData } from '$lib/types/Pet';
	import { ruixenHelpers } from '$lib/stores/ruixen';

	export let pet: PetPanelData;

	let ws = ruixenHelpers.weeklySummary(pet);
	let tips = ruixenHelpers.speciesInsights(pet);
	let reminders = ruixenHelpers.scheduleReminders(pet);

	$: if (pet) {
		ws = ruixenHelpers.weeklySummary(pet);
		tips = ruixenHelpers.speciesInsights(pet);
		reminders = ruixenHelpers.scheduleReminders(pet);
	}
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
	<div
		class="p-3 rounded border"
		style="background: var(--petalytics-surface); border-color: var(--petalytics-border);"
	>
		<div class="flex items-center mb-2">
			<Activity size={16} class="mr-2" style="color: var(--petalytics-accent);" />
			<span
				class="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border"
				style="border-color: var(--petalytics-accent); color: var(--petalytics-accent);"
			>
				weekly
			</span>
			<span class="ml-2 font-semibold" style="color: var(--petalytics-text);">{ws.title}</span>
		</div>
		<div class="text-sm space-y-1" style="color: var(--petalytics-text);">
			<ul class="pl-4 space-y-1" style="list-style: disc;">
				<li><span class="opacity-70">Energy:</span> {ws.energy} trend</li>
				<li><span class="opacity-70">Appetite:</span> {ws.appetite}</li>
				<li><span class="opacity-70">Social:</span> {ws.social}</li>
				<li><span class="opacity-70">Recommendation:</span> {ws.recommendation}</li>
			</ul>
		</div>
	</div>

	<div
		class="p-3 rounded border"
		style="background: var(--petalytics-surface); border-color: var(--petalytics-border);"
	>
		<div class="flex items-center mb-2">
			<Calendar size={16} class="mr-2" style="color: var(--petalytics-accent);" />
			<span
				class="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border"
				style="border-color: var(--petalytics-accent); color: var(--petalytics-accent);"
			>
				breed
			</span>
			<span class="mx-2 text-[10px] opacity-60">•</span>
			<span
				class="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border"
				style="border-color: var(--petalytics-accent); color: var(--petalytics-accent);"
			>
				schedule
			</span>
		</div>
		<div class="text-sm space-y-3" style="color: var(--petalytics-text);">
			<div>
				<div class="text-xs mb-1" style="color: var(--petalytics-subtle);">
					{pet.breed || pet.species || 'pet'} insights
				</div>
				<ul class="pl-4 space-y-1" style="list-style: disc;">
					{#each tips as tip}
						<li>{tip}</li>
					{/each}
				</ul>
			</div>
			<div>
				<div class="text-xs mb-1" style="color: var(--petalytics-subtle);">
					{pet.name} ({pet.breed || pet.species || 'pet'}, {pet.age}{pet.ageUnit === 'months'
						? 'm'
						: pet.ageUnit === 'weeks'
							? 'w'
							: 'y'}) schedule
				</div>
				<ul class="pl-4 space-y-1" style="list-style: disc;">
					{#each reminders as r}
						<li>
							<span class="font-medium">{r.title}</span>: {r.note}
							{#if r.due}
								<span
									class="ml-2 align-middle text-[10px] uppercase tracking-wide px-1 py-0.5 rounded border"
									style="border-color: var(--petalytics-accent); color: var(--petalytics-accent);"
								>
									due
								</span>
							{/if}
						</li>
					{/each}
				</ul>
			</div>
		</div>
	</div>
</div>
