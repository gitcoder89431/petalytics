<script lang="ts">
	import { onMount } from 'svelte';
	import { Plus, Heart, ArrowLeft, Upload, X } from 'lucide-svelte';
	import { petStore, selectedPetStore, petHelpers, selectedPetHelpers } from '$lib/stores/pets.js';
	import { fade } from 'svelte/transition';
	import type { PetPanelData } from '$lib/types/Pet.js';

	let pets: PetPanelData[] = [];
	let selectedPetId: string | null = null;
	let showCreateForm = false;
	let imageInput: HTMLInputElement;

	let newPet = {
		name: '',
		breed: '',
		age: '',
		gender: '',
		profileImageUrl: '',
	};

	let formErrors: Record<string, string> = {};

	onMount(() => {
		petStore.subscribe((value) => {
			pets = value;
		});
		selectedPetStore.subscribe((value) => {
			selectedPetId = value;
		});
		petHelpers.load();
		selectedPetHelpers.load();
	});

	function toggleCreateForm() {
		showCreateForm = !showCreateForm;
		if (!showCreateForm) {
			resetForm();
		}
	}

	function resetForm() {
		newPet = {
			name: '',
			breed: '',
			age: '',
			gender: '',
			profileImageUrl: '',
		};
		formErrors = {};
	}

	function handleImageUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			if (file.size > 5 * 1024 * 1024) {
				// 5MB limit
				formErrors.image = 'Image must be less than 5MB';
				return;
			}

			const reader = new FileReader();
			reader.onload = (e) => {
				newPet.profileImageUrl = e.target?.result as string;
			};
			reader.readAsDataURL(file);

			formErrors.image = '';
		}
	}

	function validateForm() {
		formErrors = {};

		if (!newPet.name.trim()) {
			formErrors.name = 'Pet name is required';
		}

		if (!newPet.breed.trim()) {
			formErrors.breed = 'Breed is required';
		}

		const age = parseInt(newPet.age);
		if (!newPet.age || age < 0 || age > 30) {
			formErrors.age = 'Please enter a valid age (0-30 years)';
		}

		if (!newPet.gender) {
			formErrors.gender = 'Please select gender';
		}

		return Object.keys(formErrors).length === 0;
	}

	async function createPet() {
		if (!validateForm()) return;

		const pet: PetPanelData = {
			id: Date.now().toString(),
			name: newPet.name.trim(),
			breed: newPet.breed.trim(),
			age: parseInt(newPet.age),
			gender: newPet.gender as 'male' | 'female',
			profileImageUrl: newPet.profileImageUrl || '/images/default-pet.png',
			createdAt: new Date().toISOString(),
			journalEntries: [],
		};

		petHelpers.add(pet);
		toggleCreateForm();
	}

	function selectPet(petId: string) {
		selectedPetHelpers.select(petId);
	}
</script>

