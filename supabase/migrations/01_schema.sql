-- Supabase Migration: 01_schema.sql
-- Run this in your Supabase SQL Editor to initialize the database tables, triggers, and RLS policies.

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2. TABLES

-- profiles (extends auth.users, auto-populated by a trigger on signup)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  is_admin boolean default false,
  created_at timestamptz default now()
);

-- genres/categories
create table if not exists public.genres (
  id uuid primary key default gen_random_uuid(),
  name text unique not null
);

-- songs
create table if not exists public.songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null,
  genre_id uuid references public.genres(id) on delete set null,
  description text,
  cover_image_url text,
  preview_storage_path text not null,   -- public bucket, 30s clip
  full_storage_path text not null,      -- private bucket, full track
  price numeric(10,2) not null,
  duration_seconds int,
  is_featured boolean default false,
  is_published boolean default true,
  created_at timestamptz default now()
);

-- orders (one per checkout, may contain multiple songs)
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  razorpay_order_id text unique not null,
  razorpay_payment_id text,
  status text not null default 'created', -- created | paid | failed
  total_amount numeric(10,2) not null,
  created_at timestamptz default now()
);

-- order_items (which songs were in the order)
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  song_id uuid references public.songs(id) on delete cascade,
  price numeric(10,2) not null
);

-- purchases (flattened "what does this user own" table, written after payment confirmed)
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  song_id uuid references public.songs(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  purchased_at timestamptz default now(),
  unique(user_id, song_id)
);

-- 3. HELPER FUNCTIONS

-- Helper function to check if the current user is an admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
end;
$$ language plpgsql security definer;

-- Trigger function to automatically create a profile when a new user signs up in auth.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone, is_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    false
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to execute the profile creator
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;
alter table public.genres enable row level security;
alter table public.songs enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.purchases enable row level security;

-- Profiles Policies
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Admins can view all profiles" on public.profiles
  for select using (public.is_admin());

create policy "Admins can update all profiles" on public.profiles
  for update using (public.is_admin());

-- Genres Policies
create policy "Anyone can view genres" on public.genres
  for select using (true);

create policy "Admins can insert genres" on public.genres
  for insert with check (public.is_admin());

create policy "Admins can update genres" on public.genres
  for update using (public.is_admin());

create policy "Admins can delete genres" on public.genres
  for delete using (public.is_admin());

-- Songs Policies
create policy "Anyone can view published songs" on public.songs
  for select using (is_published = true or public.is_admin());

create policy "Admins can do everything on songs" on public.songs
  for all using (public.is_admin());

-- Orders Policies (Backend uses service role which bypasses RLS)
create policy "Users can view own orders" on public.orders
  for select using (user_id = auth.uid() or public.is_admin());

-- Order Items Policies
create policy "Users can view own order items" on public.order_items
  for select using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id and (orders.user_id = auth.uid() or public.is_admin())
    )
  );

-- Purchases Policies
create policy "Users can view own purchases" on public.purchases
  for select using (user_id = auth.uid() or public.is_admin());
