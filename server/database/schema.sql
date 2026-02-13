-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: periods
create table if not exists periods (
    id int primary key,
    name text not null,
    start_date date,
    end_date date,
    weeks int,
    quarter text,
    status text default 'pending',
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Table: stores
create table if not exists stores (
    code text primary key,
    name text not null,
    opening_date date,
    area numeric,
    visible boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Table: store_settings
-- Stores JSON configuration for each store (hiddenGroups, highlights etc.)
create table if not exists store_settings (
    store_code text primary key references stores(code),
    settings jsonb not null default '{}'::jsonb,
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Table: comments
create table if not exists comments (
    key text primary key, -- Format: storeCode_tableName
    store_code text references stores(code),
    table_name text,
    text text not null,
    author text,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Table: period_data
-- Stores the parsed data for each period and type (px/ytd)
-- We store the raw rows as JSONB array to avoid complex schema changes 
-- when CSV columns change.
create table if not exists period_data (
    id uuid primary key default uuid_generate_v4(),
    period_id int references periods(id),
    type text check (type in ('px', 'ytd')),
    data jsonb not null default '[]'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    unique(period_id, type)
);

-- Table: data_files
-- Tracks uploaded filenames for reference
create table if not exists data_files (
    id uuid primary key default uuid_generate_v4(),
    period_id int references periods(id),
    type text check (type in ('px', 'ytd')),
    filename text,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    unique(period_id, type)
);

-- Table: table_visibility
-- Global table visibility settings
create table if not exists table_visibility (
    id int primary key default 1, -- Singleton row
    settings jsonb not null default '{}'::jsonb,
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Seed Initial Periods (from existing JSON)
insert into periods (id, name, start_date, end_date, weeks, quarter) values
(1, 'Periyot 1', '2025-12-26', '2026-01-22', 4, 'Q1'),
(2, 'Periyot 2', '2026-01-23', '2026-02-19', 4, 'Q1'),
(3, 'Periyot 3', '2026-02-20', '2026-03-26', 5, 'Q1'),
(4, 'Periyot 4', '2026-03-27', '2026-04-23', 4, 'Q2'),
(5, 'Periyot 5', '2026-04-24', '2026-05-21', 4, 'Q2'),
(6, 'Periyot 6', '2026-05-22', '2026-06-25', 5, 'Q2'),
(7, 'Periyot 7', '2026-06-26', '2026-07-23', 4, 'Q3'),
(8, 'Periyot 8', '2026-07-24', '2026-08-20', 4, 'Q3'),
(9, 'Periyot 9', '2026-08-21', '2026-09-24', 5, 'Q3'),
(10, 'Periyot 10', '2026-09-25', '2026-10-22', 4, 'Q4'),
(11, 'Periyot 11', '2026-10-23', '2026-11-19', 4, 'Q4'),
(12, 'Periyot 12', '2026-11-20', '2026-12-31', 6, 'Q4')
on conflict (id) do nothing;

-- RLS Policies (Updated for full access for now)
alter table periods enable row level security;
drop policy if exists "Public access" on periods;
create policy "Public access" on periods for all using (true) with check (true);

alter table stores enable row level security;
drop policy if exists "Public access" on stores;
create policy "Public access" on stores for all using (true) with check (true);

alter table store_settings enable row level security;
drop policy if exists "Public access" on store_settings;
create policy "Public access" on store_settings for all using (true) with check (true);

alter table comments enable row level security;
drop policy if exists "Public access" on comments;
create policy "Public access" on comments for all using (true) with check (true);

alter table period_data enable row level security;
drop policy if exists "Public access" on period_data;
create policy "Public access" on period_data for all using (true) with check (true);

alter table data_files enable row level security;
drop policy if exists "Public access" on data_files;
create policy "Public access" on data_files for all using (true) with check (true);

alter table table_visibility enable row level security;
drop policy if exists "Public access" on table_visibility;
create policy "Public access" on table_visibility for all using (true) with check (true);
