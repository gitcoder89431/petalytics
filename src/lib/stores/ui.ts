import { writable } from 'svelte/store';

export type RightPanelView = 'dashboard' | 'journal' | 'history' | 'memories' | 'confirmArchive' | 'dataManager';

export const rightPanelView = writable<RightPanelView>('dashboard');

// Global flag to open the create-pet form from anywhere (e.g., right panel EmptyState)
export const createPetFormOpen = writable<boolean>(false);

export const uiHelpers = {
  setView(view: RightPanelView) {
    rightPanelView.set(view);
  },
  setCreatePetFormOpen(open: boolean) {
    createPetFormOpen.set(open);
  },
  openCreatePetForm() {
    createPetFormOpen.set(true);
  },
  closeCreatePetForm() {
    createPetFormOpen.set(false);
  }
};