<div class="panel-container h-full flex flex-col">
	<div class="panel-header">
		<div class="flex items-center justify-between">
			<div class="flex items-center space-x-2">
				{#if showCreateForm}
					<button on:click={toggleCreateForm} class="p-1 hover:opacity-70 transition-opacity">
						<ArrowLeft size={16} style="color: var(--petalytics-accent);" />
					</button>
				{:else}
					<Heart size={18} style="color: var(--petalytics-accent);" />
				{/if}
				<h2 class="text-lg font-semibold">
					{showCreateForm ? 'Add New Pet' : 'Your Pets'}
				</h2>
			</div>
			{#if !showCreateForm}
				<button
					on:click={toggleCreateForm}
					class="flex items-center space-x-1 px-2 py-1 rounded-md button-secondary"
				>
					<Plus size={16} />
					<span class="text-sm">Add</span>
				</button>
			{/if}
		</div>
	</div>

	<div class="panel-content flex-1 p-4 overflow-y-auto">
		{#if showCreateForm}
			<!-- Pet Creation Form -->
			<div class="create-form space-y-4" transition:fade={{ duration: 200 }}>
				<!-- Profile Image Upload -->
				<div class="section">
					<label class="block text-sm font-medium mb-2" style="color: var(--petalytics-subtle);">
						Profile Photo
					</label>
					<div class="flex flex-col items-center space-y-3">
						{#if newPet.profileImageUrl}
							<img
								src={newPet.profileImageUrl}
								alt="Pet preview"
								class="w-24 h-24 rounded-full object-cover border-2"
								style="border-color: var(--petalytics-border);"
							/>
						{:else}
							<div
								class="w-24 h-24 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer hover:opacity-70 transition-opacity"
								style="border-color: var(--petalytics-border);"
								on:click={() => imageInput.click()}
								on:keydown={(e) => e.key === 'Enter' && imageInput.click()}
								role="button"
								tabindex="0"
							>
								<Upload size={24} style="color: var(--petalytics-subtle);" />
							</div>
						{/if}
						<input
							bind:this={imageInput}
							type="file"
							accept="image/*"
							on:change={handleImageUpload}
							class="hidden"
						/>
						{#if formErrors.image}
							<p class="text-sm text-red-400">{formErrors.image}</p>
						{/if}
					</div>
				</div>

				<!-- Pet Name -->
				<div class="section">
					<input type="text" bind:value={newPet.name} class="input w-full" placeholder="Pet Name" />
					{#if formErrors.name}
						<p class="text-sm text-red-400 mt-1">{formErrors.name}</p>
					{/if}
				</div>

				<!-- Breed -->
				<div class="section">
					<input type="text" bind:value={newPet.breed} class="input w-full" placeholder="Breed" />
					{#if formErrors.breed}
						<p class="text-sm text-red-400 mt-1">{formErrors.breed}</p>
					{/if}
				</div>

				<!-- Age and Gender -->
				<div class="grid grid-cols-2 gap-3">
					<div>
						<input
							type="number"
							bind:value={newPet.age}
							class="input w-full"
							placeholder="Age"
							min="0"
							max="30"
						/>
						{#if formErrors.age}
							<p class="text-xs text-red-400 mt-1">{formErrors.age}</p>
						{/if}
					</div>

					<div>
						<select bind:value={newPet.gender} class="input w-full">
							<option value="">Gender</option>
							<option value="male">Male</option>
							<option value="female">Female</option>
						</select>
						{#if formErrors.gender}
							<p class="text-xs text-red-400 mt-1">{formErrors.gender}</p>
						{/if}
					</div>
				</div>

				<!-- Form Actions -->
				<div class="flex space-x-3 pt-4">
					<button on:click={createPet} class="button flex-1">Create Pet</button>
					<button on:click={toggleCreateForm} class="button-secondary flex-1">Cancel</button>
				</div>
			</div>
		{:else}
			<!-- Pet Grid -->
			<div class="pets-grid">
				{#if pets.length === 0}
					<div class="empty-state text-center py-8">
						<Heart size={48} style="color: var(--petalytics-subtle); margin: 0 auto 1rem;" />
						<p class="text-lg font-medium mb-2" style="color: var(--petalytics-text);">
							No pets yet
						</p>
						<p class="text-sm mb-4" style="color: var(--petalytics-subtle);">
							Add your first pet to get started with tracking their journal
						</p>
						<button on:click={toggleCreateForm} class="button">Add Your First Pet</button>
					</div>
				{:else}
					<div class="grid grid-cols-2 gap-3">
						{#each pets as pet}
							<div
								class="pet-card p-3 rounded-lg border cursor-pointer transition-all hover:opacity-80"
								class:selected={selectedPetId === pet.id}
								style="
                  background: var(--petalytics-surface);
                  border-color: {selectedPetId === pet.id
									? 'var(--petalytics-accent)'
									: 'var(--petalytics-border)'};
                "
								on:click={() => selectPet(pet.id)}
								on:keydown={(e) => e.key === 'Enter' && selectPet(pet.id)}
								role="button"
								tabindex="0"
							>
								<div class="flex flex-col items-center space-y-2">
									<img
										src={pet.profileImageUrl || '/images/default-pet.png'}
										alt={pet.name}
										class="w-16 h-16 rounded-full object-cover"
									/>
									<div class="text-center">
										<p class="font-medium text-sm truncate" style="color: var(--petalytics-text);">
											{pet.name}
										</p>
										<p class="text-xs truncate" style="color: var(--petalytics-subtle);">
											{pet.breed}
										</p>
										<p class="text-xs" style="color: var(--petalytics-subtle);">
											{pet.age}
											{pet.age === 1 ? 'year' : 'years'} old
										</p>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.pet-card.selected {
		box-shadow: 0 0 0 2px var(--petalytics-accent);
	}

	.panel-header {
		background: var(--petalytics-overlay);
		border-bottom: 1px solid var(--petalytics-border);
		padding: 0.75rem 1rem;
		font-weight: 500;
		color: var(--petalytics-text);
	}

	.panel-content {
		background: var(--petalytics-surface);
	}

	.section {
		margin-bottom: 1rem;
	}
</style>
