export interface Guardian {
	id: string;
	name: string;
	email: string;
	phoneNumber?: string;
	address?: string;
	emergencyContact?: {
		name: string;
		phone: string;
		relationship: string;
	};
	preferences: {
		theme: 'light' | 'dark' | 'auto';
		notifications: boolean;
		language: string;
	};
	createdAt: Date;
	updatedAt: Date;
}