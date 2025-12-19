# phenomenological-art-gallery

Stack: SvelteKit (Vite) + Supabase (Postgres, Auth, Storage, Edge Functions)

The Phenomenological Art Gallery is a place built for art-lovers to upload images of paintings they’ve encountered, and the app identifies the work (artist, title, year, medium, location) to generate a museum-style “plaque” and frame—treating the photo as both documentation and a fresh aesthetic object. The result is a personal gallery that captures not just what you saw, but how you encountered it. (Also allowing you to flex your artsy-romanticism side of your life)

This is a full-stack web app I wanted to build to showcase my interest in physical paintings and also learn the Svelte framework. The idea is inspired by phenomenology—the philosophy of lived experience and perception. It asks: if you photograph a painting, are you still experiencing “the painting,” or a new artwork altogether? Is a picture of a painting still a painting?

## Monorepo layout

- `apps/web`: SvelteKit app (UI + server routes)
- `supabase`: migrations + Edge Functions

## Local development

### Prereqs

- Node.js 20+
- Supabase CLI (for local Postgres/Auth/Storage + Edge Functions)

### Environment

Copy `env.example` to `.env` and fill in your Supabase keys.

SvelteKit reads:

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`

### Run the web app

```bash
cd apps/web
npm run dev
```

