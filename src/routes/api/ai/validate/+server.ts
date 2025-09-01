import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { apiKey } = await request.json();

		if (!apiKey || !apiKey.startsWith('sk-or-')) {
			return json({ valid: false, error: 'Invalid API key format' }, { status: 400 });
		}

		// Test API key with a simple request to OpenRouter
		const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
				'HTTP-Referer': 'https://petalytics.vercel.app',
				'X-Title': 'Petalytics'
			},
			body: JSON.stringify({
				model: 'openai/gpt-3.5-turbo',
				messages: [{ role: 'user', content: 'test' }],
				max_tokens: 1
			})
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