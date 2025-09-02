import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Server-side proxy to OpenRouter chat completions to avoid CORS and keep headers consistent
export const POST: RequestHandler = async ({ request, fetch }) => {
	try {
		const body = await request.json();
		const { apiKey, model, messages, max_tokens, temperature, top_p, stop } = body || {};

		if (!apiKey || typeof apiKey !== 'string') {
			return json({ error: 'Missing apiKey' }, { status: 400 });
		}

		const origin = request.headers.get('origin') || undefined;
		const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
				...(origin ? { 'HTTP-Referer': origin } : {}),
				'X-Title': 'Petalytics',
			},
			body: JSON.stringify({
				model,
				messages,
				max_tokens,
				temperature,
				top_p,
				stop,
			}),
		});

		const text = await resp.text();
		if (!resp.ok) {
			return json(
				{ error: 'Upstream error', status: resp.status, body: text },
				{ status: resp.status }
			);
		}
		// Pass through upstream JSON
		try {
			const data = JSON.parse(text);
			return json(data);
		} catch {
			return json({ error: 'Invalid JSON from upstream', body: text }, { status: 502 });
		}
	} catch (error: any) {
		console.error('AI proxy error:', error);
		return json(
			{ error: 'Proxy failure', detail: String(error?.message || error) },
			{ status: 500 }
		);
	}
};
