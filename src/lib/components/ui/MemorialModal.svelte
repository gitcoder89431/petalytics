<script lang="ts">
  import Modal from './Modal.svelte';
  import type { PetPanelData } from '$lib/types/Pet';

  interface Props {
    isOpen: boolean;
    pet: PetPanelData | null;
    onclose: () => void;
  }

  let { isOpen, pet, onclose }: Props = $props();

  function yearsTogether(p: PetPanelData): number {
    if (!p?.createdAt) return 0;
    const start = new Date(p.createdAt).getTime();
    const end = Date.now();
    const days = Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)));
    return Math.floor(days / 365);
  }

  function petLine(p: PetPanelData): string {
    const ageUnit = p.ageUnit === 'months' ? 'm' : p.ageUnit === 'weeks' ? 'w' : 'y';
    const age = p.age ? `${p.age}${ageUnit}` : '';
    const parts = [p.species, p.breed, age].filter(Boolean);
    return parts.join(' | ');
  }

  const entryList = $derived((pet?.journalEntries ?? []).slice().reverse());
</script>

<Modal isOpen={isOpen} title={pet ? `In loving memory of ${pet.name}` : 'Memories'} size="lg" onclose={onclose}>
  {#if pet}
    <div class="space-y-4 font-mono">
      <div class="rounded p-3" style="background: color-mix(in oklab, var(--petalytics-overlay) 60%, transparent); border: 1px solid var(--petalytics-border);">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm" style="color: var(--petalytics-subtle);">{petLine(pet)}</div>
            <div class="text-base font-semibold" style="color: var(--petalytics-text);">
              {pet.name} brought you {yearsTogether(pet)} years of joy.
            </div>
          </div>
          <div class="text-xs px-2 py-1 rounded" style="background: var(--petalytics-surface); color: var(--petalytics-subtle);">
            {entryList.length} memories
          </div>
        </div>
      </div>

      {#if entryList.length === 0}
        <div class="text-sm" style="color: var(--petalytics-subtle);">No journal entries yet.</div>
      {:else}
        <div class="space-y-3">
          {#each entryList as entry}
            <div class="rounded border p-3" style="background: var(--petalytics-surface); border-color: var(--petalytics-border);">
              <div class="flex items-center justify-between mb-2">
                <div class="text-xs" style="color: var(--petalytics-subtle);">
                  {new Date(entry.date as any).toLocaleDateString()}
                </div>
                <div class="text-sm" style="color: var(--petalytics-text);">{entry.mood || '🐾'}</div>
              </div>
              <div class="text-sm" style="color: var(--petalytics-text);">{entry.content}</div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</Modal>

<style>
</style>
