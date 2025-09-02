<script lang="ts">
	import { Activity, Calendar } from 'lucide-svelte';
	import type { PetPanelData } from '$lib/types/Pet';
	import { ruixenHelpers } from '$lib/stores/ruixen';

	export let pet: PetPanelData;

	const ws = ruixenHelpers.weeklySummary(pet);
	const tips = ruixenHelpers.speciesInsights(pet);
	const reminders = ruixenHelpers.scheduleReminders(pet);
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
	<div
		class="p-3 rounded border"
		style="background: var(--petalytics-surface); border-color: var(--petalytics-border);"
	>
		<div class="flex items-center mb-2">
			<Activity size={16} class="mr-2" style="color: var(--petalytics-accent);" />
			<span class="font-semibold" style="color: var(--petalytics-text);"
				>ai_insights: weekly_summary</span
			>
		</div>
		<div class="text-sm space-y-1" style="color: var(--petalytics-text);">
			<div class="font-medium">{ws.title}</div>
			<ul class="list-disc pl-4 space-y-1">
				<li>Energy levels: {ws.energy} trend</li>
				<li>Appetite: {ws.appetite}</li>
				<li>Social behavior: {ws.social}</li>
				<li>Recommendation: {ws.recommendation}</li>
			</ul>
		</div>
	</div>

	<div
		class="p-3 rounded border"
		style="background: var(--petalytics-surface); border-color: var(--petalytics-border);"
	>
		<div class="flex items-center mb-2">
			<Calendar size={16} class="mr-2" style="color: var(--petalytics-accent);" />
			<span class="font-semibold" style="color: var(--petalytics-text);"
				>ai_breed_insights & ai_schedule</span
			>
		</div>
		<div class="text-sm space-y-3" style="color: var(--petalytics-text);">
			<div>
				<div class="text-xs mb-1" style="color: var(--petalytics-subtle);">
					ai_breed_insights: {pet.breed || pet.species || 'pet'}
				</div>
				<ul class="list-disc pl-4 space-y-1">
					{#each tips as tip}<li>{tip}</li>{/each}
				</ul>
			</div>
			<div>
				<div class="text-xs mb-1" style="color: var(--petalytics-subtle);">
					ai_schedule: {pet.name} ({pet.breed || pet.species || 'pet'}, {pet.age}{pet.ageUnit ===
					'months'
						? 'm'
						: pet.ageUnit === 'weeks'
							? 'w'
							: 'y'})
				</div>
				<ul class="list-disc pl-4 space-y-1">
					{#each reminders as r}
						<li>
							{r.title}: {r.note}{#if r.due}
								⚠️{/if}
						</li>
					{/each}
				</ul>
			</div>
		</div>
	</div>
</div>
