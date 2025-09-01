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
				// Refresh data after import
				setTimeout(() => {
					window.location.reload();
				}, 2000);
			}
		} catch (error) {
			importMessage = 'Import failed: ' + (error as Error).message;
			importSuccess = false;
		} finally {
			isImporting = false;
			if (fileInput) {
				fileInput.value = '';
			}
		}
	}
</script>

<div class="data-manager space-y-6">
	<!-- Export Section -->
	<div class="export-section">
		<h3 class="text-lg font-semibold mb-4 flex items-center" style="color: var(--petalytics-text);">
			<Download size={20} class="mr-2" style="color: var(--petalytics-accent);" />
			Export Data
		</h3>

		<div class="space-y-3">
			<!-- Export All -->
			<div
				class="export-item p-4 rounded-lg border"
				style="background: var(--petalytics-surface); border-color: var(--petalytics-border);"
			>
				<div class="flex items-center justify-between">
					<div>
						<h4 class="font-medium" style="color: var(--petalytics-text);">Complete Backup</h4>
						<p class="text-sm" style="color: var(--petalytics-subtle);">
							Export all pets, settings, and journal entries
						</p>
					</div>
					<button
						on:click={exportAllData}
						disabled={isExporting || pets.length === 0}
						class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
					>
						{#if isExporting}
							<div
								class="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"
							></div>
						{:else}
							<Database size={16} />
						{/if}
						<span>Export All</span>
					</button>
				</div>
			</div>

			<!-- Export Individual Pets -->
			{#if pets.length > 0}
				<div class="individual-exports">
					<h4 class="font-medium mb-2" style="color: var(--petalytics-text);">
						Export Individual Pets
					</h4>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
						{#each pets as pet}
							<div
								class="pet-export-item p-3 rounded-lg border"
								style="background: var(--petalytics-overlay); border-color: var(--petalytics-border);"
							>
								<div class="flex items-center justify-between">
									<div class="flex items-center space-x-2">
										<img
											src={pet.profileImageUrl || '/images/default-pet.png'}
											alt={pet.name}
											class="w-8 h-8 rounded-full object-cover"
											on:error={(e) => {
												const target = e.target as HTMLImageElement;
												target.src =
													'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iMTYiIGZpbGw9IiNGMzRGNEYiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIGZpbGw9IndoaXRlIj4KICA8cGF0aCBkPSJNNS4yNSA0QzQuNTU5NjQgNCA0IDQuNTU5NjQgNCA1LjI1VjEwLjc1QzQgMTEuNDQwNCA0LjU1OTY0IDEyIDUuMjUgMTJIMTAuNzVDMTEuNDQwNCAxMiAxMiAxMS40NDA0IDEyIDEwLjc1VjUuMjVDMTIgNC41NTk2NCAxMS40NDA0IDQgMTAuNzUgNEg1LjI1WiIvPgo8L3N2Zz4KPC9zdmc+';
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
										on:click={() => exportSinglePet(pet)}
										disabled={isExporting}
										class="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-700 text-xs px-2 py-1 rounded flex items-center space-x-1 transition-colors"
									>
										<FileText size={12} />
										<span>Export</span>
									</button>
								</div>
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
			Import Data
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
				on:change={handleImport}
				class="hidden"
			/>
			<button
				on:click={() => fileInput?.click()}
				disabled={isImporting}
				class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
			>
				{#if isImporting}
					<div
						class="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"
					></div>
					<span>Importing...</span>
				{:else}
					<Upload size={16} />
					<span>Choose File</span>
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

		<!-- Data Format Info -->
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
