# Supabase

This directory contains:

- `migrations/`: SQL migrations to create tables, RLS policies, and helper functions.
- `functions/`: Supabase Edge Functions (Deno) used for painting identification.

## Local development

Use the Supabase CLI to run Postgres/Auth/Storage locally and deploy migrations/functions.

Recommended workflow:

- `supabase init`
- `supabase start`
- `supabase db reset`
- `supabase functions serve`

See the root [`README.md`](../README.md) for app setup.


