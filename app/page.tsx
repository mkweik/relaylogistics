"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateLoad } from "@/lib/calculations";
import { DriverType, LoadInputs, ReturnStatus } from "@/types/load";

const defaults: LoadInputs = {
  driverType: "company",
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

  insuranceWeekly: 360,
  eldMonthly: 35,
  cameraMonthly: 35,
  repairPerMile: 0.2,
  factoringPercent: 0,

  minProfit: 700,
  minNetProfitPerMile: 0.65,
};

type SavedLoad = {
  id: string;
  created_at: string;
  load_number: string | null;
  broker: string | null;
  driver_type: DriverType;
  origin_driver_location?: string | null;
  origin_pickup_location?: string | null;
  origin_delivery_location?: string | null;
  return_driver_location?: string | null;
  return_pickup_location?: string | null;
  return_delivery_location?: string | null;
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
  insurance_weekly: number;
  eld_monthly: number;
  camera_monthly: number;
  repair_per_mile: number;
  factoring_percent: number;
  relay_profit: number;
  net_profit_per_mile: number;
  gross_revenue_per_mile: number;
  driver_settlement: number;
  decision: string | null;
};

function currency(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function rpm(n: number) {
  return `$${n.toFixed(2)}/mi`;
}

export default function Home() {
  const [input, setInput] = useState<LoadInputs>(defaults);
  const [saveStatus, setSaveStatus] = useState("");
  const [apiStatus, setApiStatus] = useState("");
  const [savedLoads, setSavedLoads] = useState<SavedLoad[]>([]);
  const [savedLoadsStatus, setSavedLoadsStatus] = useState("");

  const result = useMemo(() => calculateLoad(input), [input]);

  function setNumber<K extends keyof LoadInputs>(key: K, value: string) {
    setInput((prev) => ({ ...prev, [key]: Number(value) || 0 }));
  }

  function setText<K extends keyof LoadInputs>(key: K, value: string) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  async function fetchSavedLoads() {
    setSavedLoadsStatus("Loading saved loads...");
    const response = await fetch("/api/loads", { cache: "no-store" });
    const data = await response.json();

    if (!response.ok) {
      setSavedLoadsStatus(`Could not load saved loads: ${data.error || "Unknown error"}`);
      return;
    }

    setSavedLoads(data.loads || []);
    setSavedLoadsStatus("");
  }

  useEffect(() => {
    fetchSavedLoads();
  }, []);

  function loadSavedEstimate(load: SavedLoad) {
    setInput((prev) => ({
      ...prev,
      driverType: load.driver_type,
      broker: load.broker || "",
      loadNumber: load.load_number || "",
      originDriverLocation: load.origin_driver_location || "",
      originPickupLocation: load.origin_pickup_location || "",
      originDeliveryLocation: load.origin_delivery_location || "",
      returnDriverLocation: load.return_driver_location || "",
      returnPickupLocation: load.return_pickup_location || "",
      returnDeliveryLocation: load.return_delivery_location || "",
      originActualRate: Number(load.origin_actual_rate || 0),
      originDriverRate: Number(load.origin_driver_rate || 0),
      originLoadedMiles: Number(load.origin_loaded_miles || 0),
      originDeadheadMiles: Number(load.origin_deadhead_miles || 0),
      originTolls: Number(load.origin_tolls || 0),
      returnStatus: load.return_status || "none",
      returnActualRate: Number(load.return_actual_rate || 0),
      returnDriverRate: Number(load.return_driver_rate || 0),
      returnLoadedMiles: Number(load.return_loaded_miles || 0),
      returnDeadheadMiles: Number(load.return_deadhead_miles || 0),
      returnTolls: Number(load.return_tolls || 0),
      dieselPrice: Number(load.diesel_price || prev.dieselPrice),
      returnDieselPrice: Number(load.return_diesel_price || prev.returnDieselPrice),
      mpg: Number(load.mpg || prev.mpg),
      returnMpg: Number(load.return_mpg || prev.returnMpg),
      insuranceWeekly: Number(load.insurance_weekly || prev.insuranceWeekly),
      eldMonthly: Number(load.eld_monthly || prev.eldMonthly),
      cameraMonthly: Number(load.camera_monthly || prev.cameraMonthly),
      repairPerMile: Number(load.repair_per_mile || prev.repairPerMile),
      factoringPercent: Number(load.factoring_percent || prev.factoringPercent),
    }));

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveEstimate() {
    setSaveStatus("Saving...");

    const payload = {
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
      insurance_weekly: input.insuranceWeekly,
      eld_monthly: input.eldMonthly,
      camera_monthly: input.cameraMonthly,
      repair_per_mile: input.repairPerMile,
      factoring_percent: input.factoringPercent,

      relay_profit: result.relayProfit,
      net_profit_per_mile: result.netProfitPerMile,
      gross_revenue_per_mile: result.grossRevenuePerMile,
      driver_settlement: result.driverSettlement,
      decision: result.decision,
    };

    const response = await fetch("/api/loads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok) {
      setSaveStatus(`Saved load ${data.load?.id}`);
      fetchSavedLoads();
    } else {
      setSaveStatus(`Save failed: ${data.error}`);
    }
  }

  async function calculateMiles(kind: "origin" | "return") {
    const driverLocation = kind === "origin" ? input.originDriverLocation : input.returnDriverLocation;
    const pickupLocation = kind === "origin" ? input.originPickupLocation : input.returnPickupLocation;
    const deliveryLocation = kind === "origin" ? input.originDeliveryLocation : input.returnDeliveryLocation;

    if (!driverLocation || !pickupLocation || !deliveryLocation) {
      setApiStatus(`Enter driver location, pickup, and delivery for ${kind} load first.`);
      return;
    }

    setApiStatus(`Calculating ${kind} deadhead and loaded miles...`);

    const deadheadResponse = await fetch("/api/route-estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from: driverLocation, to: pickupLocation }),
    });

    const deadheadData = await deadheadResponse.json();

    if (!deadheadResponse.ok) {
      setApiStatus(`Deadhead calculation failed: ${deadheadData.error}`);
      return;
    }

    const loadedResponse = await fetch("/api/route-estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from: pickupLocation, to: deliveryLocation }),
    });

    const loadedData = await loadedResponse.json();

    if (!loadedResponse.ok) {
      setApiStatus(`Loaded miles calculation failed: ${loadedData.error}`);
      return;
    }

    setInput((prev) =>
      kind === "origin"
        ? { ...prev, originDeadheadMiles: deadheadData.miles, originLoadedMiles: loadedData.miles }
        : {
            ...prev,
            returnDeadheadMiles: deadheadData.miles,
            returnLoadedMiles: loadedData.miles,
            returnStatus: prev.returnStatus === "none" ? "estimated" : prev.returnStatus,
          }
    );

    setApiStatus(`Calculated ${kind} miles.`);
  }

  async function calculateTolls(kind: "origin" | "return") {
    const pickupLocation = kind === "origin" ? input.originPickupLocation : input.returnPickupLocation;
    const deliveryLocation = kind === "origin" ? input.originDeliveryLocation : input.returnDeliveryLocation;

    if (!pickupLocation || !deliveryLocation) {
      setApiStatus(`Enter pickup and delivery for ${kind} load first.`);
      return;
    }

    setApiStatus(`Calculating ${kind} tolls...`);

    try {
      const response = await fetch("/api/toll-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: pickupLocation, to: deliveryLocation }),
      });

      const text = await response.text();
      let data: { tolls?: number; error?: string; message?: string; source?: string; currency?: string; fareCount?: number } = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        setApiStatus(`Tolls not ready: API returned unreadable response.`);
        return;
      }

      if (!response.ok) {
        setApiStatus(`Tolls not ready: ${data.error || "Unknown HERE error"}`);
        return;
      }

      const tollAmount = Number(data.tolls || 0);

      setInput((prev) =>
        kind === "origin"
          ? { ...prev, originTolls: tollAmount }
          : {
              ...prev,
              returnTolls: tollAmount,
              returnStatus: prev.returnStatus === "none" ? "estimated" : prev.returnStatus,
            }
      );

      setApiStatus(
        data.message ||
          `Calculated ${kind} tolls from ${data.source || "HERE"}: $${tollAmount.toFixed(2)}`
      );
    } catch (error) {
      setApiStatus(
        error instanceof Error
          ? `Toll calculation failed: ${error.message}`
          : "Toll calculation failed. Enter tolls manually for now."
      );
    }
  }

  async function refreshDiesel(kind: "origin" | "return") {
    setApiStatus(`Refreshing ${kind} diesel price...`);

    const response = await fetch("/api/diesel?region=midwest");
    const data = await response.json();

    if (data.price) {
      setInput((prev) =>
        kind === "origin"
          ? { ...prev, dieselPrice: data.price }
          : { ...prev, returnDieselPrice: data.price }
      );
      setApiStatus(`Updated ${kind} diesel price from EIA.`);
    } else {
      setApiStatus(`Diesel API not ready: ${data.error || "Unknown error"}`);
    }
  }

  async function calculateAll(kind: "origin" | "return") {
    await calculateMiles(kind);
    await calculateTolls(kind);
    await refreshDiesel(kind);
  }

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Relay Load Calculator</h1>
        <p className="text-slate-600">
          V2.0 focuses on route miles, tolls, diesel, and load profit.
        </p>
      </div>

      <section className="mb-6 rounded-2xl border bg-white p-5">
        <h2 className="mb-3 text-xl font-semibold">Driver Type</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {(["company", "owner"] as DriverType[]).map((type) => (
            <button
              key={type}
              onClick={() => setInput((p) => ({ ...p, driverType: type }))}
              className={`rounded-2xl border p-4 text-left ${
                input.driverType === type ? "border-slate-950 bg-slate-100" : "bg-white"
              }`}
            >
              <div className="font-bold">{type === "company" ? "Company Driver" : "Owner Operator"}</div>
              <p className="text-sm text-slate-600">
                {type === "company"
                  ? "35% driver pay. Relay pays operating costs."
                  : "85% owner-op settlement. Owner-op always pays diesel."}
              </p>
            </button>
          ))}
        </div>
      </section>

      {apiStatus && (
        <section className="mb-6 rounded-2xl border bg-white p-4 text-sm text-slate-700">
          <strong>Status:</strong> {apiStatus}
        </section>
      )}

      <section className="mb-6 grid gap-6 lg:grid-cols-2">
        <LoadCard
          title="Originating Load"
          driverLocation={input.originDriverLocation}
          pickupLocation={input.originPickupLocation}
          deliveryLocation={input.originDeliveryLocation}
          rcRate={input.originActualRate}
          driverRate={input.originDriverRate}
          deadheadMiles={input.originDeadheadMiles}
          loadedMiles={input.originLoadedMiles}
          totalMiles={result.originTotalMiles}
          tolls={input.originTolls}
          dieselPrice={input.dieselPrice}
          onDriverLocation={(v) => setText("originDriverLocation", v)}
          onPickupLocation={(v) => setText("originPickupLocation", v)}
          onDeliveryLocation={(v) => setText("originDeliveryLocation", v)}
          onRcRate={(v) => setNumber("originActualRate", v)}
          onDriverRate={(v) => setNumber("originDriverRate", v)}
          onDeadheadMiles={(v) => setNumber("originDeadheadMiles", v)}
          onLoadedMiles={(v) => setNumber("originLoadedMiles", v)}
          onTolls={(v) => setNumber("originTolls", v)}
          onDieselPrice={(v) => setNumber("dieselPrice", v)}
          onCalculateMiles={() => calculateMiles("origin")}
          onCalculateTolls={() => calculateTolls("origin")}
          onRefreshDiesel={() => refreshDiesel("origin")}
          onCalculateAll={() => calculateAll("origin")}
        />

        <div>
          <label className="mb-2 block text-sm font-semibold">Return Status</label>
          <select
            value={input.returnStatus}
            onChange={(e) => setInput((p) => ({ ...p, returnStatus: e.target.value as ReturnStatus }))}
            className="mb-3 w-full rounded-xl border p-3"
          >
            <option value="none">No Return Load Yet</option>
            <option value="estimated">Estimated Return Load</option>
            <option value="confirmed">Confirmed Return Load</option>
          </select>

          <LoadCard
            title="Return Load"
            driverLocation={input.returnDriverLocation}
            pickupLocation={input.returnPickupLocation}
            deliveryLocation={input.returnDeliveryLocation}
            rcRate={input.returnActualRate}
            driverRate={input.returnDriverRate}
            deadheadMiles={input.returnDeadheadMiles}
            loadedMiles={input.returnLoadedMiles}
            totalMiles={result.returnTotalMiles}
            tolls={input.returnTolls}
            dieselPrice={input.returnDieselPrice}
            onDriverLocation={(v) => setText("returnDriverLocation", v)}
            onPickupLocation={(v) => setText("returnPickupLocation", v)}
            onDeliveryLocation={(v) => setText("returnDeliveryLocation", v)}
            onRcRate={(v) => setNumber("returnActualRate", v)}
            onDriverRate={(v) => setNumber("returnDriverRate", v)}
            onDeadheadMiles={(v) => setNumber("returnDeadheadMiles", v)}
            onLoadedMiles={(v) => setNumber("returnLoadedMiles", v)}
            onTolls={(v) => setNumber("returnTolls", v)}
            onDieselPrice={(v) => setNumber("returnDieselPrice", v)}
            onCalculateMiles={() => calculateMiles("return")}
            onCalculateTolls={() => calculateTolls("return")}
            onRefreshDiesel={() => refreshDiesel("return")}
            onCalculateAll={() => calculateAll("return")}
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
        <h2 className="mb-4 text-xl font-semibold">Cost Settings</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <NumberField label="Origin MPG" value={input.mpg} step="0.1" onChange={(v) => setNumber("mpg", v)} />
          <NumberField label="Return MPG" value={input.returnMpg} step="0.1" onChange={(v) => setNumber("returnMpg", v)} />
          <NumberField label="Insurance / Week" value={input.insuranceWeekly} onChange={(v) => setNumber("insuranceWeekly", v)} />
          <NumberField label="ELD / Month" value={input.eldMonthly} onChange={(v) => setNumber("eldMonthly", v)} />
          <NumberField label="Camera / Month" value={input.cameraMonthly} onChange={(v) => setNumber("cameraMonthly", v)} />
          <NumberField label="Repair / Mile" value={input.repairPerMile} step="0.01" onChange={(v) => setNumber("repairPerMile", v)} />
          <NumberField label="Factoring %" value={input.factoringPercent} step="0.01" onChange={(v) => setNumber("factoringPercent", v)} />
          <NumberField
            label="Min Profit / Mile"
            value={input.minNetProfitPerMile}
            step="0.01"
            onChange={(v) => setNumber("minNetProfitPerMile", v)}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={saveEstimate} className="rounded-xl bg-green-700 px-4 py-2 font-semibold text-white">
            Save Estimate
          </button>
          {saveStatus && <span className="text-sm text-slate-600">{saveStatus}</span>}
        </div>
      </section>

      <section className="mb-6 rounded-2xl border bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Saved Loads</h2>
            <p className="text-sm text-slate-600">Latest 25 saved estimates from Supabase.</p>
          </div>
          <button onClick={fetchSavedLoads} className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white">
            Refresh Saved Loads
          </button>
        </div>

        {savedLoadsStatus && <div className="mb-3 rounded-xl bg-yellow-100 p-3 text-sm text-yellow-900">{savedLoadsStatus}</div>}

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="border-b p-3">Date</th>
                <th className="border-b p-3">Load #</th>
                <th className="border-b p-3">Broker</th>
                <th className="border-b p-3">Driver Type</th>
                <th className="border-b p-3 text-right">Origin Rate</th>
                <th className="border-b p-3 text-right">Return Rate</th>
                <th className="border-b p-3 text-right">Relay Profit</th>
                <th className="border-b p-3 text-right">Net/Mile</th>
                <th className="border-b p-3">Decision</th>
                <th className="border-b p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {savedLoads.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-4 text-center text-slate-500">
                    No saved loads yet.
                  </td>
                </tr>
              ) : (
                savedLoads.map((load) => (
                  <tr key={load.id} className="border-b last:border-b-0">
                    <td className="p-3">{new Date(load.created_at).toLocaleDateString()}</td>
                    <td className="p-3 font-semibold">{load.load_number || "-"}</td>
                    <td className="p-3">{load.broker || "-"}</td>
                    <td className="p-3">{load.driver_type === "company" ? "Company" : "Owner-Op"}</td>
                    <td className="p-3 text-right">{currency(Number(load.origin_actual_rate || 0))}</td>
                    <td className="p-3 text-right">{currency(Number(load.return_actual_rate || 0))}</td>
                    <td className="p-3 text-right font-semibold">{currency(Number(load.relay_profit || 0))}</td>
                    <td className="p-3 text-right">{rpm(Number(load.net_profit_per_mile || 0))}</td>
                    <td className="p-3 font-semibold">{load.decision || "-"}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => loadSavedEstimate(load)}
                        className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                      >
                        Load
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-5">
        <h2 className="mb-4 text-xl font-semibold">Breakdown</h2>
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

function LoadCard({
  title,
  driverLocation,
  pickupLocation,
  deliveryLocation,
  rcRate,
  driverRate,
  deadheadMiles,
  loadedMiles,
  totalMiles,
  tolls,
  dieselPrice,
  onDriverLocation,
  onPickupLocation,
  onDeliveryLocation,
  onRcRate,
  onDriverRate,
  onDeadheadMiles,
  onLoadedMiles,
  onTolls,
  onDieselPrice,
  onCalculateMiles,
  onCalculateTolls,
  onRefreshDiesel,
  onCalculateAll,
}: {
  title: string;
  driverLocation: string;
  pickupLocation: string;
  deliveryLocation: string;
  rcRate: number;
  driverRate: number;
  deadheadMiles: number;
  loadedMiles: number;
  totalMiles: number;
  tolls: number;
  dieselPrice: number;
  onDriverLocation: (value: string) => void;
  onPickupLocation: (value: string) => void;
  onDeliveryLocation: (value: string) => void;
  onRcRate: (value: string) => void;
  onDriverRate: (value: string) => void;
  onDeadheadMiles: (value: string) => void;
  onLoadedMiles: (value: string) => void;
  onTolls: (value: string) => void;
  onDieselPrice: (value: string) => void;
  onCalculateMiles: () => void;
  onCalculateTolls: () => void;
  onRefreshDiesel: () => void;
  onCalculateAll: () => void;
}) {
  return (
    <div className="rounded-2xl border bg-white p-6">
      <h2 className="mb-6 text-2xl font-semibold">{title}</h2>

      <div className="grid gap-5">
        <Field label="Current Location / ZIP" value={driverLocation} onChange={onDriverLocation} />
        <Field label="Pickup Location / ZIP" value={pickupLocation} onChange={onPickupLocation} />
        <Field label="Delivery Location / ZIP" value={deliveryLocation} onChange={onDeliveryLocation} />
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <CurrencyField label="RC Rate" value={rcRate} onChange={onRcRate} />
        <CurrencyField label="Driver Rate" value={driverRate} onChange={onDriverRate} />
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <NumberField label="Deadhead Miles" value={deadheadMiles} step="0.1" onChange={onDeadheadMiles} />
        <NumberField label="Loaded Miles" value={loadedMiles} step="0.1" onChange={onLoadedMiles} />
        <ReadOnlyMetric label="Total Miles" value={`${totalMiles.toFixed(1)} mi`} />
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <CurrencyField label="Tolls" value={tolls} onChange={onTolls} />
        <CurrencyField label="Diesel Price" value={dieselPrice} onChange={onDieselPrice} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={onCalculateMiles} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
          Calculate Miles
        </button>
        <button onClick={onCalculateTolls} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
          Calculate Tolls
        </button>
        <button onClick={onRefreshDiesel} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
          Refresh Diesel
        </button>
        <button onClick={onCalculateAll} className="rounded-xl bg-green-700 px-3 py-2 text-sm font-semibold text-white">
          Calculate All
        </button>
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
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border p-3"
        placeholder="Full address or ZIP"
      />
    </label>
  );
}

function CurrencyField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex min-h-[1.25rem] items-end text-sm font-semibold leading-tight">{label}</span>
      <input
        type="number"
        step="0.01"
        min="0"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onChange((Number(e.target.value) || 0).toFixed(2))}
        className="w-full rounded-xl border p-3"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step = "1",
}: {
  label: string;
  value: number;
  onChange: (value: string) => void;
  step?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex min-h-[1.25rem] items-end text-sm font-semibold leading-tight">{label}</span>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border p-3"
      />
    </label>
  );
}
