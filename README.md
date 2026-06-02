# Relay Load Calculator

Clean V1.8 rebuild.

## Includes

- Company driver vs owner-operator calculations
- Originating load and return load
- Owner-op diesel rule: owner-op always pays diesel
- Repair reserve per mile
- Saved loads list from Supabase
- Save estimate to Supabase
- RC upload to Supabase Storage
- Basic text-based PDF parser for rate confirmations
- API placeholders for diesel, route miles, and tolls

## Supabase Storage

Create a private bucket named:

```text
rate-confirmations
```

## Vercel environment variables

Add:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GOOGLE_MAPS_API_KEY
TOLLGURU_API_KEY
EIA_API_KEY
```

Google/TollGuru/EIA can wait. Supabase variables are needed for saving.
