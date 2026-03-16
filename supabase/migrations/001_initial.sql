-- Profiles table (linked to auth.users via id)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  handle text unique,
  avatar_url text,
  links jsonb default '[]'::jsonb,
  pinned_post_ids uuid[] default '{}',
  gallery_order uuid[] default '{}',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Posts table
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  caption text,
  media_url text not null,
  media_type text default 'image',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Galleries / series
create table if not exists public.galleries (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Gallery items (link posts into a gallery)
create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.galleries (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  position integer default 0
);

-- Basic Row Level Security
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.galleries enable row level security;
alter table public.gallery_items enable row level security;

-- Profiles: users can view all, update own
create policy "Public read profiles" on public.profiles
  for select using (true);

create policy "Users manage own profile" on public.profiles
  for all using (auth.uid() = id);

-- Posts: public read, owners manage
create policy "Public read posts" on public.posts
  for select using (true);

create policy "Users manage own posts" on public.posts
  for all using (auth.uid() = author_id);

-- Galleries: public read, owners manage
create policy "Public read galleries" on public.galleries
  for select using (true);

create policy "Users manage own galleries" on public.galleries
  for all using (auth.uid() = author_id);

-- Gallery items: public read, gallery owner manage
create policy "Public read gallery_items" on public.gallery_items
  for select using (true);

create policy "Gallery owner manages items" on public.gallery_items
  for all using (
    exists (
      select 1
      from public.galleries g
      where g.id = gallery_id
        and g.author_id = auth.uid()
    )
  );

