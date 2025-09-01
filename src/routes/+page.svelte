<script lang="ts">
	import { Heart, Activity, Calendar, Settings } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
</script>

<div class="min-h-screen" style="background: var(--petalytics-bg);">
	<div class="container mx-auto px-4 py-12">
		<!-- Header -->
		<div class="text-center mb-12">
			<div class="flex items-center justify-center mb-6">
				<Heart class="w-12 h-12 mr-3" style="color: var(--petalytics-love);" />
				<h1 class="text-5xl font-bold" style="color: var(--petalytics-text);">
					Petalytics
				</h1>
			</div>
			<p class="text-xl max-w-2xl mx-auto" style="color: var(--petalytics-subtle);">
				Your intelligent pet journal powered by AI. Track, analyze, and understand your furry friend's well-being.
			</p>
		</div>

		<!-- Features Grid -->
		<div class="grid md:grid-cols-3 gap-8 mb-12">
			<Card title="Smart Journaling" description="AI-powered insights from your pet's daily activities">
				<Activity class="w-8 h-8 mb-4" style="color: var(--petalytics-pine);" />
				<p style="color: var(--petalytics-subtle);">
					Record your pet's behavior, health, and activities. Get intelligent recommendations based on patterns.
				</p>
			</Card>

			<Card title="Health Tracking" description="Monitor your pet's wellness over time">
				<Heart class="w-8 h-8 mb-4" style="color: var(--petalytics-love);" />
				<p style="color: var(--petalytics-subtle);">
					Track weight, mood, appetite, and other vital signs to maintain optimal health.
				</p>
			</Card>

			<Card title="Smart Reminders" description="Never miss important pet care tasks">
				<Calendar class="w-8 h-8 mb-4" style="color: var(--petalytics-foam);" />
				<p style="color: var(--petalytics-subtle);">
					Set up automated reminders for feeding, medication, vet visits, and grooming.
				</p>
			</Card>
		</div>

		<!-- CTA Section -->
		<div class="text-center">
			<Card class="max-w-md mx-auto" padding="lg">
				<h2 class="text-2xl font-bold mb-4" style="color: var(--petalytics-text);">
					Ready to get started?
				</h2>
				<p class="mb-6" style="color: var(--petalytics-subtle);">
					Create your first pet profile and begin your intelligent journaling journey.
				</p>
				<div class="space-y-3">
					<Button variant="primary" size="lg" class="w-full">
						Add Your First Pet
					</Button>
					<Button variant="secondary" size="lg" class="w-full">
						<Settings class="w-4 h-4 mr-2" />
						Configure Settings
					</Button>
				</div>
			</Card>
		</div>

		<!-- Status Information -->
		<div class="mt-12 text-center">
			<div class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium" style="background: var(--petalytics-highlight-med); color: var(--petalytics-text);">
				<div class="w-2 h-2 rounded-full mr-2 animate-pulse" style="background: var(--petalytics-foam);"></div>
				SvelteKit + TypeScript + Tailwind CSS - Theme System Implemented
			</div>
		</div>
	</div>
</div>
