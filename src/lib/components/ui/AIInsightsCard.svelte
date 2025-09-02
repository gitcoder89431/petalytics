<script lang="ts">
	import { Brain, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-svelte';
	import { aiAnalysisHelpers } from '$lib/stores/ai-analysis';
	import type { AnalysisResult } from '$lib/utils/ai-analysis';

	export let entryId = '';
	export let petId = '';
	export let compact = false;

	let analysis: AnalysisResult | null = null;

	$: if (entryId) {
		analysis = aiAnalysisHelpers.getAnalysis(entryId);
	}
</script>

{#if analysis}
	<div class="ai-insights" class:compact data-pet-id={petId}>
		{#if !compact}
			<div class="flex items-center space-x-2 mb-3">
				<Brain size={16} style="color: var(--petalytics-accent);" />
				<span class="font-medium text-sm" style="color: var(--petalytics-text);"
					>AI Analysis • Ruixen</span
				>
			</div>
		{/if}

		<div class="space-y-2">
			<p class="text-sm" style="color: var(--petalytics-text);">
				{analysis.summary}
			</p>

			{#if analysis.healthConcerns && analysis.healthConcerns.length > 0}
				<div class="concerns">
					<div class="flex items-center space-x-1 mb-1">
						<AlertTriangle size={12} style="color: var(--petalytics-love);" />
						<span class="text-xs font-medium" style="color: var(--petalytics-love);"
							>Health Concerns</span
						>
					</div>
					<ul class="text-xs space-y-1" style="color: var(--petalytics-text);">
						{#each analysis.healthConcerns as concern}
							<li>• {concern}</li>
						{/each}
					</ul>
				</div>
			{/if}

			{#if analysis.recommendations && analysis.recommendations.length > 0}
				<div class="recommendations">
					<div class="flex items-center space-x-1 mb-1">
						<CheckCircle size={12} style="color: var(--petalytics-pine);" />
						<span class="text-xs font-medium" style="color: var(--petalytics-pine);"
							>Recommendations</span
						>
					</div>
					<ul class="text-xs space-y-1" style="color: var(--petalytics-text);">
						{#each analysis.recommendations as rec}
							<li>• {rec}</li>
						{/each}
					</ul>
				</div>
			{/if}

			{#if !compact && analysis.moodTrend}
				<div class="trend-info flex items-center justify-between text-xs">
					<span style="color: var(--petalytics-subtle);">Mood Trend:</span>
					<span class="flex items-center space-x-1">
						<TrendingUp size={12} style="color: var(--petalytics-accent);" />
						<span
							style="color: var(--petalytics-text);"
							class:text-green-400={analysis.moodTrend === 'improving'}
							class:text-yellow-400={analysis.moodTrend === 'stable'}
							class:text-red-400={analysis.moodTrend === 'concerning'}
						>
							{analysis.moodTrend}
						</span>
					</span>
				</div>
			{/if}
		</div>
	</div>
{:else}
	<div class="no-analysis text-xs" style="color: var(--petalytics-muted);" data-pet-id={petId}>
		AI analysis pending...
	</div>
{/if}

<style>
	.compact {
		font-size: 0.75rem;
	}
</style>
