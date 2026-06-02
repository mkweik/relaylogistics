"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateLoad } from "@/lib/calculations";
import { DriverType, LoadInputs, ReturnStatus } from "@/types/load";

const defaults: LoadInputs = {
  driverType: "company",
  broker: "OpenRoad Global",
  loadNumber: "OR530132",

  originActualRate: 2050,
  originDriverRate: 2050,
  originLoadedMiles: 515,
  originDeadheadMiles: 20,
  originTolls: 150,

  returnStatus: "estimated",
  returnActualRate: 900,
  returnDriverRate: 900,
  returnLoadedMiles: 515,
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

export default function Home() {
  const [input, setInput] = useState<LoadInputs>(defaults);
  const [saveStatus, setSaveStatus] = useState("");
  const [savedLoads, setSavedLoads] = useState<SavedLoad[]>([]);
  const [savedLoadsStatus, setSavedLoadsStatus] = useState("");
  const [lastSavedLoadId, setLastSavedLoadId] = useState("");
  const [originRcFile, setOriginRcFile] = useState<File | null>(null);
  const [returnRcFile, setReturnRcFile] = useState<File | null>(null);
  const [parseStatus, setParseStatus] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");

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

      origin_actual_rate: input.originActualRate,
      origin_driver_rate: input.originDriverRate,
      origin_loaded_miles: input.originLoadedMiles,
      origin_deadhead_miles: input.originDeadheadMiles,
      origin_tolls: input.originTolls,

      return_status: input.returnStatus,
      return_actual_rate: input.returnActualRate,
      return_driver_rate: input.returnDriverRate,
      return_loaded_miles: input.returnLoadedMiles,
      return_deadhead_miles: input.returnDeadheadMiles,
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
      setLastSavedLoadId(data.load?.id || "");
      fetchSavedLoads();
    } else {
      setSaveStatus(`Save failed: ${data.error}`);
    }
  }

  async function parseRc(file: File | null, type: "origin" | "return") {
    if (!file) {
      setParseStatus(`Select a ${type} RC file first.`);
      return;
    }

    setParseStatus(`Parsing ${type} RC...`);

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/parse-rc", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      setParseStatus(`Parse failed: ${data.error}`);
      return;
    }

    const parsed = data.parsed || {};

    setInput((prev) => ({
      ...prev,
      broker: type === "origin" && parsed.broker ? parsed.broker : prev.broker,
      loadNumber: type === "origin" && parsed.loadNumber ? parsed.loadNumber : prev.loadNumber,
      originActualRate: type === "origin" && parsed.rate ? Number(parsed.rate) : prev.originActualRate,
      originDriverRate: type === "origin" && parsed.rate ? Number(parsed.rate) : prev.originDriverRate,
      returnActualRate: type === "return" && parsed.rate ? Number(parsed.rate) : prev.returnActualRate,
      returnDriverRate: type === "return" && parsed.rate ? Number(parsed.rate) : prev.returnDriverRate,
      returnStatus: type === "return" ? "confirmed" : prev.returnStatus,
    }));

    const warnings = parsed.warnings?.length ? ` Warnings: ${parsed.warnings.join(" ")}` : "";
    setParseStatus(`Parsed ${type} RC.${warnings}`);
  }

  async function uploadRc(file: File | null, fileType: "origin_rc" | "return_rc") {
    if (!file) {
      setUploadStatus("Select a file first.");
      return;
    }

    if (!lastSavedLoadId) {
      setUploadStatus("Save the estimate first, then upload the RC file.");
      return;
    }

    setUploadStatus("Uploading RC file...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("loadId", lastSavedLoadId);
    formData.append("fileType", fileType);

    const response = await fetch("/api/upload-rc", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      setUploadStatus(`Upload failed: ${data.error}`);
      return;
    }

    setUploadStatus(`Uploaded ${data.file?.original_filename || "RC file"}.`);
  }

  async function refreshDiesel() {
    const response = await fetch("/api/diesel?region=midwest");
    const data = await response.json();

    if (data.price) {
      setInput((prev) => ({ ...prev, dieselPrice: data.price, returnDieselPrice: data.price }));
    } else {
      alert(data.error || "Diesel API not ready.");
    }
  }

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Relay Load Calculator</h1>
        <p className="text-slate-600">Live test app. Manual entry first, APIs next, chaos always.</p>
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

      <section className="mb-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5">
          <h2 className="mb-4 text-xl font-semibold">Originating Load</h2>

          <div className="mb-4 rounded-xl border bg-slate-50 p-3">
            <label className="mb-2 block text-sm font-semibold">Origin RC Upload / Parse</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setOriginRcFile(e.target.files?.[0] || null)}
              className="mb-3 w-full rounded-xl border bg-white p-3"
            />
            <div className="flex flex-wrap gap-2">
              <button onClick={() => parseRc(originRcFile, "origin")} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
                Parse Origin RC
              </button>
              <button onClick={() => uploadRc(originRcFile, "origin_rc")} className="rounded-xl bg-green-700 px-3 py-2 text-sm font-semibold text-white">
                Upload Origin RC
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Broker" value={input.broker} onChange={(v) => setText("broker", v)} />
            <Field label="Load Number" value={input.loadNumber} onChange={(v) => setText("loadNumber", v)} />
            <NumberField label="Actual Rate Con Value" value={input.originActualRate} onChange={(v) => setNumber("originActualRate", v)} />
            <NumberField label="Rate Given to Driver" value={input.originDriverRate} onChange={(v) => setNumber("originDriverRate", v)} />
            <NumberField label="Loaded Miles" value={input.originLoadedMiles} onChange={(v) => setNumber("originLoadedMiles", v)} />
            <NumberField label="Deadhead Miles" value={input.originDeadheadMiles} onChange={(v) => setNumber("originDeadheadMiles", v)} />
            <NumberField label="Tolls" value={input.originTolls} onChange={(v) => setNumber("originTolls", v)} />
            <NumberField label="Diesel Price" value={input.dieselPrice} step="0.01" onChange={(v) => setNumber("dieselPrice", v)} />
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <h2 className="mb-4 text-xl font-semibold">Return Load</h2>

          <div className="mb-4 rounded-xl border bg-slate-50 p-3">
            <label className="mb-2 block text-sm font-semibold">Return RC Upload / Parse</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setReturnRcFile(e.target.files?.[0] || null)}
              className="mb-3 w-full rounded-xl border bg-white p-3"
            />
            <div className="flex flex-wrap gap-2">
              <button onClick={() => parseRc(returnRcFile, "return")} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
                Parse Return RC
              </button>
              <button onClick={() => uploadRc(returnRcFile, "return_rc")} className="rounded-xl bg-green-700 px-3 py-2 text-sm font-semibold text-white">
                Upload Return RC
              </button>
            </div>
          </div>

          <label className="mb-2 block text-sm font-semibold">Return Status</label>
          <select
            value={input.returnStatus}
            onChange={(e) => setInput((p) => ({ ...p, returnStatus: e.target.value as ReturnStatus }))}
            className="mb-4 w-full rounded-xl border p-3"
          >
            <option value="none">No Return Load Yet</option>
            <option value="estimated">Estimated Return Load</option>
            <option value="confirmed">Confirmed Return Load</option>
          </select>

          <div className="grid gap-4 md:grid-cols-2">
            <NumberField label="Return Actual Rate" value={input.returnActualRate} onChange={(v) => setNumber("returnActualRate", v)} />
            <NumberField label="Return Driver Rate" value={input.returnDriverRate} onChange={(v) => setNumber("returnDriverRate", v)} />
            <NumberField label="Return Loaded Miles" value={input.returnLoadedMiles} onChange={(v) => setNumber("returnLoadedMiles", v)} />
            <NumberField label="Return Deadhead Miles" value={input.returnDeadheadMiles} onChange={(v) => setNumber("returnDeadheadMiles", v)} />
            <NumberField label="Return Tolls" value={input.returnTolls} onChange={(v) => setNumber("returnTolls", v)} />
            <NumberField label="Return Diesel Price" value={input.returnDieselPrice} step="0.01" onChange={(v) => setNumber("returnDieselPrice", v)} />
          </div>
        </div>
      </section>

      {(parseStatus || uploadStatus) && (
        <section className="mb-6 rounded-2xl border bg-white p-4 text-sm text-slate-700">
          {parseStatus && (
            <div>
              <strong>Parser:</strong> {parseStatus}
            </div>
          )}
          {uploadStatus && (
            <div>
              <strong>Upload:</strong> {uploadStatus}
            </div>
          )}
        </section>
      )}

      <section className="mb-6 grid gap-4 md:grid-cols-4">
        <Metric label="Decision" value={result.decision} />
        <Metric label="Relay Net Profit" value={currency(result.relayProfit)} />
        <Metric label="Net Profit / Mile" value={`$${result.netProfitPerMile.toFixed(2)}/mi`} />
        <Metric label="Driver Settlement" value={currency(result.driverSettlement)} />
      </section>

      <section className="mb-6 rounded-2xl border bg-white p-5">
        <h2 className="mb-4 text-xl font-semibold">Cost Settings</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <NumberField label="MPG" value={input.mpg} step="0.1" onChange={(v) => setNumber("mpg", v)} />
          <NumberField label="Return MPG" value={input.returnMpg} step="0.1" onChange={(v) => setNumber("returnMpg", v)} />
          <NumberField label="Insurance / Week" value={input.insuranceWeekly} onChange={(v) => setNumber("insuranceWeekly", v)} />
          <NumberField label="ELD / Month" value={input.eldMonthly} onChange={(v) => setNumber("eldMonthly", v)} />
          <NumberField label="Camera / Month" value={input.cameraMonthly} onChange={(v) => setNumber("cameraMonthly", v)} />
          <NumberField label="Repair / Mile" value={input.repairPerMile} step="0.01" onChange={(v) => setNumber("repairPerMile", v)} />
          <NumberField label="Factoring %" value={input.factoringPercent} step="0.01" onChange={(v) => setNumber("factoringPercent", v)} />
          <NumberField label="Min Profit / Mile" value={input.minNetProfitPerMile} step="0.01" onChange={(v) => setNumber("minNetProfitPerMile", v)} />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={refreshDiesel} className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white">
            Refresh Diesel Price
          </button>
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
                    <td className="p-3 text-right">${Number(load.net_profit_per_mile || 0).toFixed(2)}/mi</td>
                    <td className="p-3 font-semibold">{load.decision || "-"}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => loadSavedEstimate(load)} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white">
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border p-3" />
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
      <span className="mb-1 block text-sm font-semibold">{label}</span>
      <input type="number" step={step} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border p-3" />
    </label>
  );
}
