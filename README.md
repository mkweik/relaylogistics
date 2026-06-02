# Relay Logistics Load Calculator V3.1

V3.1 adds driver truck numbers and preloads the current driver roster.

## Main features

- Add/select drivers
- Store driver type: owner operator or company driver
- Store truck number
- Preloaded Relay driver roster in Supabase SQL
- Save loads to a selected driver and load date
- Track actual repairs by driver/date/truck
- Driver reports by date range
- Daily, weekly, and monthly driver profit summaries
- Google Routes, EIA diesel, and HERE tolls remain

## Required Vercel environment variables

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GOOGLE_MAPS_API_KEY
EIA_API_KEY
HERE_API_KEY
```

## Supabase

Run `supabase.sql` after upload. It creates/updates the `drivers`, `loads`, and `repairs` tables and inserts the current driver list.
