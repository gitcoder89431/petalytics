<script lang="ts">
	interface Props {
		title?: string;
		description?: string;
		padding?: 'none' | 'sm' | 'md' | 'lg';
		shadow?: 'none' | 'sm' | 'md' | 'lg';
		border?: boolean;
		class?: string;
		children?: any;
	}

	let {
		title,
		description,
		padding = 'md',
		shadow = 'md',
		border = true,
		class: className = '',
		children,
	}: Props = $props();

	const paddingClasses = {
		none: '',
		sm: 'p-3',
		md: 'p-6',
		lg: 'p-8',
	};

	const shadowClasses = {
		none: '',
		sm: 'shadow-sm',
		md: 'shadow-md',
		lg: 'shadow-lg',
	};

	const borderClass = border ? 'border' : '';
	const baseClasses = 'rounded-lg';
</script>

<div
	class="{baseClasses} {paddingClasses[padding]} {shadowClasses[shadow]} {borderClass} {className}"
	style="background: var(--petalytics-surface); border-color: var(--petalytics-border);"
>
	{#if title || description}
		<div class="mb-4">
			{#if title}
				<h3 class="text-lg font-medium" style="color: var(--petalytics-text);">
					{title}
				</h3>
			{/if}
			{#if description}
				<p class="mt-1 text-sm" style="color: var(--petalytics-subtle);">
					{description}
				</p>
			{/if}
		</div>
	{/if}

	{@render children?.()}
</div>
