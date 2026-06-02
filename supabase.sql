create extension if not exists pgcrypto;

create table if not exists drivers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  truck_number text,
  driver_type text not null default 'company',
  owner_operator_charges_tolls boolean default false,
  is_active boolean default true
);

create table if not exists loads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),

  driver_id uuid references drivers(id) on delete set null,
  load_date date,

  load_number text,
  broker text,
  driver_type text not null default 'company',

  origin_driver_location text,
  origin_pickup_location text,
  origin_delivery_location text,

  return_driver_location text,
  return_pickup_location text,
  return_delivery_location text,

  origin_pickup_locations jsonb default '[]'::jsonb,
  origin_delivery_locations jsonb default '[]'::jsonb,
  return_pickup_locations jsonb default '[]'::jsonb,
  return_delivery_locations jsonb default '[]'::jsonb,

  origin_actual_rate numeric default 0,
  origin_driver_rate numeric default 0,
  origin_loaded_miles numeric default 0,
  origin_deadhead_miles numeric default 0,
  origin_total_miles numeric default 0,
  origin_tolls numeric default 0,

  return_status text default 'none',
  return_actual_rate numeric default 0,
  return_driver_rate numeric default 0,
  return_loaded_miles numeric default 0,
  return_deadhead_miles numeric default 0,
  return_total_miles numeric default 0,
  return_tolls numeric default 0,

  diesel_price numeric default 5.35,
  return_diesel_price numeric default 5.35,
  mpg numeric default 6.5,
  return_mpg numeric default 6.5,

  company_driver_percent numeric default 35,
  owner_operator_percent numeric default 85,
  owner_operator_charges_tolls boolean default false,

  dispatch_fee_percent numeric default 0,
  apply_dispatch_fee_origin boolean default false,
  apply_dispatch_fee_return boolean default false,

  insurance_weekly numeric default 360,
  eld_monthly numeric default 35,
  camera_monthly numeric default 35,
  repair_per_mile numeric default 0.20,
  factoring_percent numeric default 0,

  dispatch_fee numeric default 0,
  estimated_diesel_cost numeric default 0,
  repair_reserve_amount numeric default 0,
  relay_profit numeric default 0,
  net_profit_per_mile numeric default 0,
  gross_revenue_per_mile numeric default 0,
  driver_settlement numeric default 0,
  total_revenue numeric default 0,
  total_miles numeric default 0,
  decision text,

  notes text
);

create table if not exists repairs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  driver_id uuid references drivers(id) on delete set null,
  repair_date date not null,
  amount numeric not null default 0,
  vendor text,
  description text,
  truck_number text,
  receipt_url text
);

create table if not exists actual_costs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  driver_id uuid references drivers(id) on delete set null,
  cost_date date not null,
  cost_type text not null check (cost_type in ('diesel', 'misc')),
  amount numeric not null default 0,
  vendor text,
  description text,
  truck_number text,
  receipt_url text
);

alter table drivers add column if not exists truck_number text;
alter table drivers add column if not exists owner_operator_charges_tolls boolean default false;

alter table loads add column if not exists driver_id uuid references drivers(id) on delete set null;
alter table loads add column if not exists load_date date;
alter table loads add column if not exists company_driver_percent numeric default 35;
alter table loads add column if not exists owner_operator_percent numeric default 85;
alter table loads add column if not exists owner_operator_charges_tolls boolean default false;
alter table loads add column if not exists dispatch_fee_percent numeric default 0;
alter table loads add column if not exists apply_dispatch_fee_origin boolean default false;
alter table loads add column if not exists apply_dispatch_fee_return boolean default false;
alter table loads add column if not exists dispatch_fee numeric default 0;
alter table loads add column if not exists estimated_diesel_cost numeric default 0;
alter table loads add column if not exists repair_reserve_amount numeric default 0;
alter table loads add column if not exists total_revenue numeric default 0;
alter table loads add column if not exists total_miles numeric default 0;
alter table loads add column if not exists origin_pickup_locations jsonb default '[]'::jsonb;
alter table loads add column if not exists origin_delivery_locations jsonb default '[]'::jsonb;
alter table loads add column if not exists return_pickup_locations jsonb default '[]'::jsonb;
alter table loads add column if not exists return_delivery_locations jsonb default '[]'::jsonb;



-- Current driver roster
insert into drivers (name, truck_number, driver_type, is_active)
select 'Ahmed Jwad', '1890', 'owner', true
where not exists (select 1 from drivers where lower(name) = lower('Ahmed Jwad'));

insert into drivers (name, truck_number, driver_type, is_active)
select 'Hussein Yusef', '116', 'owner', true
where not exists (select 1 from drivers where lower(name) = lower('Hussein Yusef'));

insert into drivers (name, truck_number, driver_type, is_active)
select 'Marwan Farah', '121', 'owner', true
where not exists (select 1 from drivers where lower(name) = lower('Marwan Farah'));

insert into drivers (name, truck_number, driver_type, is_active)
select 'Djamel', '112', 'company', true
where not exists (select 1 from drivers where lower(name) = lower('Djamel'));

insert into drivers (name, truck_number, driver_type, is_active)
select 'Ashraf', '113', 'company', true
where not exists (select 1 from drivers where lower(name) = lower('Ashraf'));

insert into drivers (name, truck_number, driver_type, is_active)
select 'Abdelkader', '085', 'company', true
where not exists (select 1 from drivers where lower(name) = lower('Abdelkader'));

insert into drivers (name, truck_number, driver_type, is_active)
select 'Sulieman', '119', 'company', true
where not exists (select 1 from drivers where lower(name) = lower('Sulieman'));

insert into drivers (name, truck_number, driver_type, is_active)
select 'Riziq', '178', 'company', true
where not exists (select 1 from drivers where lower(name) = lower('Riziq'));

insert into drivers (name, truck_number, driver_type, is_active)
select 'Khalil', '2315', 'company', true
where not exists (select 1 from drivers where lower(name) = lower('Khalil'));

insert into drivers (name, truck_number, driver_type, is_active)
select 'Toufik', '118', 'company', true
where not exists (select 1 from drivers where lower(name) = lower('Toufik'));

insert into drivers (name, truck_number, driver_type, is_active)
select 'Moussa', '111', 'company', true
where not exists (select 1 from drivers where lower(name) = lower('Moussa'));

-- Force the corrected truck number if Khalil already exists.
update drivers
set truck_number = '2315', driver_type = 'company', is_active = true
where lower(name) = lower('Khalil');

notify pgrst, 'reload schema';


