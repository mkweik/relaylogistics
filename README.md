# Relay Load Calculator V2.0

Clean rebuild. This version removes the RC parser and focuses on the working operational flow.

## Includes

- Company driver vs owner-operator calculations
- Originating and return load cards
- Current Location / ZIP
- Pickup Location / ZIP
- Delivery Location / ZIP
- RC Rate
- Driver Rate
- Deadhead miles using Google Routes
- Loaded miles using Google Routes
- Total miles auto-calculated
- Diesel price using EIA
- Toll estimate using HERE
- Saved loads in Supabase

## Environment variables in Vercel

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

GOOGLE_MAPS_API_KEY
EIA_API_KEY
HERE_API_KEY
```

## Supabase

Run `supabase.sql` after upload to make sure the columns exist.
