"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateLoad } from "@/lib/calculations";
import { DriverType, LoadInputs, ReturnStatus } from "@/types/load";

type Driver = {
  id: string;
  name: string;
  truck_number: string | null;
  driver_type: DriverType;
  is_active: boolean;
};

type SavedLoad = {
  id: string;
  load_date: string | null;
  load_number: string | null;
  broker: string | null;
  driver_id: string | null;
  driver_type: DriverType;
  origin_actual_rate: number;
  origin_driver_rate: number;
  origin_loaded_miles: number;
  origin_deadhead_miles: number;
  origin_tolls: number;
  return_status: ReturnStatus;
  return_actual_rate: number;
  return_driver_rate: number;
  return_loaded_miles: number;
  return_deadhead_miles: number;
  return_tolls: number;
  diesel_price: number;
  return_diesel_price: number;
  mpg: number;
  return_mpg: number;
  company_driver_percent: number;
  owner_operator_percent: number;
  dispatch_fee_percent: number;
  apply_dispatch_fee_origin: boolean;
  apply_dispatch_fee_return: boolean;
  insurance_weekly: number;
  eld_monthly: number;
  camera_monthly: number;
  repair_per_mile: number;
  factoring_percent: number;
  dispatch_fee: number;
  repair_reserve_amount: number;
  relay_profit: number;
  net_profit_per_mile: number;
  gross_revenue_per_mile: number;
  driver_settlement: number;
  total_revenue: number;
  total_miles: number;
  decision: string | null;
};

type Repair = {
  id: string;
  driver_id: string | null;
  repair_date: string;
  amount: number;
  vendor: string | null;
  description: string | null;
  truck_number: string | null;
};

const today = new Date().toISOString().slice(0, 10);

const defaults: LoadInputs = {
  driverType: "company",
  driverId: "",
  loadDate: today,
  broker: "",
  loadNumber: "",

  originDriverLocation: "",
  originPickupLocation: "",
  originDeliveryLocation: "",

  returnDriverLocation: "",
  returnPickupLocation: "",
  returnDeliveryLocation: "",

  originActualRate: 0,
  originDriverRate: 0,
  originLoadedMiles: 0,
  originDeadheadMiles: 0,
  originTolls: 0,

  returnStatus: "none",
  returnActualRate: 0,
  returnDriverRate: 0,
  returnLoadedMiles: 0,
  returnDeadheadMiles: 0,
  returnTolls: 0,

  dieselPrice: 5.35,
  returnDieselPrice: 5.35,
  mpg: 6.5,
  returnMpg: 6.5,

  companyDriverPercent: 35,
  ownerOperatorPercent: 85,

  dispatchFeePercent: 0,
  applyDispatchFeeOrigin: false,
  applyDispatchFeeReturn: false,

  insuranceWeekly: 360,
  eldMonthly: 35,
  cameraMonthly: 35,
  repairPerMile: 0.15,
  factoringPercent: 0.95,

  minProfit: 700,
  minNetProfitPerMile: 0.65,
};

function currency(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function rpm(n: number) {
  return `$${n.toFixed(2)}/mi`;
}

function weekKeySunday(dateString: string) {
  const d = new Date(`${dateString}T00:00:00`);
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay());
  return start.toISOString().slice(0, 10);
}

function monthKey(dateString: string) {
  return dateString.slice(0, 7);
}

