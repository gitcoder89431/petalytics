import { writable } from 'svelte/store';

export type RightPanelView = 'dashboard' | 'journal' | 'history' | 'memorial' | 'confirmArchive';

export const rightPanelView = writable<RightPanelView>('dashboard');

export const uiHelpers = {
  setView(view: RightPanelView) {
    rightPanelView.set(view);
  }
};
