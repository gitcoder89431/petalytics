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

	const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
	
	const variantClasses = {
		primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
		secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500',
		danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
		ghost: 'hover:bg-gray-100 text-gray-700 focus:ring-gray-500'
	};
	
	const sizeClasses = {
		sm: 'px-3 py-1.5 text-sm rounded-md',
		md: 'px-4 py-2 text-sm rounded-md',
		lg: 'px-6 py-3 text-base rounded-lg'
	};
</script>

<button
	{type}
	{disabled}
	class="{baseClasses} {variantClasses[variant]} {sizeClasses[size]} {className}"
	onclick={onclick}
	{...rest}
>
	{#if loading}
		<svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
			<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
		</svg>
	{/if}
	{@render children?.()}
</button>