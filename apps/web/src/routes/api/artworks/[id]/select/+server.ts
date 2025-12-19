import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, locals }) => {
  const session = await locals.getSession();
  if (!session) throw error(401, 'Unauthorized');

  const body = (await request.json().catch(() => null)) as { candidateId?: string } | null;
  const candidateId = body?.candidateId;
  if (!candidateId) throw error(400, 'candidateId is required');

  // Ensure candidate belongs to this artwork
  const { data: candidate, error: candErr } = await locals.supabase
    .from('painting_candidates')
    .select('id,artwork_id')
    .eq('id', candidateId)
    .maybeSingle();
  if (candErr) throw error(500, candErr.message);
  if (!candidate || candidate.artwork_id !== params.id) throw error(400, 'Invalid candidateId');

  const { data: updated, error: updErr } = await locals.supabase
    .from('artworks')
    .update({ selected_candidate_id: candidateId, status: 'confirmed' })
    .eq('id', params.id)
    .select('*')
    .single();

  if (updErr) throw error(500, updErr.message);
  return json({ artwork: updated });
};


