<script lang="ts">
	import { Download, Upload, FileText, Database } from 'lucide-svelte';
	import { DataExporter } from '$lib/utils/data-export';
	import { petStore } from '$lib/stores/pets';
	import type { PetPanelData } from '$lib/types/Pet';

	let isExporting = false;
	let isImporting = false;
	let importMessage = '';
	let importSuccess = false;
	let fileInput: HTMLInputElement;
	let pets: PetPanelData[] = [];

	petStore.subscribe((value) => {
		pets = value;
	});

	async function exportAllData() {
		isExporting = true;
		try {
			await DataExporter.exportAllData();
		} catch (error) {
			alert('Export failed: ' + (error as Error).message);
		} finally {
			isExporting = false;
		}
	}

	async function exportSinglePet(pet: PetPanelData) {
		isExporting = true;
		try {
			await DataExporter.exportPet(pet);
		} catch (error) {
			alert('Export failed: ' + (error as Error).message);
		} finally {
			isExporting = false;
		}
	}

	async function handleImport(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		isImporting = true;
		importMessage = '';

		try {
			const result = await DataExporter.importFromFile(file);
			importMessage = result.message;
			importSuccess = result.success;

			if (result.success) {
				setTimeout(() => window.location.reload(), 2000);
			}
		} catch (error) {
			importMessage = 'Import failed: ' + (error as Error).message;
			importSuccess = false;
		} finally {
			isImporting = false;
			if (fileInput) fileInput.value = '';
		}
	}
</script>

