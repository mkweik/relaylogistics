create table if not exists loads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  load_number text,
  broker text,
  driver_type text not null,
  origin_actual_rate numeric default 0,
  origin_driver_rate numeric default 0,
  origin_loaded_miles numeric default 0,
  origin_deadhead_miles numeric default 0,
  origin_tolls numeric default 0,
  return_status text default 'none',
  return_actual_rate numeric default 0,
  return_driver_rate numeric default 0,
  return_loaded_miles numeric default 0,
  return_deadhead_miles numeric default 0,
  return_tolls numeric default 0,
  diesel_price numeric default 5.35,
  return_diesel_price numeric default 5.35,
  mpg numeric default 6.5,
  return_mpg numeric default 6.5,
  insurance_weekly numeric default 360,
  eld_monthly numeric default 35,
  camera_monthly numeric default 35,
  repair_per_mile numeric default 0.20,
  factoring_percent numeric default 0,
  relay_profit numeric default 0,
  net_profit_per_mile numeric default 0,
  gross_revenue_per_mile numeric default 0,
  driver_settlement numeric default 0,
  decision text,
  notes text
);

create table if not exists load_files (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  load_id uuid references loads(id) on delete cascade,
  file_type text not null check (file_type in ('origin_rc', 'return_rc')),
  file_path text not null,
  original_filename text
);

create table if not exists cost_settings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  diesel_price numeric default 5.35,
  mpg numeric default 6.5,
  insurance_weekly numeric default 360,
  eld_monthly numeric default 35,
  camera_monthly numeric default 35,
  repair_per_mile numeric default 0.20,
  factoring_percent numeric default 0,
  min_profit numeric default 700,
  min_net_profit_per_mile numeric default 0.65,
  estimated_weekly_miles numeric default 2000
);