export default function Home() {
  const [input, setInput] = useState<LoadInputs>(defaults);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [newDriverName, setNewDriverName] = useState("");
  const [newDriverTruck, setNewDriverTruck] = useState("");
  const [newDriverType, setNewDriverType] = useState<DriverType>("company");
  const [status, setStatus] = useState("");

  const [repairDriverId, setRepairDriverId] = useState("");
  const [repairDate, setRepairDate] = useState(today);
  const [repairAmount, setRepairAmount] = useState(0);
  const [repairVendor, setRepairVendor] = useState("");
  const [repairDescription, setRepairDescription] = useState("");
  const [repairTruck, setRepairTruck] = useState("");

  const [reportDriverId, setReportDriverId] = useState("");
  const [reportStart, setReportStart] = useState(today.slice(0, 8) + "01");
  const [reportEnd, setReportEnd] = useState(today);
  const [reportLoads, setReportLoads] = useState<SavedLoad[]>([]);
  const [reportRepairs, setReportRepairs] = useState<Repair[]>([]);

  const result = useMemo(() => calculateLoad(input), [input]);

  function setNumber<K extends keyof LoadInputs>(key: K, value: string) {
    setInput((prev) => ({ ...prev, [key]: Number(value) || 0 }));
  }

  function setText<K extends keyof LoadInputs>(key: K, value: string) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  async function fetchDrivers() {
    const response = await fetch("/api/drivers", { cache: "no-store" });
    const data = await response.json();
    if (response.ok) setDrivers(data.drivers || []);
  }

  useEffect(() => {
    fetchDrivers();
  }, []);

  async function addDriver() {
    if (!newDriverName.trim()) {
      setStatus("Enter driver name first.");
      return;
    }

    const response = await fetch("/api/drivers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newDriverName.trim(), truck_number: newDriverTruck.trim(), driver_type: newDriverType }),
    });

    const data = await response.json();

    if (!response.ok) {
      setStatus(`Driver save failed: ${data.error}`);
      return;
    }

    setNewDriverName("");
    setNewDriverTruck("");
    setStatus(`Added driver ${data.driver?.name}${data.driver?.truck_number ? " - Truck " + data.driver.truck_number : ""}`);
    fetchDrivers();
  }

  async function saveLoad() {
    if (!input.driverId) {
      setStatus("Select a driver before saving the load.");
      return;
    }

    const payload = {
      driver_id: input.driverId,
      load_date: input.loadDate,
      load_number: input.loadNumber,
      broker: input.broker,
      driver_type: input.driverType,

      origin_driver_location: input.originDriverLocation,
      origin_pickup_location: input.originPickupLocation,
      origin_delivery_location: input.originDeliveryLocation,

      return_driver_location: input.returnDriverLocation,
      return_pickup_location: input.returnPickupLocation,
      return_delivery_location: input.returnDeliveryLocation,

      origin_actual_rate: input.originActualRate,
      origin_driver_rate: input.originDriverRate,
      origin_loaded_miles: input.originLoadedMiles,
      origin_deadhead_miles: input.originDeadheadMiles,
      origin_total_miles: result.originTotalMiles,
      origin_tolls: input.originTolls,

      return_status: input.returnStatus,
      return_actual_rate: input.returnActualRate,
      return_driver_rate: input.returnDriverRate,
      return_loaded_miles: input.returnLoadedMiles,
      return_deadhead_miles: input.returnDeadheadMiles,
      return_total_miles: result.returnTotalMiles,
      return_tolls: input.returnTolls,

      diesel_price: input.dieselPrice,
      return_diesel_price: input.returnDieselPrice,
      mpg: input.mpg,
      return_mpg: input.returnMpg,

      company_driver_percent: input.companyDriverPercent,
      owner_operator_percent: input.ownerOperatorPercent,

      dispatch_fee_percent: input.dispatchFeePercent,
      apply_dispatch_fee_origin: input.applyDispatchFeeOrigin,
      apply_dispatch_fee_return: input.applyDispatchFeeReturn,

      insurance_weekly: input.insuranceWeekly,
      eld_monthly: input.eldMonthly,
      camera_monthly: input.cameraMonthly,
      repair_per_mile: input.repairPerMile,
      factoring_percent: input.factoringPercent,

      dispatch_fee: result.dispatchFee,
      repair_reserve_amount: result.repairReserveAmount,
      relay_profit: result.relayProfit,
      net_profit_per_mile: result.netProfitPerMile,
      gross_revenue_per_mile: result.grossRevenuePerMile,
      driver_settlement: result.driverSettlement,
      total_revenue: result.totalRevenue,
      total_miles: result.totalMiles,
      decision: result.decision,
    };

    const response = await fetch("/api/loads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok) {
      setStatus(`Saved load ${data.load?.id}`);
    } else {
      setStatus(`Save failed: ${data.error}`);
    }
  }

  async function saveRepair() {
    if (!repairDriverId) {
      setStatus("Select a driver before saving repair.");
      return;
    }

    const response = await fetch("/api/repairs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        driver_id: repairDriverId,
        repair_date: repairDate,
        amount: repairAmount,
        vendor: repairVendor,
        description: repairDescription,
        truck_number: repairTruck,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setStatus(`Repair save failed: ${data.error}`);
      return;
    }

    setRepairAmount(0);
    setRepairVendor("");
    setRepairDescription("");
    setRepairTruck("");
    setStatus(`Saved repair ${data.repair?.id}`);
  }

  async function runReport() {
    if (!reportDriverId) {
      setStatus("Select a driver for the report.");
      return;
    }

    const loadResponse = await fetch(`/api/loads?driver_id=${reportDriverId}&start=${reportStart}&end=${reportEnd}`, { cache: "no-store" });
    const loadData = await loadResponse.json();

    const repairResponse = await fetch(`/api/repairs?driver_id=${reportDriverId}&start=${reportStart}&end=${reportEnd}`, { cache: "no-store" });
    const repairData = await repairResponse.json();

    if (!loadResponse.ok) {
      setStatus(`Report load fetch failed: ${loadData.error}`);
      return;
    }

    if (!repairResponse.ok) {
      setStatus(`Report repair fetch failed: ${repairData.error}`);
      return;
    }

    setReportLoads(loadData.loads || []);
    setReportRepairs(repairData.repairs || []);
    setStatus("Report updated.");
  }

  async function calculateMiles(kind: "origin" | "return") {
    const driverLocation = kind === "origin" ? input.originDriverLocation : input.returnDriverLocation;
    const pickupLocation = kind === "origin" ? input.originPickupLocation : input.returnPickupLocation;
    const deliveryLocation = kind === "origin" ? input.originDeliveryLocation : input.returnDeliveryLocation;

    if (!driverLocation || !pickupLocation || !deliveryLocation) {
      setStatus(`Enter current, pickup, and delivery locations for ${kind} load first.`);
      return;
    }

    setStatus(`Calculating ${kind} miles...`);

    const deadheadResponse = await fetch("/api/route-estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from: driverLocation, to: pickupLocation }),
    });
    const deadheadData = await deadheadResponse.json();

    if (!deadheadResponse.ok) {
      setStatus(`Deadhead failed: ${deadheadData.error}`);
      return;
    }

    const loadedResponse = await fetch("/api/route-estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from: pickupLocation, to: deliveryLocation }),
    });
    const loadedData = await loadedResponse.json();

    if (!loadedResponse.ok) {
      setStatus(`Loaded miles failed: ${loadedData.error}`);
      return;
    }

    setInput((prev) =>
      kind === "origin"
        ? { ...prev, originDeadheadMiles: deadheadData.miles, originLoadedMiles: loadedData.miles }
        : { ...prev, returnDeadheadMiles: deadheadData.miles, returnLoadedMiles: loadedData.miles, returnStatus: prev.returnStatus === "none" ? "estimated" : prev.returnStatus }
    );

    setStatus(`Calculated ${kind} miles.`);
  }

  async function calculateTolls(kind: "origin" | "return") {
    const pickupLocation = kind === "origin" ? input.originPickupLocation : input.returnPickupLocation;
    const deliveryLocation = kind === "origin" ? input.originDeliveryLocation : input.returnDeliveryLocation;

    if (!pickupLocation || !deliveryLocation) {
      setStatus(`Enter pickup and delivery for ${kind} load first.`);
      return;
    }

    setStatus(`Calculating ${kind} tolls...`);

    const response = await fetch("/api/toll-estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from: pickupLocation, to: deliveryLocation }),
    });

    const data = await response.json();

    if (!response.ok) {
      setStatus(`Tolls not ready: ${data.error}`);
      return;
    }

    setInput((prev) =>
      kind === "origin"
        ? { ...prev, originTolls: Number(data.tolls || 0) }
        : { ...prev, returnTolls: Number(data.tolls || 0), returnStatus: prev.returnStatus === "none" ? "estimated" : prev.returnStatus }
    );

    setStatus(data.message || `Calculated ${kind} tolls.`);
  }

  async function refreshDiesel(kind: "origin" | "return") {
    setStatus(`Refreshing ${kind} diesel...`);

    const response = await fetch("/api/diesel?region=midwest");
    const data = await response.json();

    if (!data.price) {
      setStatus(`Diesel not ready: ${data.error}`);
      return;
    }

    setInput((prev) => (kind === "origin" ? { ...prev, dieselPrice: data.price } : { ...prev, returnDieselPrice: data.price }));
    setStatus(`Updated ${kind} diesel from EIA.`);
  }

  const report = useMemo(() => buildReport(reportLoads, reportRepairs), [reportLoads, reportRepairs]);

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Relay Load Calculator V3.1</h1>
        <p className="text-slate-600">Driver profitability, truck numbers, load tracking, repairs, and API-powered route costs.</p>
      </div>

      {status && <section className="mb-6 rounded-2xl border bg-white p-4 text-sm"><strong>Status:</strong> {status}</section>}

      <section className="mb-6 rounded-2xl border bg-white p-5">
        <h2 className="mb-4 text-xl font-semibold">Driver Setup</h2>
        <div className="grid gap-4 md:grid-cols-5">
          <Field label="New Driver Name" value={newDriverName} onChange={setNewDriverName} />
          <Field label="Truck #" value={newDriverTruck} onChange={setNewDriverTruck} />
          <SelectField label="Driver Type" value={newDriverType} onChange={(v) => setNewDriverType(v as DriverType)} options={[["company", "Company Driver"], ["owner", "Owner Operator"]]} />
          <div className="flex items-end">
            <button onClick={addDriver} className="rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white">Add Driver</button>
          </div>
          <div className="flex items-end text-sm text-slate-600">{drivers.length} active driver(s)</div>
        </div>

        <div className="mt-5 overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="p-3">Driver</th>
                <th className="p-3">Truck #</th>
                <th className="p-3">Type</th>
              </tr>
            </thead>
            <tbody>
              {drivers.length === 0 ? (
                <tr><td colSpan={3} className="p-3 text-center text-slate-500">No drivers loaded yet.</td></tr>
              ) : (
                drivers.map((driver) => (
                  <tr key={driver.id} className="border-t">
                    <td className="p-3 font-semibold">{driver.name}</td>
                    <td className="p-3">{driver.truck_number || "-"}</td>
                    <td className="p-3">{driver.driver_type === "owner" ? "Owner Operator" : "Company Driver"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-6 rounded-2xl border bg-white p-5">
        <h2 className="mb-4 text-xl font-semibold">Load Header</h2>
        <div className="grid gap-4 md:grid-cols-5">
          <SelectField label="Driver" value={input.driverId} onChange={(v) => setInput((p) => ({ ...p, driverId: v }))} options={[["", "Select Driver"], ...drivers.map((d) => [d.id, `${d.name}${d.truck_number ? " - Truck " + d.truck_number : ""}`] as [string, string])]} />
          <DateField label="Load Date" value={input.loadDate} onChange={(v) => setText("loadDate", v)} />
          <SelectField label="Driver Type" value={input.driverType} onChange={(v) => setInput((p) => ({ ...p, driverType: v as DriverType }))} options={[["company", "Company"], ["owner", "Owner-Op"]]} />
          <Field label="Broker" value={input.broker} onChange={(v) => setText("broker", v)} />
          <Field label="Load #" value={input.loadNumber} onChange={(v) => setText("loadNumber", v)} />
        </div>
      </section>

      <section className="mb-6 grid gap-6 lg:grid-cols-2">
        <LoadCard
          title="Originating Load"
          current={input.originDriverLocation}
          pickup={input.originPickupLocation}
          delivery={input.originDeliveryLocation}
          rcRate={input.originActualRate}
          driverRate={input.originDriverRate}
          deadhead={input.originDeadheadMiles}
          loaded={input.originLoadedMiles}
          total={result.originTotalMiles}
          tolls={input.originTolls}
          diesel={input.dieselPrice}
          onCurrent={(v) => setText("originDriverLocation", v)}
          onPickup={(v) => setText("originPickupLocation", v)}
          onDelivery={(v) => setText("originDeliveryLocation", v)}
          onRc={(v) => setNumber("originActualRate", v)}
          onDriverRate={(v) => setNumber("originDriverRate", v)}
          onDeadhead={(v) => setNumber("originDeadheadMiles", v)}
          onLoaded={(v) => setNumber("originLoadedMiles", v)}
          onTolls={(v) => setNumber("originTolls", v)}
          onDiesel={(v) => setNumber("dieselPrice", v)}
          onMiles={() => calculateMiles("origin")}
          onTollsCalc={() => calculateTolls("origin")}
          onDieselRefresh={() => refreshDiesel("origin")}
        />

        <div>
          <label className="mb-2 block text-sm font-semibold">Return Status</label>
          <select value={input.returnStatus} onChange={(e) => setInput((p) => ({ ...p, returnStatus: e.target.value as ReturnStatus }))} className="mb-3 w-full rounded-xl border p-3">
            <option value="none">No Return Load Yet</option>
            <option value="estimated">Estimated Return Load</option>
            <option value="confirmed">Confirmed Return Load</option>
          </select>

          <LoadCard
            title="Return Load"
            current={input.returnDriverLocation}
            pickup={input.returnPickupLocation}
            delivery={input.returnDeliveryLocation}
            rcRate={input.returnActualRate}
            driverRate={input.returnDriverRate}
            deadhead={input.returnDeadheadMiles}
            loaded={input.returnLoadedMiles}
            total={result.returnTotalMiles}
            tolls={input.returnTolls}
            diesel={input.returnDieselPrice}
            onCurrent={(v) => setText("returnDriverLocation", v)}
            onPickup={(v) => setText("returnPickupLocation", v)}
            onDelivery={(v) => setText("returnDeliveryLocation", v)}
            onRc={(v) => setNumber("returnActualRate", v)}
            onDriverRate={(v) => setNumber("returnDriverRate", v)}
            onDeadhead={(v) => setNumber("returnDeadheadMiles", v)}
            onLoaded={(v) => setNumber("returnLoadedMiles", v)}
            onTolls={(v) => setNumber("returnTolls", v)}
            onDiesel={(v) => setNumber("returnDieselPrice", v)}
            onMiles={() => calculateMiles("return")}
            onTollsCalc={() => calculateTolls("return")}
            onDieselRefresh={() => refreshDiesel("return")}
          />
        </div>
      </section>

      <section className="mb-6 grid gap-4 md:grid-cols-4">
        <Metric label="Decision" value={result.decision} />
        <Metric label="Relay Net Profit" value={currency(result.relayProfit)} />
        <Metric label="Net Profit / Mile" value={rpm(result.netProfitPerMile)} />
        <Metric label="Driver Settlement" value={currency(result.driverSettlement)} />
      </section>

      <section className="mb-6 rounded-2xl border bg-white p-5">
        <h2 className="mb-4 text-xl font-semibold">Cost & Fee Settings</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <NumberField label="Company Driver %" value={input.companyDriverPercent} step="0.01" onChange={(v) => setNumber("companyDriverPercent", v)} />
          <NumberField label="Owner Operator %" value={input.ownerOperatorPercent} step="0.01" onChange={(v) => setNumber("ownerOperatorPercent", v)} />
          <NumberField label="Dispatch Fee %" value={input.dispatchFeePercent} step="0.01" onChange={(v) => setNumber("dispatchFeePercent", v)} />
          <NumberField label="Min Profit / Mile" value={input.minNetProfitPerMile} step="0.01" onChange={(v) => setNumber("minNetProfitPerMile", v)} />
          <NumberField label="Origin MPG" value={input.mpg} step="0.1" onChange={(v) => setNumber("mpg", v)} />
          <NumberField label="Return MPG" value={input.returnMpg} step="0.1" onChange={(v) => setNumber("returnMpg", v)} />
          <NumberField label="Insurance / Week" value={input.insuranceWeekly} onChange={(v) => setNumber("insuranceWeekly", v)} />
          <NumberField label="ELD / Month" value={input.eldMonthly} onChange={(v) => setNumber("eldMonthly", v)} />
          <NumberField label="Camera / Month" value={input.cameraMonthly} onChange={(v) => setNumber("cameraMonthly", v)} />
          <NumberField label="Repair Reserve / Mile" value={input.repairPerMile} step="0.01" onChange={(v) => setNumber("repairPerMile", v)} />
          <NumberField label="Factoring %" value={input.factoringPercent} step="0.01" onChange={(v) => setNumber("factoringPercent", v)} />
        </div>

        <div className="mt-4 rounded-2xl border bg-slate-50 p-4">
          <div className="mb-3 text-sm font-semibold">Apply Dispatch Fee To</div>
          <div className="grid gap-3 md:grid-cols-2">
            <CheckboxField label="Originating Load" checked={input.applyDispatchFeeOrigin} onChange={(checked) => setInput((p) => ({ ...p, applyDispatchFeeOrigin: checked }))} />
            <CheckboxField label="Return Load" checked={input.applyDispatchFeeReturn} onChange={(checked) => setInput((p) => ({ ...p, applyDispatchFeeReturn: checked }))} />
          </div>
          <p className="mt-3 text-sm text-slate-600">Dispatch fee is based on selected load RC Rate, not Driver Rate.</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={saveLoad} className="rounded-xl bg-green-700 px-4 py-2 font-semibold text-white">Save Load</button>
        </div>
      </section>

      <section className="mb-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-white p-5">
          <h2 className="mb-4 text-xl font-semibold">Actual Repairs</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField label="Driver" value={repairDriverId} onChange={setRepairDriverId} options={[["", "Select Driver"], ...drivers.map((d) => [d.id, `${d.name}${d.truck_number ? " - Truck " + d.truck_number : ""}`] as [string, string])]} />
            <DateField label="Repair Date" value={repairDate} onChange={setRepairDate} />
            <NumberField label="Repair Amount" value={repairAmount} step="0.01" onChange={(v) => setRepairAmount(Number(v) || 0)} />
            <Field label="Truck #" value={repairTruck} onChange={setRepairTruck} />
            <Field label="Vendor" value={repairVendor} onChange={setRepairVendor} />
            <Field label="Description" value={repairDescription} onChange={setRepairDescription} />
          </div>
          <button onClick={saveRepair} className="mt-4 rounded-xl bg-green-700 px-4 py-2 font-semibold text-white">Save Repair</button>
        </section>

        <section className="rounded-2xl border bg-white p-5">
          <h2 className="mb-4 text-xl font-semibold">Driver Profit Report</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <SelectField label="Driver" value={reportDriverId} onChange={setReportDriverId} options={[["", "Select Driver"], ...drivers.map((d) => [d.id, `${d.name}${d.truck_number ? " - Truck " + d.truck_number : ""}`] as [string, string])]} />
            <DateField label="Start Date" value={reportStart} onChange={setReportStart} />
            <DateField label="End Date" value={reportEnd} onChange={setReportEnd} />
          </div>
          <button onClick={runReport} className="mt-4 rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white">Run Report</button>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <Metric label="Load Profit" value={currency(report.loadProfit)} />
            <Metric label="Repair Reserve Added Back" value={currency(report.repairReserve)} />
            <Metric label="Actual Repairs" value={currency(report.actualRepairs)} />
            <Metric label="Net After Actual Repairs" value={currency(report.netAfterActualRepairs)} />
          </div>
        </section>
      </section>

      <ReportTables report={report} />

      <section className="mt-6 rounded-2xl border bg-white p-5">
        <h2 className="mb-4 text-xl font-semibold">Current Load Breakdown</h2>
        <div className="overflow-hidden rounded-xl border">
          {result.breakdown.map((row) => (
            <div key={row.label} className={`grid grid-cols-2 border-b p-3 ${row.strong ? "bg-slate-100 font-bold" : ""}`}>
              <div>{row.label}</div>
              <div className="text-right">{row.value}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function buildReport(loads: SavedLoad[], repairs: Repair[]) {
  const loadProfit = loads.reduce((sum, load) => sum + Number(load.relay_profit || 0), 0);
  const repairReserve = loads.reduce((sum, load) => sum + Number(load.repair_reserve_amount || 0), 0);
  const actualRepairs = repairs.reduce((sum, repair) => sum + Number(repair.amount || 0), 0);
  const netBeforeRepairReserve = loadProfit + repairReserve;
  const netAfterActualRepairs = netBeforeRepairReserve - actualRepairs;

  const makeBlank = () => ({
    revenue: 0,
    loadProfit: 0,
    repairReserve: 0,
    actualRepairs: 0,
    netAfterActualRepairs: 0,
    loads: 0,
  });

  const daily: Record<string, ReturnType<typeof makeBlank>> = {};
  const weekly: Record<string, ReturnType<typeof makeBlank>> = {};
  const monthly: Record<string, ReturnType<typeof makeBlank>> = {};

  for (const load of loads) {
    const date = load.load_date || "";
    if (!date) continue;

    const keys = [date, weekKeySunday(date), monthKey(date)];
    const groups = [daily, weekly, monthly];

    groups.forEach((group, index) => {
      const key = keys[index];
      group[key] ||= makeBlank();
      group[key].revenue += Number(load.total_revenue || 0);
      group[key].loadProfit += Number(load.relay_profit || 0);
      group[key].repairReserve += Number(load.repair_reserve_amount || 0);
      group[key].loads += 1;
    });
  }

  for (const repair of repairs) {
    const date = repair.repair_date;
    const keys = [date, weekKeySunday(date), monthKey(date)];
    const groups = [daily, weekly, monthly];

    groups.forEach((group, index) => {
      const key = keys[index];
      group[key] ||= makeBlank();
      group[key].actualRepairs += Number(repair.amount || 0);
    });
  }

  [daily, weekly, monthly].forEach((group) => {
    Object.values(group).forEach((row) => {
      row.netAfterActualRepairs = row.loadProfit + row.repairReserve - row.actualRepairs;
    });
  });

  return { loadProfit, repairReserve, actualRepairs, netAfterActualRepairs, daily, weekly, monthly };
}

function ReportTables({ report }: { report: ReturnType<typeof buildReport> }) {
  return (
    <section className="grid gap-6 lg:grid-cols-3">
      <SummaryTable title="Daily Profit" data={report.daily} />
      <SummaryTable title="Weekly Profit" data={report.weekly} />
      <SummaryTable title="Monthly Profit" data={report.monthly} />
    </section>
  );
}

function SummaryTable({ title, data }: { title: string; data: Record<string, { revenue: number; loadProfit: number; repairReserve: number; actualRepairs: number; netAfterActualRepairs: number; loads: number }> }) {
  const rows = Object.entries(data).sort(([a], [b]) => a.localeCompare(b));

  return (
    <section className="rounded-2xl border bg-white p-5">
      <h2 className="mb-4 text-xl font-semibold">{title}</h2>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="p-3">Period</th>
              <th className="p-3 text-right">Loads</th>
              <th className="p-3 text-right">Load Profit</th>
              <th className="p-3 text-right">Repairs</th>
              <th className="p-3 text-right">Net</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={5} className="p-3 text-center text-slate-500">No data</td></tr>
            ) : (
              rows.map(([key, row]) => (
                <tr key={key} className="border-t">
                  <td className="p-3">{key}</td>
                  <td className="p-3 text-right">{row.loads}</td>
                  <td className="p-3 text-right">{currency(row.loadProfit)}</td>
                  <td className="p-3 text-right">{currency(row.actualRepairs)}</td>
                  <td className="p-3 text-right font-semibold">{currency(row.netAfterActualRepairs)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function LoadCard(props: {
  title: string;
  current: string;
  pickup: string;
  delivery: string;
  rcRate: number;
  driverRate: number;
  deadhead: number;
  loaded: number;
  total: number;
  tolls: number;
  diesel: number;
  onCurrent: (v: string) => void;
  onPickup: (v: string) => void;
  onDelivery: (v: string) => void;
  onRc: (v: string) => void;
  onDriverRate: (v: string) => void;
  onDeadhead: (v: string) => void;
  onLoaded: (v: string) => void;
  onTolls: (v: string) => void;
  onDiesel: (v: string) => void;
  onMiles: () => void;
  onTollsCalc: () => void;
  onDieselRefresh: () => void;
}) {
  return (
    <div className="rounded-2xl border bg-white p-6">
      <h2 className="mb-6 text-2xl font-semibold">{props.title}</h2>

      <div className="grid gap-5">
        <Field label="Current Location / ZIP" value={props.current} onChange={props.onCurrent} />
        <Field label="Pickup Location / ZIP" value={props.pickup} onChange={props.onPickup} />
        <Field label="Delivery Location / ZIP" value={props.delivery} onChange={props.onDelivery} />
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <CurrencyField label="RC Rate" value={props.rcRate} onChange={props.onRc} />
        <CurrencyField label="Driver Rate" value={props.driverRate} onChange={props.onDriverRate} />
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <NumberField label="Deadhead Miles" value={props.deadhead} step="0.1" onChange={props.onDeadhead} />
        <NumberField label="Loaded Miles" value={props.loaded} step="0.1" onChange={props.onLoaded} />
        <ReadOnlyMetric label="Total Miles" value={`${props.total.toFixed(1)} mi`} />
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <CurrencyField label="Tolls" value={props.tolls} onChange={props.onTolls} />
        <CurrencyField label="Diesel Price" value={props.diesel} onChange={props.onDiesel} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={props.onMiles} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Calculate Miles</button>
        <button onClick={props.onTollsCalc} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Calculate Tolls</button>
        <button onClick={props.onDieselRefresh} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Refresh Diesel</button>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

function ReadOnlyMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-slate-50 p-3">
      <div className="text-sm font-semibold text-slate-600">{label}</div>
      <div className="mt-1 text-lg font-bold">{value}</div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 flex min-h-[1.25rem] items-end text-sm font-semibold leading-tight">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border p-3" />
    </label>
  );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 flex min-h-[1.25rem] items-end text-sm font-semibold leading-tight">{label}</span>
      <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border p-3" />
    </label>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][] }) {
  return (
    <label className="block">
      <span className="mb-2 flex min-h-[1.25rem] items-end text-sm font-semibold leading-tight">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border p-3">
        {options.map(([val, text]) => <option key={val} value={val}>{text}</option>)}
      </select>
    </label>
  );
}

function CurrencyField({ label, value, onChange }: { label: string; value: number; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 flex min-h-[1.25rem] items-end text-sm font-semibold leading-tight">{label}</span>
      <input type="number" step="0.01" min="0" value={Number.isFinite(value) ? value : 0} onChange={(e) => onChange(e.target.value)} onBlur={(e) => onChange((Number(e.target.value) || 0).toFixed(2))} className="w-full rounded-xl border p-3" />
    </label>
  );
}

function NumberField({ label, value, onChange, step = "1" }: { label: string; value: number; onChange: (value: string) => void; step?: string }) {
  return (
    <label className="block">
      <span className="mb-2 flex min-h-[1.25rem] items-end text-sm font-semibold leading-tight">{label}</span>
      <input type="number" step={step} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border p-3" />
    </label>
  );
}

function CheckboxField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 rounded-xl border bg-white p-3">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />
      <span className="text-sm font-semibold">{label}</span>
    </label>
  );
}
