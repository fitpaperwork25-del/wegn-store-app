-- Create inventory_batches table for expiration and lot tracking
create table if not exists public.inventory_batches (
  id                          uuid primary key default gen_random_uuid(),
  business_id                 uuid not null references public.businesses(id) on delete cascade,
  product_id                  uuid not null references public.products(id) on delete cascade,
  receiving_session_id        uuid references public.receiving_sessions(id) on delete set null,
  receiving_session_item_id   uuid references public.receiving_items(id) on delete set null,
  supplier_id                 uuid references public.suppliers(id) on delete set null,
  supplier_name               text,
  batch_number                text,
  lot_number                  text,
  manufactured_date           date,
  expiration_date             date,
  quantity_received           numeric not null default 0,
  quantity_remaining          numeric not null default 0,
  unit_cost                   numeric,
  status                      text not null default 'active'
                                check (status in ('active', 'expired', 'consumed', 'written_off')),
  created_at                  timestamptz not null default now()
);

create index if not exists idx_inventory_batches_business    on public.inventory_batches (business_id);
create index if not exists idx_inventory_batches_product     on public.inventory_batches (product_id);
create index if not exists idx_inventory_batches_expiration  on public.inventory_batches (expiration_date) where expiration_date is not null;
create index if not exists idx_inventory_batches_status      on public.inventory_batches (status);
create index if not exists idx_inventory_batches_session     on public.inventory_batches (receiving_session_id);

alter table public.inventory_batches enable row level security;

create policy "Users can manage their own business batches"
  on public.inventory_batches
  for all
  to authenticated
  using (
    business_id in (
      select id from public.businesses where owner_id = auth.uid()
    )
  )
  with check (
    business_id in (
      select id from public.businesses where owner_id = auth.uid()
    )
  );
