# Relay Load Calculator V1.9

This version skips RC parsing and focuses on manual entry plus auto-calculation.

## Originating and Return Load fields

Each side now has:

1. Driver current location
2. Pickup location
3. Delivery location
4. RC Rate
5. Driver Rate
6. Deadhead miles, auto-calculated
7. Loaded miles, auto-calculated
8. Total miles, auto-calculated
9. Tolls, auto-calculated when TollGuru is configured
10. Diesel price, auto-calculated when EIA is configured

## Required API keys for auto-calculation

Set these in Vercel:

```text
GOOGLE_MAPS_API_KEY
TOLLGURU_API_KEY
EIA_API_KEY
```

Google/EIA are wired. TollGuru route is isolated and may need final payload tuning once your TollGuru key/account is active, because toll APIs enjoy being dramatic.
