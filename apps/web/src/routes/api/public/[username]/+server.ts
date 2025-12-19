import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
  const username = params.username;
  if (!username) throw error(400, 'username is required');

  const [{ data: profile, error: pErr }, { data: gallery, error: gErr }] = await Promise.all([
    locals.supabase.rpc('get_public_profile', { p_username: username }).maybeSingle(),
    locals.supabase.rpc('get_public_gallery', { p_username: username })
  ]);

  if (pErr) throw error(500, pErr.message);
  if (!profile) throw error(404, 'Profile not found');
  if (gErr) throw error(500, gErr.message);

  // Convert storage path to public URL (bucket is public)
  const galleryWithUrls =
    gallery?.map((a: any) => ({
      ...a,
      image_url: locals.supabase.storage.from('artworks').getPublicUrl(a.image_path).data.publicUrl
    })) ?? [];

  return json({ profile, artworks: galleryWithUrls });
};


