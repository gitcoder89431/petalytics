<script lang="ts">
	import { onMount } from 'svelte';
	import { Upload, Terminal } from 'lucide-svelte';
	import { petStore, selectedPetStore, petHelpers, selectedPetHelpers } from '$lib/stores/pets.js';
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

	function handleActivate(e: KeyboardEvent, action: () => void) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			action();
		}
	}
</script>

<div class="pet-panel h-full" style="background: var(--petalytics-bg);">
	<div class="cli-header p-3 border-b font-mono text-sm" style="border-color: var(--petalytics-border); background: var(--petalytics-surface);">
		<div class="flex items-center space-x-2" style="color: var(--petalytics-pine);">
			<Terminal size={14} />
			<span>pets@petalytics:~$</span>
		</div>
	</div>

	<div class="cli-content p-3 font-mono text-sm overflow-y-auto" style="color: var(--petalytics-text);">
		<!-- Toggle create form -->
		<div class="cli-row px-2 py-1" role="button" tabindex="0" aria-expanded={showCreateForm} onclick={toggleCreateForm} onkeydown={(e) => handleActivate(e, toggleCreateForm)}>
			<span class="label">add_pet</span>
			<span class="value">{showCreateForm ? 'show' : 'hidden'}</span>
		</div>

		{#if showCreateForm}
			<div class="mt-2 p-2 rounded" style="background: var(--petalytics-overlay);">
				<!-- name -->
				<div class="cli-row px-2 py-1">
					<span class="label">name</span>
					<input class="value bg-transparent border-none outline-none input-inline" bind:value={newPet.name} placeholder="Pet Name" />
				</div>
				{#if formErrors.name}
					<p class="px-2 text-xs" style="color: var(--petalytics-love);">{formErrors.name}</p>
				{/if}

				<!-- breed -->
				<div class="cli-row px-2 py-1">
					<span class="label">breed</span>
					<input class="value bg-transparent border-none outline-none input-inline" bind:value={newPet.breed} placeholder="Breed" />
				</div>
				{#if formErrors.breed}
					<p class="px-2 text-xs" style="color: var(--petalytics-love);">{formErrors.breed}</p>
				{/if}

				<!-- age -->
				<div class="cli-row px-2 py-1">
					<span class="label">age</span>
					<input class="value bg-transparent border-none outline-none input-inline" type="number" min="0" max="30" bind:value={newPet.age} placeholder="Age" />
				</div>
				{#if formErrors.age}
					<p class="px-2 text-xs" style="color: var(--petalytics-love);">{formErrors.age}</p>
				{/if}

				<!-- gender -->
				<div class="cli-row px-2 py-1">
					<span class="label">gender</span>
					<select class="value bg-transparent border-none outline-none input-inline" bind:value={newPet.gender}>
						<option value="">Select gender</option>
						<option value="male">male</option>
						<option value="female">female</option>
					</select>
				</div>
				{#if formErrors.gender}
					<p class="px-2 text-xs" style="color: var(--petalytics-love);">{formErrors.gender}</p>
				{/if}

				<!-- profile image upload -->
				<div class="cli-row px-2 py-1" style="align-items: flex-start;">
					<span class="label">profile_image</span>
					<div class="value flex items-center justify-end gap-2">
						{#if newPet.profileImageUrl}
							<img src={newPet.profileImageUrl} alt="preview" class="w-10 h-10 rounded-full object-cover border" style="border-color: var(--petalytics-border);" />
						{/if}
						<button type="button" class="arrow-btn" onclick={() => imageInput.click()}>upload</button>
						<input id="pet-profile-image" bind:this={imageInput} type="file" accept="image/*" onchange={handleImageUpload} class="hidden" />
					</div>
				</div>
				{#if formErrors.image}
					<p class="px-2 text-xs" style="color: var(--petalytics-love);">{formErrors.image}</p>
				{/if}

				<div class="flex gap-2 px-2 pt-2">
					<button class="button flex-1" type="button" onclick={createPet}>create</button>
					<button class="button-secondary flex-1" type="button" onclick={toggleCreateForm}>cancel</button>
				</div>
			</div>
		{/if}

		<!-- Separator -->
		<div class="my-3"><div class="border-t" style="border-color: var(--petalytics-border);"></div></div>

		<!-- Pets list -->
		<div class="cli-row px-2 py-1">
			<span style="color: var(--petalytics-subtle);">#</span>
			<span class="ml-2" style="color: var(--petalytics-gold);">pets</span>
		</div>

		{#if pets.length === 0}
			<div class="px-2 py-4" style="color: var(--petalytics-subtle);">no pets yet — use add_pet to create one</div>
		{:else}
					{#each pets as pet}
						<div class="cli-row px-2 py-1" role="button" tabindex="0" data-selected={selectedPetId === pet.id} onclick={() => selectPet(pet.id)} onkeydown={(e) => handleActivate(e, () => selectPet(pet.id))}>
					<span class="label" style="color: var(--petalytics-text);">{pet.name}</span>
					<span class="value" style="color: var(--petalytics-subtle);">
						{pet.breed} | {pet.age}{pet.age === 1 ? 'y' : 'y'}
					</span>
				</div>
			{/each}
		{/if}
	</div>
</div>

<style>
.cli-row {
	display: flex;
	align-items: center;
	border: 1px solid transparent;
	border-radius: 6px;
	transition: background 140ms ease, border-color 140ms ease, box-shadow 140ms ease;
}
.cli-row[role="button"] { cursor: pointer; }
.cli-row:hover { background: var(--petalytics-highlight-low); border-color: var(--petalytics-border); }
.cli-row:focus-within, .cli-row[role="button"]:focus-visible { outline: none; background: var(--petalytics-highlight-med); border-color: var(--petalytics-accent); box-shadow: 0 0 0 2px color-mix(in oklab, var(--petalytics-accent) 40%, transparent); }
.cli-row[data-selected="true"], .cli-row[aria-expanded="true"] { background: var(--petalytics-highlight-high); border-color: var(--petalytics-accent); }
.label { color: var(--petalytics-foam); }
.value { margin-left: auto; text-align: right; flex: 1 1 auto; }
.input-inline { padding: 0; }
.arrow-btn { font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; line-height: 1rem; background: transparent; border: 1px solid var(--petalytics-border); color: var(--petalytics-subtle); padding: 0.15rem 0.5rem; border-radius: 4px; cursor: pointer; }
.arrow-btn:hover { background: var(--petalytics-highlight-low); color: var(--petalytics-text); }
.arrow-btn:focus-visible { outline: none; border-color: var(--petalytics-accent); box-shadow: 0 0 0 2px color-mix(in oklab, var(--petalytics-accent) 35%, transparent); }
</style>
