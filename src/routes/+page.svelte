<script lang="ts">
	// Minimal welcome screen
	const go = () => (window.location.href = '/dashboard');
</script>

<div
	class="min-h-screen flex items-center justify-center px-4"
	style="background: var(--petalytics-bg);"
>
	<main class="w-full max-w-xl text-center">
		<img
			src="/favicon.svg"
			alt="Petalytic logo"
			width="72"
			height="72"
			class="mx-auto mb-4"
			decoding="async"
			loading="eager"
		/>
		<h1
			class="mb-4 font-extrabold tracking-tight"
			style="color: var(--petalytics-text); font-size: clamp(2.25rem, 6vw, 4rem);"
		>
			Petalytic
		</h1>
		<p
			class="mx-auto mb-8"
			style="color: var(--petalytics-subtle); font-size: clamp(1rem, 2.5vw, 1.125rem);"
		>
			A free, open pet journaling and insights app. No upsell—just a friendly welcome.
		</p>

		<div class="flex items-center justify-center gap-3">
			<button
				class="px-6 py-3 rounded-md font-medium"
				style="background: var(--petalytics-accent); color: var(--petalytics-base);"
				onclick={go}
			>
				ENTER
			</button>
			<a
				class="px-5 py-3 rounded-md font-medium border"
				style="border-color: var(--petalytics-border); color: var(--petalytics-text);"
				href="https://github.com/gitcoder89431/petalytics"
				target="_blank"
				rel="noreferrer noopener"
			>
				GitHub ↗
			</a>
		</div>

		<div class="mt-10 text-xs" style="color: var(--petalytics-subtle);">
			Welcome screen · Petalytic
		</div>
	</main>
</div>