<div class="data-manager space-y-6">
	<!-- Export Section -->
	<div class="export-section">
		<h3 class="text-lg font-semibold mb-4 flex items-center" style="color: var(--petalytics-text);">
			<Download size={20} class="mr-2" style="color: var(--petalytics-accent);" />
			export_data
		</h3>

		<div class="space-y-3">
			<!-- Export All (CLI row) -->
			<div class="cli-row px-2 py-2">
				<span class="label">complete_backup</span>
				<span class="value text-xs" style="color: var(--petalytics-subtle);"
					>export all pets, settings, and journal entries</span
				>
				<button
					type="button"
					onclick={exportAllData}
					disabled={isExporting || pets.length === 0}
					class="arrow-btn ml-2 flex items-center gap-1"
					aria-label="Export all"
				>
					{#if isExporting}
						<div
							class="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"
						></div>
					{:else}
						<Database size={14} />
					{/if}
					<span>export</span>
				</button>
			</div>

			{#if pets.length > 0}
				<div class="individual-exports">
					<h4 class="font-medium mb-2" style="color: var(--petalytics-text);">
						export_individual_pets
					</h4>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
						{#each pets as pet}
							<div class="cli-row px-2 py-2">
								<div class="flex items-center gap-2">
									<img
										src={pet.profileImageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHJ4PSIxNiIgZmlsbD0iI0YzNEY0RiIvPjxzdmcgeD0iOCIgeT0iOCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJ3aGl0ZSI+PHBhdGggZD0iTTUuMjUgNEM0LjU1OTY0IDQgNCA0LjU1OTY0IDQgNS4yNVYxMC43NUM0IDExLjQ0MDQgNC41NTk2NCAxMiA1LjI1IDEySDEwLjc1QzExLjQ0MDQgMTIgMTIgMTEuNDQwNCAxMiAxMC43NVY1LjI1QzEyIDQuNTU5NjQgMTEuNDQwNCA0IDEwLjc1IDRINS4yNVoiLz48L3N2Zz48L3N2Zz4='}
										alt={pet.name}
										class="w-8 h-8 rounded-full object-cover"
										onerror={(e) => {
											(e.target as HTMLImageElement).src =
												'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHJ4PSIxNiIgZmlsbD0iI0YzNEY0RiIvPjxzdmcgeD0iOCIgeT0iOCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJ3aGl0ZSI+PHBhdGggZD0iTTUuMjUgNEM0LjU1OTY0IDQgNCA0LjU1OTY0IDQgNS4yNVYxMC43NUM0IDExLjQ0MDQgNC41NTk2NCAxMiA1LjI1IDEySDEwLjc1QzExLjQ0MDQgMTIgMTIgMTEuNDQwNCAxMiAxMC43NVY1LjI1QzEyIDQuNTU5NjQgMTEuNDQwNCA0IDEwLjc1IDRINS4yNVoiLz48L3N2Zz48L3N2Zz4=';
										}}
									/>
									<div>
										<p class="font-medium text-sm" style="color: var(--petalytics-text);">
											{pet.name}
										</p>
										<p class="text-xs" style="color: var(--petalytics-subtle);">
											{pet.journalEntries?.length || 0} entries
										</p>
									</div>
								</div>
								<button
									type="button"
									onclick={() => exportSinglePet(pet)}
									disabled={isExporting}
									class="arrow-btn ml-auto flex items-center gap-1 text-xs"
									aria-label={`Export ${pet.name}`}
								>
									<FileText size={12} />
									<span>export</span>
								</button>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Import Section -->
	<div class="import-section">
		<h3 class="text-lg font-semibold mb-4 flex items-center" style="color: var(--petalytics-text);">
			<Upload size={20} class="mr-2" style="color: var(--petalytics-accent);" />
			import_data
		</h3>

		<div
			class="import-area p-6 rounded-lg border-2 border-dashed text-center"
			style="border-color: var(--petalytics-border);"
		>
			<Upload size={32} style="color: var(--petalytics-subtle);" class="mx-auto mb-3" />
			<p class="mb-3" style="color: var(--petalytics-text);">
				Select a JSONL backup file to import
			</p>
			<input
				bind:this={fileInput}
				type="file"
				accept=".jsonl"
				onchange={handleImport}
				class="hidden"
			/>
			<button
				type="button"
				onclick={() => fileInput?.click()}
				disabled={isImporting}
				class="arrow-btn mx-auto flex items-center gap-2"
				aria-label="Choose file to import"
			>
				{#if isImporting}
					<div
						class="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"
					></div>
					<span>importing...</span>
				{:else}
					<Upload size={16} />
					<span>choose_file</span>
				{/if}
			</button>

			{#if importMessage}
				<div
					class="mt-4 p-3 rounded"
					class:bg-green-100={importSuccess}
					class:bg-red-100={!importSuccess}
				>
					<p
						class="text-sm"
						class:text-green-800={importSuccess}
						class:text-red-800={!importSuccess}
					>
						{importMessage}
					</p>
				</div>
			{/if}
		</div>

		<div class="format-info mt-4 p-3 rounded" style="background: var(--petalytics-overlay);">
			<h4 class="font-medium text-sm mb-2" style="color: var(--petalytics-text);">Data Format</h4>
			<ul class="text-xs space-y-1" style="color: var(--petalytics-subtle);">
				<li>• JSONL files exported from Petalytics</li>
				<li>• Individual pet files or complete backups</li>
				<li>• All journal entries and AI analyses included</li>
				<li>• Import will merge with existing data</li>
			</ul>
		</div>
	</div>
</div>

<style>
	.cli-row {
		display: flex;
		align-items: center;
		border: 1px solid transparent;
		border-radius: 6px;
		transition:
			background 140ms ease,
			border-color 140ms ease,
			box-shadow 140ms ease;
		background: var(--petalytics-surface);
		border-color: var(--petalytics-border);
	}
	.cli-row:hover {
		background: var(--petalytics-highlight-low);
		border-color: var(--petalytics-border);
	}
	.label {
		color: var(--petalytics-foam);
	}
	.value {
		margin-left: auto;
		text-align: right;
		flex: 1 1 auto;
	}
	.arrow-btn {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.85rem;
		line-height: 1rem;
		background: transparent;
		border: 1px solid var(--petalytics-border);
		color: var(--petalytics-subtle);
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		cursor: pointer;
	}
	.arrow-btn:hover {
		background: var(--petalytics-highlight-low);
		color: var(--petalytics-text);
	}
	.arrow-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.arrow-btn:focus-visible {
		outline: none;
		border-color: var(--petalytics-accent);
		box-shadow: 0 0 0 2px color-mix(in oklab, var(--petalytics-accent) 35%, transparent);
	}
</style>
