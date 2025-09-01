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
		children
	}: Props = $props();

	const paddingClasses = {
		none: '',
		sm: 'p-3',
		md: 'p-6',
		lg: 'p-8'
	};

	const shadowClasses = {
		none: '',
		sm: 'shadow-sm',
		md: 'shadow-md',
		lg: 'shadow-lg'
	};

	const borderClass = border ? 'border border-gray-200 dark:border-gray-700' : '';
	const baseClasses = 'bg-white dark:bg-gray-800 rounded-lg';
</script>

<div class="{baseClasses} {paddingClasses[padding]} {shadowClasses[shadow]} {borderClass} {className}">
	{#if title || description}
		<div class="mb-4">
			{#if title}
				<h3 class="text-lg font-medium text-gray-900 dark:text-white">
					{title}
				</h3>
			{/if}
			{#if description}
				<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
					{description}
				</p>
			{/if}
		</div>
	{/if}
	
	{@render children?.()}
</div>