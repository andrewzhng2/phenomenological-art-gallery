import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const username = params.username;
  if (!username) throw error(400, 'Missing username');

  const [{ data: profile, error: pErr }, { data: gallery, error: gErr }] = await Promise.all([
    locals.supabase.rpc('get_public_profile', { p_username: username }).maybeSingle(),
    locals.supabase.rpc('get_public_gallery', { p_username: username })
  ]);

  if (pErr) throw error(500, pErr.message);
  if (!profile) throw error(404, 'Not found');
  if (gErr) throw error(500, gErr.message);

  const artworks =
    gallery?.map((a: any) => ({
      ...a,
      image_url: locals.supabase.storage.from('artworks').getPublicUrl(a.image_path).data.publicUrl
    })) ?? [];

  return { profile, artworks };
};


