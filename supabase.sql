create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  owner_name text,
  shop_name text,
  created_at timestamptz not null default now(),
  last_sign_in_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists owner_name text;

alter table public.profiles enable row level security;

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create or replace function public.sync_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.profiles (
      id,
      email,
      owner_name,
      shop_name,
      created_at,
      last_sign_in_at
    )
    values (
      new.id,
      new.email,
      nullif(new.raw_user_meta_data ->> 'owner_name', ''),
      nullif(new.raw_user_meta_data ->> 'shop_name', ''),
      new.created_at,
      new.last_sign_in_at
    )
    on conflict (id) do update
    set
      email = excluded.email,
      owner_name = coalesce(excluded.owner_name, public.profiles.owner_name),
      shop_name = coalesce(excluded.shop_name, public.profiles.shop_name),
      last_sign_in_at = excluded.last_sign_in_at,
      updated_at = now();
  else
    update public.profiles
    set
      email = new.email,
      owner_name = coalesce(
        nullif(new.raw_user_meta_data ->> 'owner_name', ''),
        owner_name
      ),
      shop_name = coalesce(
        nullif(new.raw_user_meta_data ->> 'shop_name', ''),
        shop_name
      ),
      last_sign_in_at = new.last_sign_in_at,
      updated_at = now()
    where id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists sync_auth_user_profile on auth.users;

create trigger sync_auth_user_profile
after insert or update on auth.users
for each row
execute function public.sync_auth_user_profile();

update public.profiles as profile
set
  owner_name = nullif(auth_user.raw_user_meta_data ->> 'owner_name', ''),
  updated_at = now()
from auth.users as auth_user
where profile.id = auth_user.id
  and profile.owner_name is null
  and nullif(auth_user.raw_user_meta_data ->> 'owner_name', '') is not null;

