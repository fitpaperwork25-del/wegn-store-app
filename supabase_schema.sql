-- Wegn-Store: initial database schema
-- Run this in Supabase Dashboard > SQL Editor

-- 1. Create table
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_name text,
  status text default 'Active',
  created_at timestamptz default now()
);

-- 2. Enable Row Level Security
alter table public.businesses enable row level security;

-- 3. Policy: allow authenticated users to read businesses
create policy "Allow authenticated read access"
  on public.businesses
  for select
  to authenticated
  using (true);

-- 4. Insert sample record
insert into public.businesses (name, owner_name, status)
values ('Dilla Market', 'Michael', 'Active');

-- 5. Verification queries
select * from public.businesses;

select column_name, data_type, column_default, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'businesses'
order by ordinal_position;
