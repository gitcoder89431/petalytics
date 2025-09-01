<script lang="ts">
	interface Props {
		variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
		size?: 'sm' | 'md' | 'lg';
		disabled?: boolean;
		loading?: boolean;
		type?: 'button' | 'submit' | 'reset';
		class?: string;
		onclick?: () => void;
		children?: any;
	}

	let {
		variant = 'primary',
		size = 'md',
		disabled = false,
		loading = false,
		type = 'button',
		class: className = '',
		onclick,
		children,
		...rest
	}: Props = $props();

	const baseClasses =
		'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

	const sizeClasses = {
		sm: 'px-3 py-1.5 text-sm rounded-md',
		md: 'px-4 py-2 text-sm rounded-md',
		lg: 'px-6 py-3 text-base rounded-lg',
	};
</script>

<button
	{type}
	{disabled}
	class="{baseClasses} {sizeClasses[size]} {className}"
	style={variant === 'primary'
		? `background: var(--petalytics-accent); color: var(--petalytics-bg); border: none;`
		: variant === 'secondary'
			? `background: var(--petalytics-overlay); color: var(--petalytics-text); border: 1px solid var(--petalytics-border);`
			: variant === 'danger'
				? `background: var(--petalytics-love); color: var(--petalytics-bg); border: none;`
				: `background: transparent; color: var(--petalytics-text); border: none;`}
	{onclick}
	{...rest}
>
	{#if loading}
		<svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
			></circle>
			<path
				class="opacity-75"
				fill="currentColor"
				d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
			></path>
		</svg>
	{/if}
	{@render children?.()}
</button>
