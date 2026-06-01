# Relay Load Calculator

Live-test version for Relay Logistics load profitability.

## What this includes

- Company driver vs owner-operator logic
- Originating load and return load
- Owner-operator diesel rule: owner-op always pays diesel
- Repair/maintenance reserve per mile
- Book / Negotiate / Reject decision
- Supabase-ready save/load structure
- API route placeholders for Google route miles, TollGuru tolls, and EIA diesel pricing

## Setup

1. Upload these files to your GitHub repo.
2. Vercel should deploy automatically.
3. Add the environment variables from `.env.example` into Vercel.
4. Run `supabase.sql` in Supabase SQL Editor.
5. Create a Supabase storage bucket named `rate-confirmations`.

## API keys

The app will run without API keys, but live route/toll/diesel buttons need:

- `GOOGLE_MAPS_API_KEY`
- `TOLLGURU_API_KEY`
- `EIA_API_KEY`

Until those are set, API routes return clear setup errors instead of silently lying, because apparently software needs adult supervision.
