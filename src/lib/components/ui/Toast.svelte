<script lang="ts">
	import { toasts, toast, type Toast } from '$lib/stores/toast';
	import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-svelte';
	import { fly } from 'svelte/transition';

	let toastList: Toast[] = [];

	toasts.subscribe((value) => {
		toastList = value;
	});

	const icons = {
		success: CheckCircle,
		error: AlertCircle,
		warning: AlertTriangle,
		info: Info,
	};

	const colors = {
		success: 'var(--petalytics-pine)',
		error: 'var(--petalytics-love)',
		warning: 'var(--petalytics-gold)',
		info: 'var(--petalytics-iris)',
	};
</script>

<div class="toast-container fixed top-4 right-4 z-50 space-y-2 w-80">
	{#each toastList as toastItem (toastItem.id)}
		<div
			class="toast-item p-4 rounded-lg shadow-lg border flex items-start space-x-3"
			style="background: var(--petalytics-surface); border-color: var(--petalytics-border);"
			transition:fly={{ x: 300, duration: 300 }}
		>
			<div class="flex-shrink-0">
				{#if toastItem.type}
					{@const IconComponent = icons[toastItem.type]}
					<IconComponent size={20} style="color: {colors[toastItem.type]};" />
				{/if}
			</div>

			<div class="flex-1 min-w-0">
				<p class="text-sm font-medium" style="color: var(--petalytics-text);">
					{toastItem.title}
				</p>
				{#if toastItem.message}
					<p class="text-xs mt-1" style="color: var(--petalytics-subtle);">
						{toastItem.message}
					</p>
				{/if}
			</div>

			<button
				on:click={() => toast.dismiss(toastItem.id)}
				class="flex-shrink-0 p-1 rounded hover:opacity-70 transition-opacity"
				style="color: var(--petalytics-subtle);"
			>
				<X size={16} />
			</button>
		</div>
	{/each}
</div>
