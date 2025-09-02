import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { apiKey } = await request.json();

		if (!apiKey || !apiKey.startsWith('sk-or-')) {
			return json({ valid: false, error: 'Invalid API key format' }, { status: 400 });
		}

		// Validate by listing models (no token usage, broadly allowed)
		const response = await fetch('https://openrouter.ai/api/v1/models', {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
				'X-Title': 'Petalytics',
			},
		});

		if (response.ok) {
			return json({ valid: true });
		} else {
			const error = await response.text();
			return json({ valid: false, error }, { status: 400 });
		}
	} catch (error) {
		return json({ valid: false, error: (error as Error).message }, { status: 500 });
	}
};