create table if not exists public.shop_settings (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  shop_name text not null check (length(trim(shop_name)) between 1 and 80),
  default_low_stock_threshold integer not null default 5
    check (default_low_stock_threshold >= 0),
  expiry_warning_days integer not null default 7
    check (expiry_warning_days in (3, 7, 14)),
  currency_code text not null default 'INR'
    check (currency_code = 'INR'),
  inventory_initialized boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.shop_settings
  add column if not exists inventory_initialized boolean not null default false;

create table if not exists public.products (
  owner_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  name text not null check (length(trim(name)) between 1 and 80),
  quantity integer not null check (quantity >= 0),
  unit text not null check (length(trim(unit)) between 1 and 20),
  expiry_date date not null,
  low_stock_threshold integer check (low_stock_threshold is null or low_stock_threshold >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_id, id)
);

create index if not exists products_owner_expiry_idx
  on public.products (owner_id, expiry_date);

create table if not exists public.customers (
  owner_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  name text not null check (length(trim(name)) between 1 and 80),
  phone text not null check (length(trim(phone)) between 8 and 24),
  balance numeric(12, 2) not null default 0 check (balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_id, id)
);

create index if not exists customers_owner_updated_idx
  on public.customers (owner_id, updated_at desc);

alter table public.shop_settings enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;

revoke all on public.shop_settings, public.products, public.customers from anon, authenticated;
grant select, insert, update, delete on public.shop_settings, public.products, public.customers to authenticated;

drop policy if exists "Owners can manage their shop settings" on public.shop_settings;
create policy "Owners can manage their shop settings"
on public.shop_settings
for all
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

drop policy if exists "Owners can manage their products" on public.products;
create policy "Owners can manage their products"
on public.products
for all
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

drop policy if exists "Owners can manage their customers" on public.customers;
create policy "Owners can manage their customers"
on public.customers
for all
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create or replace function public.add_my_customer_udhaar(p_customer_id text, p_amount numeric)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_owner uuid := (select auth.uid());
  affected_rows integer;
begin
  if current_owner is null then
    raise exception 'Authentication is required';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Udhaar amount must be greater than zero';
  end if;

  update public.customers
  set balance = balance + p_amount, updated_at = now()
  where owner_id = current_owner and id = p_customer_id;

  get diagnostics affected_rows = row_count;
  if affected_rows = 0 then
    raise exception 'Customer not found';
  end if;
end;
$$;

create or replace function public.settle_my_customer_udhaar(p_customer_id text, p_amount numeric)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_owner uuid := (select auth.uid());
  affected_rows integer;
begin
  if current_owner is null then
    raise exception 'Authentication is required';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Payment amount must be greater than zero';
  end if;

  update public.customers
  set balance = balance - p_amount, updated_at = now()
  where owner_id = current_owner and id = p_customer_id and balance >= p_amount;

  get diagnostics affected_rows = row_count;
  if affected_rows = 0 then
    if exists (
      select 1 from public.customers
      where owner_id = current_owner and id = p_customer_id
    ) then
      raise exception 'Payment amount exceeds pending balance';
    end if;
    raise exception 'Customer not found';
  end if;
end;
$$;

revoke all on function public.add_my_customer_udhaar(text, numeric) from public, anon;
revoke all on function public.settle_my_customer_udhaar(text, numeric) from public, anon;
grant execute on function public.add_my_customer_udhaar(text, numeric) to authenticated;
grant execute on function public.settle_my_customer_udhaar(text, numeric) to authenticated;

create or replace function public.replace_my_products(p_products jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_owner uuid := (select auth.uid());
begin
  if current_owner is null then
    raise exception 'Authentication is required';
  end if;

  if pg_catalog.jsonb_typeof(p_products) <> 'array' then
    raise exception 'Product data must be a JSON array';
  end if;

  delete from public.products as existing
  where existing.owner_id = current_owner
    and not exists (
      select 1
      from pg_catalog.jsonb_to_recordset(p_products) as incoming(id text)
      where incoming.id = existing.id
    );

  insert into public.products (
    owner_id,
    id,
    name,
    quantity,
    unit,
    expiry_date,
    low_stock_threshold,
    updated_at
  )
  select
    current_owner,
    incoming.id,
    incoming.name,
    incoming.quantity,
    incoming.unit,
    incoming.expiry_date,
    incoming.low_stock_threshold,
    now()
  from pg_catalog.jsonb_to_recordset(p_products) as incoming(
    id text,
    name text,
    quantity integer,
    unit text,
    expiry_date date,
    low_stock_threshold integer
  )
  on conflict (owner_id, id) do update
  set
    name = excluded.name,
    quantity = excluded.quantity,
    unit = excluded.unit,
    expiry_date = excluded.expiry_date,
    low_stock_threshold = excluded.low_stock_threshold,
    updated_at = now();
end;
$$;

revoke all on function public.replace_my_products(jsonb) from public, anon;
grant execute on function public.replace_my_products(jsonb) to authenticated;

create or replace function public.upsert_my_products(p_products jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_owner uuid := (select auth.uid());
begin
  if current_owner is null then
    raise exception 'Authentication is required';
  end if;

  if p_products is null or pg_catalog.jsonb_typeof(p_products) <> 'array' then
    raise exception 'Product data must be a JSON array';
  end if;

  if exists (
    select 1
    from pg_catalog.jsonb_to_recordset(p_products) as incoming(id text)
    group by incoming.id
    having pg_catalog.count(*) > 1
  ) then
    raise exception 'A product id appears more than once';
  end if;

  insert into public.products (
    owner_id,
    id,
    name,
    quantity,
    unit,
    expiry_date,
    low_stock_threshold,
    updated_at
  )
  select
    current_owner,
    incoming.id,
    incoming.name,
    incoming.quantity,
    incoming.unit,
    incoming.expiry_date,
    incoming.low_stock_threshold,
    now()
  from pg_catalog.jsonb_to_recordset(p_products) as incoming(
    id text,
    name text,
    quantity integer,
    unit text,
    expiry_date date,
    low_stock_threshold integer
  )
  on conflict (owner_id, id) do update
  set
    name = excluded.name,
    quantity = excluded.quantity,
    unit = excluded.unit,
    expiry_date = excluded.expiry_date,
    low_stock_threshold = excluded.low_stock_threshold,
    updated_at = now();
end;
$$;

revoke all on function public.upsert_my_products(jsonb) from public, anon;
grant execute on function public.upsert_my_products(jsonb) to authenticated;
