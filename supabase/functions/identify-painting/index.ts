// Supabase Edge Function: identify-painting
// Free-first identification: uses public datasets (AIC, Met) + optional Wikidata enrichment.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

type IdentifyRequest = {
  artworkId: string;
  imageUrl?: string;
  museum_name?: string;
  museum_city?: string;
  museum_country?: string;
  textSignals?: {
    caption?: string;
    ocrText?: string;
    keywords?: string[];
  };
};

type Candidate = {
  source: 'aic' | 'met';
  confidence: number;
  artist?: string | null;
  title?: string | null;
  date_created?: string | null;
  location_painted?: string | null;
  style?: string | null;
  medium?: string | null;
  raw_json?: unknown;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
      'access-control-allow-methods': 'POST, OPTIONS'
    }
  });
}

function norm(s: string | null | undefined): string {
  return (s ?? '').toLowerCase().trim();
}

function scoreCandidate(
  c: Candidate,
  queryText: string,
  museumText: string
): number {
  const hay = `${c.title ?? ''} ${c.artist ?? ''} ${c.style ?? ''} ${c.medium ?? ''}`.toLowerCase();
  const tokens = queryText
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
  let score = 0;
  for (const t of tokens) {
    if (t.length < 3) continue;
    if (hay.includes(t)) score += 1;
  }
  // Mild museum bias (free heuristic)
  if (museumText.includes('chicago') && c.source === 'aic') score += 2;
  if (museumText.includes('met') && c.source === 'met') score += 2;
  if (museumText.includes('metropolitan') && c.source === 'met') score += 2;
  return score;
}

async function fetchAicCandidates(query: string): Promise<Candidate[]> {
  const url =
    'https://api.artic.edu/api/v1/artworks/search?' +
    new URLSearchParams({
      q: query,
      fields:
        'id,title,artist_title,date_display,style_title,medium_display,place_of_origin,image_id',
      limit: '10'
    }).toString();

  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) return [];
  const json = (await res.json()) as any;
  const data = Array.isArray(json?.data) ? json.data : [];

  return data.map((a: any) => ({
    source: 'aic' as const,
    confidence: 0,
    artist: a.artist_title ?? null,
    title: a.title ?? null,
    date_created: a.date_display ?? null,
    location_painted: a.place_of_origin ?? null,
    style: a.style_title ?? null,
    medium: a.medium_display ?? null,
    raw_json: a
  }));
}

async function fetchMetCandidates(query: string): Promise<Candidate[]> {
  const searchUrl =
    'https://collectionapi.metmuseum.org/public/collection/v1/search?' +
    new URLSearchParams({ q: query, hasImages: 'true' }).toString();
  const sres = await fetch(searchUrl, { headers: { accept: 'application/json' } });
  if (!sres.ok) return [];
  const sjson = (await sres.json()) as any;
  const ids: number[] = Array.isArray(sjson?.objectIDs) ? sjson.objectIDs.slice(0, 10) : [];

  const out: Candidate[] = [];
  for (const id of ids) {
    const ores = await fetch(
      `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`,
      { headers: { accept: 'application/json' } }
    );
    if (!ores.ok) continue;
    const o = (await ores.json()) as any;
    out.push({
      source: 'met',
      confidence: 0,
      artist: o?.artistDisplayName ?? null,
      title: o?.title ?? null,
      date_created: o?.objectDate ?? null,
      location_painted: o?.city || o?.country || o?.region || null,
      style: o?.period || o?.style || o?.culture || null,
      medium: o?.medium ?? null,
      raw_json: o
    });
  }

  return out;
}

