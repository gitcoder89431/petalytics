<script lang="ts">
	import { onMount } from 'svelte';
	import { Upload, Terminal } from 'lucide-svelte';
	import { petStore, selectedPetStore, petHelpers, selectedPetHelpers } from '$lib/stores/pets';
	import type { PetPanelData } from '$lib/types/Pet.js';
	import { rightPanelView, uiHelpers } from '$lib/stores/ui';

	let pets: PetPanelData[] = [];
	// Derived lists
	$: activePets = pets.filter((p) => !p.archived);
	$: archivedPets = pets.filter((p) => p.archived);
	let selectedPetId: string | null = null;
	let showCreateForm = false;
	let imageInput: HTMLInputElement;

	// Right-panel driven workflows (no modals)
	let petToArchive: PetPanelData | null = null;

	const speciesSuggestions = ['dog','cat','bird','reptile','fish','rabbit','hamster','other'] as const;
	const ageUnitSuggestions = ['years','months','weeks'] as const;
	const genderSuggestions = ['male','female','unknown'] as const;
	const sizeSuggestions = ['tiny','small','medium','large','extra_large'] as const;

	const breedSuggestionsMap: Record<string, string[]> = {
		dog: ['mixed','labrador','golden_retriever','german_shepherd','bulldog'],
		cat: ['persian','siamese','maine_coon','sphynx','mixed'],
		bird: ['budgie','cockatiel','parrot','canary','finch'],
		reptile: ['snake','lizard','turtle','gecko','iguana'],
		fish: ['goldfish','betta','tropical','saltwater'],
		rabbit: ['lop','rex','lionhead','netherland_dwarf'],
		hamster: ['syrian','dwarf','roborovski','chinese'],
		other: [],
	};

	function getBreedSuggestions(species: string): string[] {
		return breedSuggestionsMap[species] || [];
	}

	const norm = (s: string) => (s || '').trim().toLowerCase();

	function normalizeAgeUnit(u: string): 'years' | 'months' | 'weeks' {
		const v = norm(u);
		if (v.startsWith('m')) {
			// could be months
			return 'months';
		}
		if (v.startsWith('w')) {
			return 'weeks';
		}
		return 'years';
	}

	function firstSuggestion(suggestions: readonly string[] | string[], value: string): string | null {
		const p = norm(value);
		if (!p) return null;
		const list = Array.from(suggestions);
		return list.find((s) => s.startsWith(p)) || null;
	}

	function handleAutocomplete(field: 'species'|'breed'|'ageUnit'|'gender'|'size', suggestions: readonly string[] | string[], e: KeyboardEvent) {
		if (e.key === 'Enter') {
			const current = (newPet as any)[field] as string;
			const choice = firstSuggestion(suggestions, current);
			if (choice) {
				(newPet as any)[field] = choice;
				e.preventDefault();
			}
		}
	}

	function onSpeciesInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const prev = norm(newPet.species);
		newPet.species = target.value;
		const curr = norm(target.value);
		if (curr !== prev) {
			newPet.breed = '';
		}
	}

	let newPet = {
		name: '',
		species: '',
		breed: '',
		age: '',
		ageUnit: 'years',
		gender: 'unknown',
		size: 'medium',
		profileImageUrl: '',
	};

	let formErrors: Record<string, string> = {};

	onMount(() => {
		petStore.subscribe((value) => {
			pets = value;
			// If no selected pet and we have pets, auto-select the first ACTIVE one
			if (!selectedPetId && pets.length > 0) {
				const firstActive = pets.find((p) => !p.archived) || null;
				if (firstActive) {
					selectedPetHelpers.select(firstActive.id);
				} else {
					selectedPetHelpers.clear();
				}
			}
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
			species: '',
			breed: '',
			age: '',
			ageUnit: 'years',
			gender: 'unknown',
			size: 'medium',
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

	// Keyboard activate handler for elements with role="button"
	function handleActivate(e: KeyboardEvent, action: () => void) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			action();
		}
	}

	function validateForm() {
		formErrors = {};

		if (!newPet.name.trim()) {
			formErrors.name = 'Pet name is required';
		}

		if (!newPet.species) {
			formErrors.species = 'Please enter species';
		}

		if (!newPet.breed.trim()) {
			// Breed can be optional for some species; provide hint if suggestions exist
			const suggestions = getBreedSuggestions(newPet.species);
			if (suggestions.length) {
				formErrors.breed = `Consider selecting a type e.g. ${suggestions.slice(0,3).join('|')}`;
			}
		}

		const age = parseInt(newPet.age);
		if (Number.isNaN(age) || age < 0) {
			formErrors.age = 'Please enter a valid age';
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
			species: newPet.species || 'other',
			breed: newPet.breed.trim(),
			age: parseInt(newPet.age),
			ageUnit: normalizeAgeUnit(newPet.ageUnit),
			gender: (newPet.gender as 'male'|'female'|'unknown'),
			size: newPet.size as 'tiny'|'small'|'medium'|'large'|'extra_large',
			profileImageUrl: newPet.profileImageUrl || '/images/default-pet.png',
			createdAt: new Date().toISOString(),
			journalEntries: [],
		};

		petHelpers.add(pet);
		// Auto-select the newly created pet
		selectedPetHelpers.select(pet.id);
		toggleCreateForm();
	}

	function selectPet(petId: string) {
		selectedPetHelpers.select(petId);
	}

	function archivePet(petId: string) {
		const p = pets.find((x) => x.id === petId) || null;
		petToArchive = p;
		if (p) {
			selectedPetHelpers.select(p.id);
		}
		uiHelpers.setView('confirmArchive');
	}

	// Confirmation is handled in the right panel now

	function unarchivePet(petId: string) {
		petHelpers.unarchive(petId);
	}

	function openMemorial(_petId: string) {
		// Centralized memories view; no per-pet selection needed
		selectedPetHelpers.clear();
		uiHelpers.setView('memories');
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
				<!-- section header -->
				<div class="cli-row px-2 py-1">
					<span style="color: var(--petalytics-subtle);">#</span>
					<span class="ml-2" style="color: var(--petalytics-gold);">new_pet</span>
				</div>
				<!-- name -->
				<div class="cli-row px-2 py-1">
					<span class="label">name</span>
					<input class="value bg-transparent border-none outline-none input-inline" bind:value={newPet.name} placeholder="Pet Name" />
				</div>
				{#if formErrors.name}
					<p class="px-2 text-xs" style="color: var(--petalytics-love);">{formErrors.name}</p>
				{/if}

				<!-- species (text + autocomplete) -->
				<div class="cli-row px-2 py-1">
					<span class="label">species</span>
					<input class="value bg-transparent border-none outline-none input-inline" bind:value={newPet.species} placeholder="e.g. bird" list="species-suggestions" oninput={onSpeciesInput} onkeydown={(e) => handleAutocomplete('species', speciesSuggestions, e)} />
				</div>
				<datalist id="species-suggestions">
					{#each speciesSuggestions as s}
						<option value={s}></option>
					{/each}
				</datalist>
				{#if formErrors.species}
					<p class="px-2 text-xs" style="color: var(--petalytics-love);">{formErrors.species}</p>
				{/if}

				<!-- breed (text + species-based autocomplete) -->
				<div class="cli-row px-2 py-1">
					<span class="label">breed</span>
					<input class="value bg-transparent border-none outline-none input-inline" bind:value={newPet.breed} placeholder="Breed / type" list="breed-suggestions" onkeydown={(e) => handleAutocomplete('breed', getBreedSuggestions(norm(newPet.species)), e)} />
				</div>
				<!-- suggestions datalist -->
				<datalist id="breed-suggestions">
					{#each getBreedSuggestions(newPet.species) as suggestion}
						<option value={suggestion}></option>
					{/each}
				</datalist>
				{#if formErrors.breed}
					<p class="px-2 text-xs" style="color: var(--petalytics-love);">{formErrors.breed}</p>
				{/if}

				<!-- age -->
				<div class="cli-row px-2 py-1">
					<span class="label">age</span>
					<div class="value flex items-center justify-end gap-2">
						<input class="bg-transparent border-none outline-none input-inline w-20 text-right" type="number" min="0" bind:value={newPet.age} placeholder="0" />
						<input class="bg-transparent border-none outline-none input-inline w-28" bind:value={newPet.ageUnit} placeholder="years|months|weeks" list="age-unit-suggestions" onkeydown={(e) => handleAutocomplete('ageUnit', ageUnitSuggestions, e)} />
					</div>
				</div>
				<datalist id="age-unit-suggestions">
					{#each ageUnitSuggestions as u}
						<option value={u}></option>
					{/each}
				</datalist>
				{#if formErrors.age}
					<p class="px-2 text-xs" style="color: var(--petalytics-love);">{formErrors.age}</p>
				{/if}

				<!-- gender -->
				<div class="cli-row px-2 py-1">
					<span class="label">gender</span>
					<input class="value bg-transparent border-none outline-none input-inline" bind:value={newPet.gender} placeholder="male|female|unknown" list="gender-suggestions" onkeydown={(e) => handleAutocomplete('gender', genderSuggestions, e)} />
				</div>
				<datalist id="gender-suggestions">
					{#each genderSuggestions as g}
						<option value={g}></option>
					{/each}
				</datalist>
				{#if formErrors.gender}
					<p class="px-2 text-xs" style="color: var(--petalytics-love);">{formErrors.gender}</p>
				{/if}

				<!-- size -->
				<div class="cli-row px-2 py-1">
					<span class="label">size</span>
					<input class="value bg-transparent border-none outline-none input-inline" bind:value={newPet.size} placeholder="tiny|small|medium|large|extra_large" list="size-suggestions" onkeydown={(e) => handleAutocomplete('size', sizeSuggestions, e)} />
				</div>
				<datalist id="size-suggestions">
					{#each sizeSuggestions as s}
						<option value={s}></option>
					{/each}
				</datalist>

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
			<span class="ml-2" style="color: var(--petalytics-gold);">active_pets</span>
		</div>

		{#if activePets.length === 0}
			<div class="px-2 py-4" style="color: var(--petalytics-subtle);">no pets yet — use add_pet to create one</div>
		{:else}
				{#each activePets as pet}
						<div class="cli-row px-2 py-1" role="button" tabindex="0" data-selected={selectedPetId === pet.id} onclick={() => selectPet(pet.id)} onkeydown={(e) => handleActivate(e, () => selectPet(pet.id))}>
 						<span class="label" style="color: var(--petalytics-text);">{pet.name}</span>
 						<span class="value" style="color: var(--petalytics-subtle);">
 							{pet.species || 'pet'} | {pet.breed || '—'} | {pet.age}{pet.ageUnit === 'months' ? 'm' : pet.ageUnit === 'weeks' ? 'w' : 'y'}
 						</span>
						<div class="ml-2 flex items-center gap-2">
							<button class="arrow-btn" onclick={() => selectPet(pet.id)}>select</button>
							<button class="arrow-btn" onclick={() => archivePet(pet.id)}>archive</button>
						</div>
					</div>
					{/each}
 		{/if}

		<!-- Archived list -->
		<div class="my-3"><div class="border-t" style="border-color: var(--petalytics-border);"></div></div>
		<div class="cli-row px-2 py-1 items-center" style="background: color-mix(in oklab, var(--petalytics-overlay) 60%, transparent);">
			<span style="color: var(--petalytics-subtle);">#</span>
			<span class="ml-2" style="color: var(--petalytics-gold);">archived_pets</span>
			<span class="ml-auto"></span>
			<button class="arrow-btn" onclick={() => openMemorial('all')} disabled={archivedPets.length === 0}>view_memories</button>
		</div>
		{#if archivedPets.length === 0}
			<div class="px-2 py-2" style="color: var(--petalytics-subtle);">none</div>
		{:else}
			{#each archivedPets as pet}
				<div class="cli-row px-2 py-1" style="opacity: 0.9;">
					<span class="label" style="color: var(--petalytics-text);">{pet.name}</span>
					<span class="value" style="color: var(--petalytics-subtle);">
						{pet.species || 'pet'} | {pet.breed || '—'} | {pet.age}{pet.ageUnit === 'months' ? 'm' : pet.ageUnit === 'weeks' ? 'w' : 'y'}
					</span>
				</div>
			{/each}
		{/if}
	</div>
</div>

<!-- Right panel shows confirmation/memorial; no modals here -->

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
