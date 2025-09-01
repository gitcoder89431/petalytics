import { writable } from 'svelte/store';

export interface Toast {
	id: string;
	type: 'success' | 'error' | 'warning' | 'info';
	title: string;
	message?: string;
	duration?: number;
}

export const toasts = writable<Toast[]>([]);

export const toast = {
	success: (title: string, message?: string, duration = 4000) => {
		addToast({ type: 'success', title, message, duration });
	},
	error: (title: string, message?: string, duration = 6000) => {
		addToast({ type: 'error', title, message, duration });
	},
	warning: (title: string, message?: string, duration = 5000) => {
		addToast({ type: 'warning', title, message, duration });
	},
	info: (title: string, message?: string, duration = 4000) => {
		addToast({ type: 'info', title, message, duration });
	},
	dismiss: (id: string) => {
		toasts.update((all) => all.filter((t) => t.id !== id));
	},
};

function addToast(toastData: Omit<Toast, 'id'>) {
	const id = Date.now().toString();
	const newToast: Toast = { id, ...toastData };
	
	toasts.update((all) => [newToast, ...all]);
	
	if (toastData.duration && toastData.duration > 0) {
		setTimeout(() => {
			toast.dismiss(id);
		}, toastData.duration);
	}
}
