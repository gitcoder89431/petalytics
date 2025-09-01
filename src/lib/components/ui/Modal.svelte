<script lang="ts">
	interface Props {
		isOpen?: boolean;
		title?: string;
		size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
		onclose?: () => void;
		children?: any;
	}

	let {
		isOpen = false,
		title,
		size = 'md',
		onclose,
		children
	}: Props = $props();

	const sizeClasses = {
		sm: 'max-w-md',
		md: 'max-w-lg',
		lg: 'max-w-2xl',
		xl: 'max-w-4xl',
		full: 'max-w-full mx-4'
	};

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget && onclose) {
			onclose();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && onclose) {
			onclose();
		}
	}
</script>

{#if isOpen}
	<!-- Backdrop -->
	<div 
		class="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<!-- Modal -->
		<div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full {sizeClasses[size]} max-h-[90vh] overflow-auto">
			{#if title || onclose}
				<div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
					{#if title}
						<h2 class="text-xl font-semibold text-gray-900 dark:text-white">
							{title}
						</h2>
					{/if}
					{#if onclose}
						<button 
							type="button"
							class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
							onclick={onclose}
							aria-label="Close modal"
						>
							<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					{/if}
				</div>
			{/if}
			
			<div class="p-4">
				{@render children?.()}
			</div>
		</div>
	</div>
{/if}