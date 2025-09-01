<script lang="ts">
	import { Heart, Activity, Calendar, Settings } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
	<div class="container mx-auto px-4 py-12">
		<!-- Header -->
		<div class="text-center mb-12">
			<div class="flex items-center justify-center mb-6">
				<Heart class="w-12 h-12 text-blue-600 mr-3" />
				<h1 class="text-5xl font-bold text-gray-900 dark:text-white">
					Petalytics
				</h1>
			</div>
			<p class="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
				Your intelligent pet journal powered by AI. Track, analyze, and understand your furry friend's well-being.
			</p>
		</div>

		<!-- Features Grid -->
		<div class="grid md:grid-cols-3 gap-8 mb-12">
			<Card title="Smart Journaling" description="AI-powered insights from your pet's daily activities">
				<Activity class="w-8 h-8 text-blue-600 mb-4" />
				<p class="text-gray-600 dark:text-gray-300">
					Record your pet's behavior, health, and activities. Get intelligent recommendations based on patterns.
				</p>
			</Card>

			<Card title="Health Tracking" description="Monitor your pet's wellness over time">
				<Heart class="w-8 h-8 text-red-500 mb-4" />
				<p class="text-gray-600 dark:text-gray-300">
					Track weight, mood, appetite, and other vital signs to maintain optimal health.
				</p>
			</Card>

			<Card title="Smart Reminders" description="Never miss important pet care tasks">
				<Calendar class="w-8 h-8 text-green-500 mb-4" />
				<p class="text-gray-600 dark:text-gray-300">
					Set up automated reminders for feeding, medication, vet visits, and grooming.
				</p>
			</Card>
		</div>

		<!-- CTA Section -->
		<div class="text-center">
			<Card class="max-w-md mx-auto" padding="lg">
				<h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
					Ready to get started?
				</h2>
				<p class="text-gray-600 dark:text-gray-300 mb-6">
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
			<div class="inline-flex items-center px-4 py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
				<div class="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
				SvelteKit + TypeScript + Tailwind CSS - Project Setup Complete
			</div>
		</div>
	</div>
</div>
