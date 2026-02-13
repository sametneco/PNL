-- Run this SQL in Supabase SQL Editor to fix permission errors
-- This updates the Row Level Security (RLS) policies to allow INSERT operations

-- Comments Table
drop policy if exists "Public access" on comments;
create policy "Public access" on comments for all using (true) with check (true);

-- Store Settings Table
drop policy if exists "Public access" on store_settings;
create policy "Public access" on store_settings for all using (true) with check (true);

-- Period Data Table
drop policy if exists "Public access" on period_data;
create policy "Public access" on period_data for all using (true) with check (true);

-- Stores Table
drop policy if exists "Public read access" on stores;
drop policy if exists "Public insert/update" on stores;
drop policy if exists "Public access" on stores;
create policy "Public access" on stores for all using (true) with check (true);

-- Periods Table
drop policy if exists "Public read access" on periods;
drop policy if exists "Public access" on periods;
create policy "Public access" on periods for all using (true) with check (true);

-- Data Files Table
drop policy if exists "Public access" on data_files;
create policy "Public access" on data_files for all using (true) with check (true);

-- Table Visibility
drop policy if exists "Public access" on table_visibility;
create policy "Public access" on table_visibility for all using (true) with check (true);