async function enrichFromWikidata(title?: string | null, artist?: string | null) {
  // Best-effort enrichment; safe to fail.
  const t = norm(title);
  const a = norm(artist);
  if (!t || !a) return null;

  const sparql = `
SELECT ?inception ?locationLabel ?styleLabel ?materialLabel WHERE {
  ?item rdfs:label ?titleLabel .
  FILTER(LANG(?titleLabel) = "en") .
  FILTER(CONTAINS(LCASE(STR(?titleLabel)), "${t.replace(/"/g, '\\"')}")) .
  ?item wdt:P170 ?creator .
  ?creator rdfs:label ?creatorLabel .
  FILTER(LANG(?creatorLabel) = "en") .
  FILTER(CONTAINS(LCASE(STR(?creatorLabel)), "${a.replace(/"/g, '\\"')}")) .
  OPTIONAL { ?item wdt:P571 ?inception . }
  OPTIONAL { ?item wdt:P1071 ?location . }
  OPTIONAL { ?item wdt:P136 ?style . }
  OPTIONAL { ?item wdt:P186 ?material . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 1
`;

  const url =
    'https://query.wikidata.org/sparql?' +
    new URLSearchParams({ format: 'json', query: sparql }).toString();

  const res = await fetch(url, {
    headers: {
      accept: 'application/sparql-results+json',
      'user-agent': 'PhenomenologicalArtGallery/0.1 (SupabaseEdgeFunction)'
    }
  });
  if (!res.ok) return null;
  const json = (await res.json()) as any;
  const b = json?.results?.bindings?.[0];
  if (!b) return null;
  return {
    inception: b.inception?.value ?? null,
    locationLabel: b.locationLabel?.value ?? null,
    styleLabel: b.styleLabel?.value ?? null,
    materialLabel: b.materialLabel?.value ?? null
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return jsonResponse({ ok: true }, 200);
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse({ error: 'Missing Supabase env' }, 500);
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } }
  });
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: userData, error: userErr } = await userClient.auth.getUser();
  const userId = userData?.user?.id;
  if (userErr || !userId) return jsonResponse({ error: 'Unauthorized' }, 401);

  let body: IdentifyRequest;
  try {
    body = (await req.json()) as IdentifyRequest;
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  if (!body.artworkId) return jsonResponse({ error: 'artworkId is required' }, 400);

  const { data: artwork, error: artErr } = await adminClient
    .from('artworks')
    .select('id,user_id,museum_name,museum_city,museum_country')
    .eq('id', body.artworkId)
    .maybeSingle();

  if (artErr || !artwork) return jsonResponse({ error: 'Artwork not found' }, 404);
  if (artwork.user_id !== userId) return jsonResponse({ error: 'Forbidden' }, 403);

  const museumText = `${body.museum_name ?? artwork.museum_name ?? ''} ${body.museum_city ?? artwork.museum_city ?? ''} ${body.museum_country ?? artwork.museum_country ?? ''}`.trim();
  const signalsText = `${body.textSignals?.caption ?? ''}\n${body.textSignals?.ocrText ?? ''}\n${(body.textSignals?.keywords ?? []).join(' ')}`.trim();
  const queryText = `${museumText} ${signalsText}`.trim() || museumText || 'painting';
  const queryShort = queryText.split(/\s+/).slice(0, 12).join(' ');

  // Gather candidates from datasets
  const [aic, met] = await Promise.allSettled([
    fetchAicCandidates(queryShort),
    fetchMetCandidates(queryShort)
  ]);

  const candidates: Candidate[] = [
    ...(aic.status === 'fulfilled' ? aic.value : []),
    ...(met.status === 'fulfilled' ? met.value : [])
  ];

  // Score + pick top 3 unique by (source,title,artist)
  const scored = candidates
    .map((c) => {
      const s = scoreCandidate(c, queryShort, museumText);
      return { ...c, confidence: Math.max(0, Math.min(1, s / 10)) };
    })
    .sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));

  const unique: Candidate[] = [];
  const seen = new Set<string>();
  for (const c of scored) {
    const key = `${c.source}|${norm(c.title)}|${norm(c.artist)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(c);
    if (unique.length >= 3) break;
  }

  // Enrich (best-effort) and persist
  try {
    await adminClient.from('painting_candidates').delete().eq('artwork_id', body.artworkId);

    const rows = [];
    for (let i = 0; i < unique.length; i++) {
      const c = unique[i];
      const enrich = await enrichFromWikidata(c.title, c.artist);
      rows.push({
        artwork_id: body.artworkId,
        rank: i + 1,
        confidence: c.confidence,
        artist: c.artist,
        title: c.title,
        date_created: c.date_created ?? enrich?.inception ?? null,
        location_painted: c.location_painted ?? enrich?.locationLabel ?? null,
        style: c.style ?? enrich?.styleLabel ?? null,
        medium: c.medium ?? enrich?.materialLabel ?? null,
        source: c.source,
        raw_json: c.raw_json
      });
    }

    if (rows.length > 0) {
      await adminClient.from('painting_candidates').insert(rows);
      await adminClient
        .from('artworks')
        .update({ status: 'candidates_ready' })
        .eq('id', body.artworkId);
    } else {
      await adminClient.from('artworks').update({ status: 'error' }).eq('id', body.artworkId);
    }
  } catch {
    await adminClient.from('artworks').update({ status: 'error' }).eq('id', body.artworkId);
  }

  const { data: stored } = await adminClient
    .from('painting_candidates')
    .select('id,rank,confidence,artist,title,date_created,location_painted,style,medium,source')
    .eq('artwork_id', body.artworkId)
    .order('rank', { ascending: true });

  return jsonResponse({ artworkId: body.artworkId, candidates: stored ?? [] });
});


