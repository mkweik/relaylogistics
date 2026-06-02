# Relay Logistics Load Calculator V3.5

V3.5 separates the app into two clear workflows:

## 1. Load Quote
Use this before booking a load. It keeps the existing quote tools:
- Google route miles
- HERE toll estimates
- EIA diesel refresh
- Company driver / owner operator assumptions
- Dispatch fee options
- Profit and profit-per-mile decision

## 2. Completed Loads / Driver Profit
Use this after loads are completed or when entering past loads:
- Select driver
- Enter load date
- Enter completed load details
- Save completed load to that driver
- Enter actual repairs
- Enter actual diesel and misc costs
- Bulk diesel entry for weekly data entry
- Run driver P&L by any date range
- Daily, weekly, monthly reporting

## Vercel env variables

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GOOGLE_MAPS_API_KEY
EIA_API_KEY
HERE_API_KEY
```

Run `supabase.sql` after upload.
