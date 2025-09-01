import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// This is a placeholder API endpoint for pet management
// In a real application, this would connect to a database

let pets = [
	{
		id: '1',
		name: 'Buddy',
		species: 'Dog',
		breed: 'Golden Retriever',
		birthDate: new Date('2020-03-15'),
		weight: 30,
		guardianId: 'guardian-1',
		photoUrl: null,
		notes: 'Very friendly and energetic',
		createdAt: new Date('2023-01-01'),
		updatedAt: new Date('2023-01-01')
	}
];

export const GET: RequestHandler = async () => {
	try {
		return json({
			success: true,
			pets: pets
		});
	} catch (error) {
		console.error('Failed to fetch pets:', error);
		return json({
			success: false,
			error: 'Failed to fetch pets'
		}, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const petData = await request.json();
		
		const newPet = {
			id: Date.now().toString(),
			...petData,
			createdAt: new Date(),
			updatedAt: new Date()
		};
		
		pets.push(newPet);
		
		return json({
			success: true,
			pet: newPet
		}, { status: 201 });
		
	} catch (error) {
		console.error('Failed to create pet:', error);
		return json({
			success: false,
			error: 'Failed to create pet'
		}, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ request, url }) => {
	try {
		const petId = url.searchParams.get('id');
		const updates = await request.json();
		
		const petIndex = pets.findIndex(p => p.id === petId);
		if (petIndex === -1) {
			return json({
				success: false,
				error: 'Pet not found'
			}, { status: 404 });
		}
		
		pets[petIndex] = {
			...pets[petIndex],
			...updates,
			updatedAt: new Date()
		};
		
		return json({
			success: true,
			pet: pets[petIndex]
		});
		
	} catch (error) {
		console.error('Failed to update pet:', error);
		return json({
			success: false,
			error: 'Failed to update pet'
		}, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ url }) => {
	try {
		const petId = url.searchParams.get('id');
		
		const petIndex = pets.findIndex(p => p.id === petId);
		if (petIndex === -1) {
			return json({
				success: false,
				error: 'Pet not found'
			}, { status: 404 });
		}
		
		pets.splice(petIndex, 1);
		
		return json({
			success: true,
			message: 'Pet deleted successfully'
		});
		
	} catch (error) {
		console.error('Failed to delete pet:', error);
		return json({
			success: false,
			error: 'Failed to delete pet'
		}, { status: 500 });
	}
};