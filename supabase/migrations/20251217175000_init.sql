-- Initial schema for The Phenomenological Art Gallery

-- Extensions
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  display_name text,
  birthday date,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Create a profile row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    -- fallback username (user can change later)
    concat('user_', substr(replace(new.id::text, '-', ''), 1, 12)),
    coalesce(new.raw_user_meta_data->>'display_name', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Public read helpers (age-only)
create or replace function public.get_public_profile(p_username text)
returns table (
  id uuid,
  username text,
  display_name text,
  age_years int,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    p.id,
    p.username,
    p.display_name,
    case
      when p.birthday is null then null
      else extract(year from age(current_date, p.birthday))::int
    end as age_years,
    p.created_at
  from public.profiles p
  where p.username = p_username
    and p.is_public = true;
$$;

-- ---------------------------------------------------------------------------
-- Artworks + candidates
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'artwork_status') then
    create type public.artwork_status as enum (
      'pending_identification',
      'candidates_ready',
      'confirmed',
      'error'
    );
  end if;
end
$$;

create table if not exists public.artworks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  image_path text not null,
  museum_name text not null,
  museum_city text,
  museum_country text,
  saw_date date,
  opinion text,
  status public.artwork_status not null default 'pending_identification',
  created_at timestamptz not null default now()
);

create index if not exists artworks_user_id_idx on public.artworks (user_id);
create index if not exists artworks_created_at_idx on public.artworks (created_at desc);

alter table public.artworks enable row level security;

create policy "artworks_select_own"
on public.artworks
for select
to authenticated
using (auth.uid() = user_id);

create policy "artworks_insert_own"
on public.artworks
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "artworks_update_own"
on public.artworks
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "artworks_delete_own"
on public.artworks
for delete
to authenticated
using (auth.uid() = user_id);

create table if not exists public.painting_candidates (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid not null references public.artworks (id) on delete cascade,
  rank int not null check (rank between 1 and 3),
  confidence numeric,
  artist text,
  title text,
  date_created text,
  location_painted text,
  style text,
  medium text,
  source text,
  raw_json jsonb,
  created_at timestamptz not null default now(),
  unique (artwork_id, rank)
);

create index if not exists painting_candidates_artwork_id_idx on public.painting_candidates (artwork_id);

alter table public.painting_candidates enable row level security;

create policy "painting_candidates_select_own"
on public.painting_candidates
for select
to authenticated
using (
  exists (
    select 1
    from public.artworks a
    where a.id = painting_candidates.artwork_id
      and a.user_id = auth.uid()
  )
);

create policy "painting_candidates_insert_own"
on public.painting_candidates
for insert
to authenticated
with check (
  exists (
    select 1
    from public.artworks a
    where a.id = painting_candidates.artwork_id
      and a.user_id = auth.uid()
  )
);

create policy "painting_candidates_update_own"
on public.painting_candidates
for update
to authenticated
using (
  exists (
    select 1
    from public.artworks a
    where a.id = painting_candidates.artwork_id
      and a.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.artworks a
    where a.id = painting_candidates.artwork_id
      and a.user_id = auth.uid()
  )
);

create policy "painting_candidates_delete_own"
on public.painting_candidates
for delete
to authenticated
using (
  exists (
    select 1
    from public.artworks a
    where a.id = painting_candidates.artwork_id
      and a.user_id = auth.uid()
  )
);

-- Link artwork -> selected candidate (added after painting_candidates exists)
alter table public.artworks
add column if not exists selected_candidate_id uuid null references public.painting_candidates (id);

create index if not exists artworks_selected_candidate_id_idx on public.artworks (selected_candidate_id);

-- Public gallery read helper: only confirmed works with a selected candidate
create or replace function public.get_public_gallery(p_username text)
returns table (
  artwork_id uuid,
  image_path text,
  museum_name text,
  museum_city text,
  museum_country text,
  saw_date date,
  opinion text,
  created_at timestamptz,
  artist text,
  title text,
  date_created text,
  location_painted text,
  style text,
  medium text
)
language sql
security definer
set search_path = public
as $$
  select
    a.id as artwork_id,
    a.image_path,
    a.museum_name,
    a.museum_city,
    a.museum_country,
    a.saw_date,
    a.opinion,
    a.created_at,
    c.artist,
    c.title,
    c.date_created,
    c.location_painted,
    c.style,
    c.medium
  from public.profiles p
  join public.artworks a on a.user_id = p.id
  join public.painting_candidates c on c.id = a.selected_candidate_id
  where p.username = p_username
    and p.is_public = true
    and a.status = 'confirmed';
$$;

-- ---------------------------------------------------------------------------
-- Storage bucket for uploaded images (public, since galleries are public by default)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('artworks', 'artworks', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload/update/delete their own objects in the artworks bucket.
-- For public buckets, SELECT is effectively public already.
create policy "storage_artworks_insert_own"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'artworks' and owner = auth.uid());

create policy "storage_artworks_update_own"
on storage.objects
for update
to authenticated
using (bucket_id = 'artworks' and owner = auth.uid())
with check (bucket_id = 'artworks' and owner = auth.uid());

create policy "storage_artworks_delete_own"
on storage.objects
for delete
to authenticated
using (bucket_id = 'artworks' and owner = auth.uid());


