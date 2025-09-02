import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Weekly summary endpoint (scaffold). Uses lightweight client-like heuristics to avoid API usage.
export const POST: RequestHandler = async ({ request }) => {
  try {
    const { pet } = await request.json();
    const journal = (pet?.journalEntries || []) as any[];
    const last7 = journal.filter((e) => {
      const d = new Date(e.date as any).getTime();
      return Date.now() - d <= 7 * 24 * 60 * 60 * 1000;
    });
    const energy = last7.reduce((acc, e) => acc + (e.activityLevel === 'high' ? 2 : e.activityLevel === 'low' ? 0 : 1), 0);
    const appetite = last7.filter((e) => /eat|appetite|food/i.test(e.content)).length;
    const social = last7.filter((e) => /play|walk|cuddle|sing|interaction|social/i.test(e.content)).length;
    const trend = energy > last7.length ? 'improving' : energy < last7.length ? 'declining' : 'flat';
    return json({
      success: true,
      data: {
        title: `${pet?.name || 'Pet'}'s patterns (7 days)`,
        energy: trend,
        appetite: `${Math.round((appetite / Math.max(1, last7.length)) * 100)}% entries mention food`,
        social: social > last7.length / 2 ? 'normal' : 'reduced',
      },
    });
  } catch (e) {
    return json({ success: false, error: 'Failed to compute summary' }, { status: 500 });
  }
};
