<script lang="ts">
	interface Props {
		type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
		placeholder?: string;
		value?: string | number;
		disabled?: boolean;
		required?: boolean;
		error?: string;
		label?: string;
		id?: string;
		name?: string;
		autocomplete?: string;
		oninput?: (event: Event) => void;
		onchange?: (event: Event) => void;
		onblur?: (event: Event) => void;
	}

	let {
		type = 'text',
		placeholder,
		value = '',
		disabled = false,
		required = false,
		error,
		label,
		id,
		name,
		autocomplete,
		oninput,
		onchange,
		onblur,
		...rest
	}: Props = $props();

	const inputId = id || name || Math.random().toString(36).substring(7);
	const hasError = !!error;
	
	const baseClasses = 'block w-full px-3 py-2 border rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0';
	const normalClasses = 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';
	const errorClasses = 'border-red-300 focus:border-red-500 focus:ring-red-500';
	const disabledClasses = 'bg-gray-50 text-gray-500 cursor-not-allowed';
</script>

<div class="space-y-1">
	{#if label}
		<label for={inputId} class="block text-sm font-medium text-gray-700">
			{label}
			{#if required}
				<span class="text-red-500">*</span>
			{/if}
		</label>
	{/if}
	
	<input
		{type}
		{placeholder}
		{value}
		{disabled}
		{required}
		{name}
		{autocomplete}
		id={inputId}
		class="{baseClasses} {hasError ? errorClasses : normalClasses} {disabled ? disabledClasses : ''}"
		oninput={oninput}
		onchange={onchange}
		onblur={onblur}
		{...rest}
	/>
	
	{#if error}
		<p class="text-sm text-red-600">{error}</p>
	{/if}
</div>