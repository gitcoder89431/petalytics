// API utility functions for making HTTP requests

const API_BASE_URL = '/api';

interface ApiResponse<T> {
	data?: T;
	error?: string;
	success: boolean;
}

export class ApiError extends Error {
	constructor(
		public status: number,
		message: string
	) {
		super(message);
		this.name = 'ApiError';
	}
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
	try {
		const response = await fetch(`${API_BASE_URL}${endpoint}`, {
			headers: {
				'Content-Type': 'application/json',
				...options.headers,
			},
			...options,
		});

		const data = await response.json();

		if (!response.ok) {
			throw new ApiError(response.status, data.error || 'Request failed');
		}

		return { data, success: true };
	} catch (error) {
		console.error('API request failed:', error);
		return {
			error: error instanceof Error ? error.message : 'Unknown error',
			success: false,
		};
	}
}

export const api = {
	// GET request
	get<T>(endpoint: string): Promise<ApiResponse<T>> {
		return apiRequest<T>(endpoint, { method: 'GET' });
	},

	// POST request
	post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
		return apiRequest<T>(endpoint, {
			method: 'POST',
			body: JSON.stringify(data),
		});
	},

	// PUT request
	put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
		return apiRequest<T>(endpoint, {
			method: 'PUT',
			body: JSON.stringify(data),
		});
	},

	// DELETE request
	delete<T>(endpoint: string): Promise<ApiResponse<T>> {
		return apiRequest<T>(endpoint, { method: 'DELETE' });
	},

	// Upload file
	upload<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
		return apiRequest<T>(endpoint, {
			method: 'POST',
			body: formData,
			headers: {}, // Don't set Content-Type for FormData
		});
	},
};
