import { writable } from 'svelte/store';

export type RightPanelView = 'dashboard' | 'journal' | 'history' | 'memories' | 'confirmArchive';

export const rightPanelView = writable<RightPanelView>('dashboard');

export const uiHelpers = {
  setView(view: RightPanelView) {
    rightPanelView.set(view);
  }
};
