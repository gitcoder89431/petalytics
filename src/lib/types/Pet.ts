export interface Pet {
	id: string;
	name: string;
	species: string;
	breed?: string;
	birthDate: Date;
	weight?: number;
	guardianId: string;
	photoUrl?: string;
	notes?: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface PetStats {
	totalEntries: number;
	lastEntry: Date | null;
	healthScore: number;
}