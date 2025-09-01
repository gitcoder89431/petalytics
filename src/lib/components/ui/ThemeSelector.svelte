<script lang="ts">
  import { themePresets, loadThemePreset, currentTheme } from '$lib/stores/theme';
  import { ChevronDown } from 'lucide-svelte';
  
  let isOpen = false;
  
  function selectTheme(themeKey: keyof typeof themePresets) {
    loadThemePreset(themeKey);
    isOpen = false;
  }
  
  function toggleDropdown() {
    isOpen = !isOpen;
  }
</script>

<div class="theme-selector relative">
  <button
    onclick={toggleDropdown}
    class="flex items-center justify-between w-full px-3 py-2 text-sm rounded-md border transition-colors"
    style="
      background: var(--petalytics-surface);
      border-color: var(--petalytics-overlay);
      color: var(--petalytics-text);
    "
  >
    <span>{$currentTheme.name}</span>
    <ChevronDown size={16} class="ml-2" />
  </button>
  
  {#if isOpen}
    <div
      class="absolute top-full left-0 w-full mt-1 py-1 rounded-md border shadow-lg z-50"
      style="
        background: var(--petalytics-surface);
        border-color: var(--petalytics-overlay);
      "
    >
      {#each Object.entries(themePresets) as [key, theme]}
        <button
          onclick={() => selectTheme(key as keyof typeof themePresets)}
          class="w-full px-3 py-2 text-sm text-left hover:opacity-80 transition-opacity"
          style="color: var(--petalytics-text);"
          class:selected={$currentTheme.name === theme.name}
        >
          {theme.name}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .selected {
    background: var(--petalytics-highlight-med);
  }
</style>