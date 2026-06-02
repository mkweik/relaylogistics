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


## V3.9.3

Adds an estimated total diesel cost display next to Diesel Price on each load card:
- Originating Load: Est. Diesel Cost = Origin Total Miles ÷ Origin MPG × Origin Diesel Price
- Return Load: Est. Diesel Cost = Return Total Miles ÷ Return MPG × Return Diesel Price

No database changes required.


## V3.9.4

Fixes fixed-cost day allocation.

Previous versions used a hardcoded trip-day estimate:
- 3 days base
- +1 day if return load existed

V3.9.4 uses mileage-based trip days instead:
- Default Miles / Day = 650
- Trip Days = ceiling(Total Miles ÷ Miles / Day)
- Minimum trip days = 1

Example:
- 374.6 miles ÷ 650 = 0.58
- Trip Days = 1


## V3.9.5

Adds separate completed-load details for originating and return loads:
- Origin load date
- Origin broker
- Origin load number
- Return load date
- Return broker
- Return load number

For backward compatibility:
- `load_date` stores the origin load date
- `broker` stores the origin broker
- `load_number` stores the origin load number

Run `supabase.sql` after upload to add the new columns.


## V3.9.6

Moves Driver Management / Driver Roster into its own separate tab:
- Load Quote
- Completed Loads / Driver Profit
- Driver Roster

Completed Loads still uses the driver dropdown, but the add/edit roster table is no longer inside the completed-load workflow.
