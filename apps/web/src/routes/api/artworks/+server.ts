import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

function extFromFile(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase();
  if (fromName && fromName.length <= 5) return fromName;
  const ct = file.type.toLowerCase();
  if (ct.includes('jpeg')) return 'jpg';
  if (ct.includes('png')) return 'png';
  if (ct.includes('webp')) return 'webp';
  return 'bin';
}

export const GET: RequestHandler = async ({ locals }) => {
  const session = await locals.getSession();
  if (!session) throw error(401, 'Unauthorized');

  const { data, error: dbErr } = await locals.supabase
    .from('artworks')
    .select(
      `
      id,
      image_path,
      museum_name,
      museum_city,
      museum_country,
      saw_date,
      opinion,
      status,
      created_at,
      selected_candidate_id,
      painting_candidates (
        id, rank, confidence,
        artist, title, date_created, location_painted, style, medium, source
      )
    `
    )
    .order('created_at', { ascending: false });

  if (dbErr) throw error(500, dbErr.message);

  const withUrls =
    data?.map((a) => {
      const { data: urlData } = locals.supabase.storage
        .from('artworks')
        .getPublicUrl(a.image_path);
      return { ...a, image_url: urlData.publicUrl };
    }) ?? [];

  return json({ artworks: withUrls });
};

export const POST: RequestHandler = async ({ request, locals }) => {
  const session = await locals.getSession();
  if (!session) throw error(401, 'Unauthorized');

  const form = await request.formData();
  const file = form.get('image');
  if (!(file instanceof File)) throw error(400, 'image is required');

  const museum_name = String(form.get('museum_name') ?? '').trim();
  const museum_city = String(form.get('museum_city') ?? '').trim();
  const museum_country = String(form.get('museum_country') ?? '').trim();
  const saw_date = String(form.get('saw_date') ?? '').trim();
  const opinion = String(form.get('opinion') ?? '').trim();
  const textSignalsRaw = String(form.get('textSignals') ?? '').trim();

  if (!museum_name) throw error(400, 'museum_name is required');

  let textSignals: unknown = undefined;
  if (textSignalsRaw) {
    try {
      textSignals = JSON.parse(textSignalsRaw);
    } catch {
      textSignals = undefined;
    }
  }

  const artworkId = crypto.randomUUID();
  const path = `${session.user.id}/${artworkId}.${extFromFile(file)}`;

  const buf = new Uint8Array(await file.arrayBuffer());
  const { error: uploadErr } = await locals.supabase.storage
    .from('artworks')
    .upload(path, buf, { contentType: file.type, upsert: false });

  if (uploadErr) throw error(500, uploadErr.message);

  const { data: inserted, error: insertErr } = await locals.supabase
    .from('artworks')
    .insert({
      id: artworkId,
      user_id: session.user.id,
      image_path: path,
      museum_name,
      museum_city: museum_city || null,
      museum_country: museum_country || null,
      saw_date: saw_date ? saw_date : null,
      opinion: opinion || null,
      status: 'pending_identification'
    })
    .select('*')
    .single();

  if (insertErr) throw error(500, insertErr.message);

  // Kick off identification (best-effort; don't fail upload if it errors)
  const identify = await locals.supabase.functions.invoke('identify-painting', {
    body: {
      artworkId,
      imageUrl: locals.supabase.storage.from('artworks').getPublicUrl(path).data.publicUrl,
      museum_name,
      museum_city,
      museum_country,
      textSignals
    }
  });

  return json({
    artwork: inserted,
    identify: identify.error ? { error: identify.error.message } : identify.data
  });
};


