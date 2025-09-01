export interface Guardian {
	id?: string;
	name: string;
	email?: string;
	phoneNumber?: string;
	address?: string;
	emergencyContact?: {
		name: string;
		phone: string;
		relationship: string;
	};
	apiKey: string;
	model?: string;
	preferences: {
		dailyReminders: boolean;
		aiInsights: boolean;
		notifications: boolean;
	};
	apiKeyValid?: boolean;
	createdAt?: Date;
	updatedAt?: Date;
}
