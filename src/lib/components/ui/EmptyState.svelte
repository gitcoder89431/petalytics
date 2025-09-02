<script lang="ts">
	import { Heart, FileText, Camera, Calendar } from 'lucide-svelte';

	interface Props {
		// accept multiple icon key aliases for resilience
		icon?: 'heart' | 'filetext' | 'file-text' | 'camera' | 'calendar';
		title: string;
		description: string;
		actionText?: string;
		onAction?: () => void;
	}

	let { icon = 'heart', title, description, actionText, onAction }: Props = $props();

	const icons = {
		heart: Heart,
		filetext: FileText,
		'file-text': FileText,
		camera: Camera,
		calendar: Calendar,
	} as const;

	// safe resolve with fallback
	const IconComponent = icons[icon] || Heart;
</script>

<div class="empty-state text-center py-12">
	<div class="mb-6">
		<div
			class="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
			style="background: var(--petalytics-overlay);"
		>
			<IconComponent size={32} style="color: var(--petalytics-subtle);" />
		</div>
	</div>

	<h3 class="text-lg font-semibold mb-2" style="color: var(--petalytics-text);">
		{title}
	</h3>

	<p class="text-sm mb-6 max-w-md mx-auto" style="color: var(--petalytics-subtle);">
		{description}
	</p>

	{#if actionText && onAction}
		<button onclick={onAction} class="button flex items-center space-x-2 mx-auto">
			<IconComponent size={16} />
			<span>{actionText}</span>
		</button>
	{/if}
</div>
