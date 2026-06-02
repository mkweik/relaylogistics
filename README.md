# Relay Logistics Load Calculator V3.4

V3.4 adds bulk diesel entry for weekly data entry.

## Main features

- Driver management with truck number and driver type
- Preloaded Relay driver roster, with Khalil Truck 2315
- Save loads to selected driver/date
- Track actual repairs by driver/date/truck
- Track actual diesel and misc costs by driver/date/truck
- Bulk diesel paste/import tool for weekly fuel entry
- Driver profitability reports by date range
- Daily, weekly, and monthly summaries
- Reports recalculate whenever old repairs, diesel, or misc costs are entered later

## Bulk diesel paste format

Paste one diesel transaction per line:

```text
date, driver name or truck number, amount, vendor, description
```

Examples:

```text
2026-05-04, Djamel, 736.95, Fuelman, Diesel
2026-05-07, 112, 483.34, Mudflap, Diesel
5/11/2026, Ahmed Jwad, 288.53, Pilot, Diesel
```

The app will match either driver name or truck number.

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

Run `supabase.sql` after upload if you have not already run V3.3+ SQL.
