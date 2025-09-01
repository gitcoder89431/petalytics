<script lang="ts">
	export let count = 3;
	export let height = 'h-16';
	export let showAvatar = false;
</script>

<div class="space-y-3">
	{#each Array(count) as _}
		<div class="animate-pulse">
			<div class="flex items-start space-x-3">
				{#if showAvatar}
					<div class="w-10 h-10 rounded-full" style="background: var(--petalytics-overlay);"></div>
				{/if}
				<div class="flex-1 space-y-2">
					<div class="h-4 rounded" style="background: var(--petalytics-overlay); width: 75%;"></div>
					<div class="h-3 rounded" style="background: var(--petalytics-overlay); width: 50%;"></div>
					{#if height === 'h-16'}
						<div class="h-3 rounded" style="background: var(--petalytics-overlay); width: 60%;"></div>
					{/if}
				</div>
			</div>
		</div>
	{/each}
</div>
