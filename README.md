# Relay Logistics Load Calculator V3.9

## Owner-Operator cost rule fix

V3.9 fixes the owner-operator calculation rules.

For owner-operators:

- Owner-operator settlement is based on Driver Rate × Owner Operator %
- Owner-operator pays diesel
- Owner-operator pays camera
- Owner-operator pays insurance
- Owner-operator is responsible for repairs, so repair reserve is not applied to Relay profit
- Relay covers ELD
- Relay covers dispatch fee
- Relay covers factoring
- Relay sometimes covers tolls depending on the owner-op toll setting

Company-driver calculations are unchanged.

## Supabase

No new database columns are required if you already ran V3.7/V3.8 SQL.


## V3.9.1

Fixes number-entry annoyance:
- Currency fields now show blank when the value is 0.
- This removes the leading zero issue in RC Rate, Driver Rate, Tolls, Diesel Price, and other currency fields.
- You can type `2300` directly instead of fighting `02300`, because apparently even input boxes needed supervision.


## V3.9.2

Fixes owner-operator pass-through toll accounting.

Owner-operator tolls, insurance, and camera chargebacks are treated as pass-through deductions:
- They reduce the owner-operator settlement.
- They do not increase Relay profit.
- If Relay absorbs tolls, tolls reduce Relay profit.
- If owner-operator is charged tolls, the toll effect on Relay profit is zero.

Also fixes owner-operator profit to include the broker spread:
Broker RC Rate - Driver Rate remains Relay revenue/margin.
