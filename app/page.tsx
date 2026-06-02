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
  owner_operator_charges_tolls: boolean | null;
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
  owner_operator_charges_tolls: boolean;
  dispatch_fee_percent: number;
  apply_dispatch_fee_origin: boolean;
  apply_dispatch_fee_return: boolean;
  insurance_weekly: number;
  eld_monthly: number;
  camera_monthly: number;
  repair_per_mile: number;
  factoring_percent: number;
  dispatch_fee: number;
  estimated_diesel_cost: number;
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

type ActualCost = {
  id: string;
  driver_id: string | null;
  cost_date: string;
  cost_type: "diesel" | "misc";
  amount: number;
  vendor: string | null;
  description: string | null;
  truck_number: string | null;
};

const today = new Date().toISOString().slice(0, 10);

const baseDefaults: LoadInputs = {
  driverType: "company",
  driverId: "",
  loadDate: today,
  broker: "",
  loadNumber: "",

  originDriverLocation: "",
  originPickupLocation: "",
  originDeliveryLocation: "",
  originPickupCount: 1,
  originDeliveryCount: 1,
  originPickupLocations: [""],
  originDeliveryLocations: [""],

  returnDriverLocation: "",
  returnPickupLocation: "",
  returnDeliveryLocation: "",
  returnPickupCount: 1,
  returnDeliveryCount: 1,
  returnPickupLocations: [""],
  returnDeliveryLocations: [""],

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
  ownerOperatorChargesTolls: false,

  dispatchFeePercent: 0,
  applyDispatchFeeOrigin: false,
  applyDispatchFeeReturn: false,

  insuranceWeekly: 360,
  eldMonthly: 35,
  cameraMonthly: 35,
  repairPerMile: 0.15,
  factoringPercent: 0.95,
  milesPerDay: 650,

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
  const [tab, setTab] = useState<"quote" | "completed">("quote");
  const [quoteInput, setQuoteInput] = useState<LoadInputs>(baseDefaults);
  const [completedInput, setCompletedInput] = useState<LoadInputs>(baseDefaults);
  const activeInput = tab === "quote" ? quoteInput : completedInput;
  const setActiveInput = tab === "quote" ? setQuoteInput : setCompletedInput;

  const [globalCompanyDriverPercent, setGlobalCompanyDriverPercent] = useState(baseDefaults.companyDriverPercent);
  const [globalOwnerOperatorPercent, setGlobalOwnerOperatorPercent] = useState(baseDefaults.ownerOperatorPercent);

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [status, setStatus] = useState("");

  const [newDriverName, setNewDriverName] = useState("");
  const [newDriverTruck, setNewDriverTruck] = useState("");
  const [newDriverType, setNewDriverType] = useState<DriverType>("company");
  const [newDriverChargesTolls, setNewDriverChargesTolls] = useState(false);

  const [editingDriverId, setEditingDriverId] = useState("");
  const [editDriverName, setEditDriverName] = useState("");
  const [editDriverTruck, setEditDriverTruck] = useState("");
  const [editDriverType, setEditDriverType] = useState<DriverType>("company");
  const [editDriverActive, setEditDriverActive] = useState(true);
  const [editDriverChargesTolls, setEditDriverChargesTolls] = useState(false);

  const [repairDriverId, setRepairDriverId] = useState("");
  const [repairDate, setRepairDate] = useState(today);
  const [repairAmount, setRepairAmount] = useState(0);
  const [repairVendor, setRepairVendor] = useState("");
  const [repairDescription, setRepairDescription] = useState("");
  const [repairTruck, setRepairTruck] = useState("");

  const [costDriverId, setCostDriverId] = useState("");
  const [costDate, setCostDate] = useState(today);
  const [costType, setCostType] = useState<"diesel" | "misc">("diesel");
  const [costAmount, setCostAmount] = useState(0);
  const [costVendor, setCostVendor] = useState("");
  const [costDescription, setCostDescription] = useState("");
  const [costTruck, setCostTruck] = useState("");

  const [bulkDieselText, setBulkDieselText] = useState("");
  const [bulkDieselPreview, setBulkDieselPreview] = useState<
    { driver_id: string; driver_name: string; truck_number: string | null; cost_date: string; amount: number; vendor: string; description: string }[]
  >([]);
  const [bulkDieselErrors, setBulkDieselErrors] = useState<string[]>([]);

  const [reportDriverId, setReportDriverId] = useState("");
  const [reportStart, setReportStart] = useState(today.slice(0, 8) + "01");
  const [reportEnd, setReportEnd] = useState(today);
  const [reportLoads, setReportLoads] = useState<SavedLoad[]>([]);
  const [reportRepairs, setReportRepairs] = useState<Repair[]>([]);
  const [reportCosts, setReportCosts] = useState<ActualCost[]>([]);

  const quoteResult = useMemo(() => calculateLoad(quoteInput), [quoteInput]);
  const completedResult = useMemo(() => calculateLoad(completedInput), [completedInput]);
  const activeResult = tab === "quote" ? quoteResult : completedResult;

  function setNumber<K extends keyof LoadInputs>(key: K, value: string) {
    setActiveInput((prev) => ({ ...prev, [key]: Number(value) || 0 }));
  }

  function setText<K extends keyof LoadInputs>(key: K, value: string) {
    setActiveInput((prev) => ({ ...prev, [key]: value }));
  }

  function applyGlobalPayPercentages() {
    setQuoteInput((prev) => ({
      ...prev,
      companyDriverPercent: globalCompanyDriverPercent,
      ownerOperatorPercent: globalOwnerOperatorPercent,
    }));

    setCompletedInput((prev) => ({
      ...prev,
      companyDriverPercent: globalCompanyDriverPercent,
      ownerOperatorPercent: globalOwnerOperatorPercent,
    }));

    setStatus("Updated default driver pay percentages for quote and completed load forms.");
  }

  function syncCount(list: string[], count: number) {
    const safeCount = Math.max(1, Math.min(Number(count) || 1, 10));
    const next = [...list];
    while (next.length < safeCount) next.push("");
    return next.slice(0, safeCount);
  }

  function updateStopCount(kind: "origin" | "return", stopType: "pickup" | "delivery", value: string) {
    const count = Math.max(1, Math.min(Number(value) || 1, 10));

    setActiveInput((prev) => {
      if (kind === "origin" && stopType === "pickup") return { ...prev, originPickupCount: count, originPickupLocations: syncCount(prev.originPickupLocations, count) };
      if (kind === "origin" && stopType === "delivery") return { ...prev, originDeliveryCount: count, originDeliveryLocations: syncCount(prev.originDeliveryLocations, count) };
      if (kind === "return" && stopType === "pickup") return { ...prev, returnPickupCount: count, returnPickupLocations: syncCount(prev.returnPickupLocations, count) };
      return { ...prev, returnDeliveryCount: count, returnDeliveryLocations: syncCount(prev.returnDeliveryLocations, count) };
    });
  }

  function updateStopAddress(kind: "origin" | "return", stopType: "pickup" | "delivery", index: number, value: string) {
    setActiveInput((prev) => {
      if (kind === "origin" && stopType === "pickup") {
        const locations = [...prev.originPickupLocations];
        locations[index] = value;
        return { ...prev, originPickupLocations: locations, originPickupLocation: locations[0] || "" };
      }
      if (kind === "origin" && stopType === "delivery") {
        const locations = [...prev.originDeliveryLocations];
        locations[index] = value;
        return { ...prev, originDeliveryLocations: locations, originDeliveryLocation: locations[locations.length - 1] || "" };
      }
      if (kind === "return" && stopType === "pickup") {
        const locations = [...prev.returnPickupLocations];
        locations[index] = value;
        return { ...prev, returnPickupLocations: locations, returnPickupLocation: locations[0] || "" };
      }
      const locations = [...prev.returnDeliveryLocations];
      locations[index] = value;
      return { ...prev, returnDeliveryLocations: locations, returnDeliveryLocation: locations[locations.length - 1] || "" };
    });
  }

  async function routeMiles(from: string, to: string) {
    const response = await fetch("/api/route-estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from, to }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Route miles failed.");
    return Number(data.miles || 0);
  }

  async function fetchDrivers() {
    const response = await fetch("/api/drivers?include_inactive=true", { cache: "no-store" });
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
      body: JSON.stringify({ name: newDriverName.trim(), truck_number: newDriverTruck.trim(), driver_type: newDriverType, owner_operator_charges_tolls: newDriverChargesTolls }),
    });

    const data = await response.json();

    if (!response.ok) {
      setStatus(`Driver save failed: ${data.error}`);
      return;
    }

    setNewDriverName("");
    setNewDriverTruck("");
    setNewDriverChargesTolls(false);
    setStatus(`Added driver ${data.driver?.name}`);
    fetchDrivers();
  }

  function startEditDriver(driver: Driver) {
    setEditingDriverId(driver.id);
    setEditDriverName(driver.name);
    setEditDriverTruck(driver.truck_number || "");
    setEditDriverType(driver.driver_type);
    setEditDriverActive(Boolean(driver.is_active));
    setEditDriverChargesTolls(Boolean(driver.owner_operator_charges_tolls));
    setStatus(`Editing ${driver.name}`);
  }

  function cancelEditDriver() {
    setEditingDriverId("");
    setEditDriverName("");
    setEditDriverTruck("");
    setEditDriverType("company");
    setEditDriverActive(true);
    setEditDriverChargesTolls(false);
  }

  async function updateDriver() {
    if (!editingDriverId) {
      setStatus("Select a driver to edit first.");
      return;
    }

    const response = await fetch("/api/drivers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingDriverId,
        name: editDriverName.trim(),
        truck_number: editDriverTruck.trim(),
        driver_type: editDriverType,
        is_active: editDriverActive,
        owner_operator_charges_tolls: editDriverChargesTolls,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setStatus(`Driver update failed: ${data.error}`);
      return;
    }

    setStatus(`Updated driver ${data.driver?.name}`);
    cancelEditDriver();
    fetchDrivers();
  }

  function buildLoadPayload(input: LoadInputs, result: ReturnType<typeof calculateLoad>) {
    return {
      driver_id: input.driverId || null,
      load_date: input.loadDate,
      load_number: input.loadNumber,
      broker: input.broker,
      driver_type: input.driverType,

      origin_driver_location: input.originDriverLocation,
      origin_pickup_location: input.originPickupLocation,
      origin_delivery_location: input.originDeliveryLocations[input.originDeliveryLocations.length - 1] || input.originDeliveryLocation,
      origin_pickup_locations: input.originPickupLocations,
      origin_delivery_locations: input.originDeliveryLocations,

      return_driver_location: input.returnDriverLocation,
      return_pickup_location: input.returnPickupLocation,
      return_delivery_location: input.returnDeliveryLocations[input.returnDeliveryLocations.length - 1] || input.returnDeliveryLocation,
      return_pickup_locations: input.returnPickupLocations,
      return_delivery_locations: input.returnDeliveryLocations,

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
      owner_operator_charges_tolls: input.ownerOperatorChargesTolls,

      dispatch_fee_percent: input.dispatchFeePercent,
      apply_dispatch_fee_origin: input.applyDispatchFeeOrigin,
      apply_dispatch_fee_return: input.applyDispatchFeeReturn,

      insurance_weekly: input.insuranceWeekly,
      eld_monthly: input.eldMonthly,
      camera_monthly: input.cameraMonthly,
      repair_per_mile: input.repairPerMile,
      factoring_percent: input.factoringPercent,

      dispatch_fee: result.dispatchFee,
      estimated_diesel_cost: result.estimatedDieselCost,
      repair_reserve_amount: result.repairReserveAmount,
      relay_profit: result.relayProfit,
      net_profit_per_mile: result.netProfitPerMile,
      gross_revenue_per_mile: result.grossRevenuePerMile,
      driver_settlement: result.driverSettlement,
      total_revenue: result.totalRevenue,
      total_miles: result.totalMiles,
      decision: result.decision,
    };
  }

  async function saveCompletedLoad() {
    if (!completedInput.driverId) {
      setStatus("Select a driver before saving completed load.");
      return;
    }

    if (!completedInput.loadDate) {
      setStatus("Enter load date before saving completed load.");
      return;
    }

    const response = await fetch("/api/loads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildLoadPayload(completedInput, completedResult)),
    });

    const data = await response.json();

    if (!response.ok) {
      setStatus(`Save failed: ${data.error}`);
      return;
    }

    setStatus(`Saved completed load ${data.load?.id}`);
  }

  async function calculateMiles(kind: "origin" | "return") {
    const input = activeInput;
    const driverLocation = kind === "origin" ? input.originDriverLocation : input.returnDriverLocation;
    const pickups = kind === "origin" ? input.originPickupLocations : input.returnPickupLocations;
    const deliveries = kind === "origin" ? input.originDeliveryLocations : input.returnDeliveryLocations;

    const cleanPickups = pickups.map((x) => x.trim()).filter(Boolean);
    const cleanDeliveries = deliveries.map((x) => x.trim()).filter(Boolean);

    if (!driverLocation || cleanPickups.length === 0 || cleanDeliveries.length === 0) {
      setStatus(`Enter current location, all pickups, and all deliveries for ${kind} load first.`);
      return;
    }

    try {
      setStatus(`Calculating ${kind} miles through ${cleanPickups.length} pickup(s) and ${cleanDeliveries.length} delivery location(s)...`);

      const deadheadMiles = await routeMiles(driverLocation, cleanPickups[0]);
      const stops = [...cleanPickups, ...cleanDeliveries];
      let loadedMiles = 0;

      for (let i = 0; i < stops.length - 1; i++) {
        loadedMiles += await routeMiles(stops[i], stops[i + 1]);
      }

      setActiveInput((prev) =>
        kind === "origin"
          ? { ...prev, originDeadheadMiles: Number(deadheadMiles.toFixed(1)), originLoadedMiles: Number(loadedMiles.toFixed(1)) }
          : { ...prev, returnDeadheadMiles: Number(deadheadMiles.toFixed(1)), returnLoadedMiles: Number(loadedMiles.toFixed(1)), returnStatus: prev.returnStatus === "none" ? "estimated" : prev.returnStatus }
      );

      setStatus(`Calculated ${kind} miles.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : `Could not calculate ${kind} miles.`);
    }
  }

  async function calculateTolls(kind: "origin" | "return") {
    const input = activeInput;
    const pickups = kind === "origin" ? input.originPickupLocations : input.returnPickupLocations;
    const deliveries = kind === "origin" ? input.originDeliveryLocations : input.returnDeliveryLocations;
    const cleanPickups = pickups.map((x) => x.trim()).filter(Boolean);
    const cleanDeliveries = deliveries.map((x) => x.trim()).filter(Boolean);
    const pickupLocation = cleanPickups[0];
    const deliveryLocation = cleanDeliveries[cleanDeliveries.length - 1];

    if (!pickupLocation || !deliveryLocation) {
      setStatus(`Enter pickup and delivery for ${kind} load first.`);
      return;
    }

    setStatus(`Calculating ${kind} tolls from first pickup to final delivery...`);

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

    setActiveInput((prev) =>
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

    setActiveInput((prev) => (kind === "origin" ? { ...prev, dieselPrice: data.price } : { ...prev, returnDieselPrice: data.price }));
    setStatus(`Updated ${kind} diesel from EIA.`);
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

  async function saveActualCost() {
    if (!costDriverId) {
      setStatus("Select a driver before saving actual cost.");
      return;
    }

    const response = await fetch("/api/costs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        driver_id: costDriverId,
        cost_date: costDate,
        cost_type: costType,
        amount: costAmount,
        vendor: costVendor,
        description: costDescription,
        truck_number: costTruck,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setStatus(`Actual cost save failed: ${data.error}`);
      return;
    }

    setCostAmount(0);
    setCostVendor("");
    setCostDescription("");
    setCostTruck("");
    setStatus(`Saved ${costType} cost ${data.cost?.id}`);
  }

  function normalizeDate(value: string) {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toISOString().slice(0, 10);
  }

  function findDriverByNameOrTruck(value: string) {
    const search = value.trim().toLowerCase();
    return drivers.find((driver) => driver.name.toLowerCase() === search || (driver.truck_number || "").toLowerCase() === search);
  }

  function parseBulkDieselText() {
    const rows = bulkDieselText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const parsed: typeof bulkDieselPreview = [];
    const errors: string[] = [];

    rows.forEach((line, index) => {
      const parts = line.split(",").map((part) => part.trim());
      const rowNumber = index + 1;

      if (parts.length < 3) {
        errors.push(`Row ${rowNumber}: use date, driver/truck, amount, vendor, description.`);
        return;
      }

      const cost_date = normalizeDate(parts[0]);
      const driver = findDriverByNameOrTruck(parts[1]);
      const amount = Number(parts[2].replace(/[$,]/g, ""));
      const vendor = parts[3] || "";
      const description = parts.slice(4).join(", ") || "Diesel";

      if (!cost_date) errors.push(`Row ${rowNumber}: invalid date "${parts[0]}".`);
      if (!driver) errors.push(`Row ${rowNumber}: could not match driver/truck "${parts[1]}".`);
      if (!amount || amount <= 0) errors.push(`Row ${rowNumber}: invalid amount "${parts[2]}".`);
      if (!cost_date || !driver || !amount || amount <= 0) return;

      parsed.push({
        driver_id: driver.id,
        driver_name: driver.name,
        truck_number: driver.truck_number || null,
        cost_date,
        amount,
        vendor,
        description,
      });
    });

    setBulkDieselPreview(parsed);
    setBulkDieselErrors(errors);
    setStatus(errors.length ? `Parsed ${parsed.length} row(s) with ${errors.length} issue(s).` : `Parsed ${parsed.length} diesel transaction(s).`);
  }

  async function saveBulkDiesel() {
    if (bulkDieselPreview.length === 0) {
      setStatus("Parse bulk diesel first.");
      return;
    }

    if (bulkDieselErrors.length > 0) {
      setStatus("Fix bulk diesel errors before saving.");
      return;
    }

    const response = await fetch("/api/costs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entries: bulkDieselPreview.map((entry) => ({
          driver_id: entry.driver_id,
          cost_date: entry.cost_date,
          cost_type: "diesel",
          amount: entry.amount,
          vendor: entry.vendor,
          description: entry.description,
          truck_number: entry.truck_number,
        })),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setStatus(`Bulk diesel save failed: ${data.error}`);
      return;
    }

    setStatus(`Saved ${data.count || bulkDieselPreview.length} diesel transaction(s).`);
    setBulkDieselText("");
    setBulkDieselPreview([]);
    setBulkDieselErrors([]);
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

    const costResponse = await fetch(`/api/costs?driver_id=${reportDriverId}&start=${reportStart}&end=${reportEnd}`, { cache: "no-store" });
    const costData = await costResponse.json();

    if (!loadResponse.ok) return setStatus(`Report load fetch failed: ${loadData.error}`);
    if (!repairResponse.ok) return setStatus(`Report repair fetch failed: ${repairData.error}`);
    if (!costResponse.ok) return setStatus(`Report cost fetch failed: ${costData.error}`);

    setReportLoads(loadData.loads || []);
    setReportRepairs(repairData.repairs || []);
    setReportCosts(costData.costs || []);
    setStatus("Report updated.");
  }

  const report = useMemo(() => buildReport(reportLoads, reportRepairs, reportCosts), [reportLoads, reportRepairs, reportCosts]);

  const activeDrivers = drivers.filter((d) => d.is_active);
  const driverOptions: [string, string][] = [["", "Select Driver"], ...activeDrivers.map((d) => [d.id, `${d.name}${d.truck_number ? " - Truck " + d.truck_number : ""}`] as [string, string])];

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Relay Load Calculator V3.9.4</h1>
        <p className="text-slate-600">Quote loads before booking, then enter completed loads by driver for real P&L.</p>
      </div>

      {status && <section className="mb-6 rounded-2xl border bg-white p-4 text-sm"><strong>Status:</strong> {status}</section>}

      <div className="mb-6 flex flex-wrap gap-3">
        <button onClick={() => setTab("quote")} className={`rounded-xl px-4 py-3 font-semibold ${tab === "quote" ? "bg-slate-900 text-white" : "bg-white border"}`}>Load Quote</button>
        <button onClick={() => setTab("completed")} className={`rounded-xl px-4 py-3 font-semibold ${tab === "completed" ? "bg-slate-900 text-white" : "bg-white border"}`}>Completed Loads / Driver Profit</button>
      </div>

      <PayPercentageSettings
        companyPercent={globalCompanyDriverPercent}
        ownerPercent={globalOwnerOperatorPercent}
        setCompanyPercent={setGlobalCompanyDriverPercent}
        setOwnerPercent={setGlobalOwnerOperatorPercent}
        applyGlobalPayPercentages={applyGlobalPayPercentages}
      />

      {tab === "quote" ? (
        <section>
          <WorkflowIntro title="Load Quote" text="Use this before booking a load. Choose company driver or owner operator so the quote uses the correct pay rules." />
          <QuoteDriverTypePanel input={quoteInput} setInput={setQuoteInput} />
          <QuoteOrLoadForm
            input={quoteInput}
            result={quoteResult}
            setInput={setQuoteInput}
            setNumber={setNumber}
            setText={setText}
            driverOptions={driverOptions}
            showDriverFields={false}
            calculateMiles={calculateMiles}
            calculateTolls={calculateTolls}
            refreshDiesel={refreshDiesel}
            updateStopCount={updateStopCount}
            updateStopAddress={updateStopAddress}
          />
        </section>
      ) : (
        <section>
          <WorkflowIntro title="Completed Loads / Driver Profit" text="Use this to enter past or completed loads by driver and date, then report by any date range." />
          <DriverManagement
            drivers={drivers}
            newDriverName={newDriverName}
            setNewDriverName={setNewDriverName}
            newDriverTruck={newDriverTruck}
            setNewDriverTruck={setNewDriverTruck}
            newDriverType={newDriverType}
            setNewDriverType={setNewDriverType}
            newDriverChargesTolls={newDriverChargesTolls}
            setNewDriverChargesTolls={setNewDriverChargesTolls}
            addDriver={addDriver}
            editingDriverId={editingDriverId}
            editDriverName={editDriverName}
            setEditDriverName={setEditDriverName}
            editDriverTruck={editDriverTruck}
            setEditDriverTruck={setEditDriverTruck}
            editDriverType={editDriverType}
            setEditDriverType={setEditDriverType}
            editDriverActive={editDriverActive}
            setEditDriverActive={setEditDriverActive}
            editDriverChargesTolls={editDriverChargesTolls}
            setEditDriverChargesTolls={setEditDriverChargesTolls}
            updateDriver={updateDriver}
            cancelEditDriver={cancelEditDriver}
            startEditDriver={startEditDriver}
          />
          <CompletedHeader input={completedInput} setInput={setCompletedInput} drivers={drivers} driverOptions={driverOptions} />
          <QuoteOrLoadForm
            input={completedInput}
            result={completedResult}
            setInput={setCompletedInput}
            setNumber={setNumber}
            setText={setText}
            driverOptions={driverOptions}
            showDriverFields={true}
            calculateMiles={calculateMiles}
            calculateTolls={calculateTolls}
            refreshDiesel={refreshDiesel}
            updateStopCount={updateStopCount}
            updateStopAddress={updateStopAddress}
          />
          <div className="mb-6">
            <button onClick={saveCompletedLoad} className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white">Save Completed Load</button>
          </div>
          <ActualCostSections
            driverOptions={driverOptions}
            repairDriverId={repairDriverId}
            setRepairDriverId={setRepairDriverId}
            repairDate={repairDate}
            setRepairDate={setRepairDate}
            repairAmount={repairAmount}
            setRepairAmount={setRepairAmount}
            repairTruck={repairTruck}
            setRepairTruck={setRepairTruck}
            repairVendor={repairVendor}
            setRepairVendor={setRepairVendor}
            repairDescription={repairDescription}
            setRepairDescription={setRepairDescription}
            saveRepair={saveRepair}
            costDriverId={costDriverId}
            setCostDriverId={setCostDriverId}
            costDate={costDate}
            setCostDate={setCostDate}
            costType={costType}
            setCostType={setCostType}
            costAmount={costAmount}
            setCostAmount={setCostAmount}
            costTruck={costTruck}
            setCostTruck={setCostTruck}
            costVendor={costVendor}
            setCostVendor={setCostVendor}
            costDescription={costDescription}
            setCostDescription={setCostDescription}
            saveActualCost={saveActualCost}
            bulkDieselText={bulkDieselText}
            setBulkDieselText={setBulkDieselText}
            parseBulkDieselText={parseBulkDieselText}
            saveBulkDiesel={saveBulkDiesel}
            bulkDieselErrors={bulkDieselErrors}
            bulkDieselPreview={bulkDieselPreview}
          />
          <ReportSection
            driverOptions={driverOptions}
            reportDriverId={reportDriverId}
            setReportDriverId={setReportDriverId}
            reportStart={reportStart}
            setReportStart={setReportStart}
            reportEnd={reportEnd}
            setReportEnd={setReportEnd}
            runReport={runReport}
            report={report}
          />
        </section>
      )}
    </main>
  );
}

function PayPercentageSettings({
  companyPercent,
  ownerPercent,
  setCompanyPercent,
  setOwnerPercent,
  applyGlobalPayPercentages,
}: {
  companyPercent: number;
  ownerPercent: number;
  setCompanyPercent: (value: number) => void;
  setOwnerPercent: (value: number) => void;
  applyGlobalPayPercentages: () => void;
}) {
  return (
    <section className="mb-6 rounded-2xl border bg-white p-5">
      <h2 className="mb-4 text-xl font-semibold">Pay Percentage Settings</h2>
      <div className="grid gap-4 md:grid-cols-4">
        <NumberField label="Default Company Driver %" value={companyPercent} step="0.01" onChange={(v: string) => setCompanyPercent(Number(v) || 0)} />
        <NumberField label="Default Owner Operator %" value={ownerPercent} step="0.01" onChange={(v: string) => setOwnerPercent(Number(v) || 0)} />
        <div className="flex items-end">
          <button onClick={applyGlobalPayPercentages} className="rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white">
            Apply Percentages
          </button>
        </div>
        <div className="flex items-end text-sm text-slate-600">
          These percentages are used to calculate driver settlement from Driver Rate.
        </div>
      </div>
    </section>
  );
}

function WorkflowIntro({ title, text }: { title: string; text: string }) {
  return (
    <section className="mb-6 rounded-2xl border bg-white p-5">
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="mt-1 text-slate-600">{text}</p>
    </section>
  );
}

function QuoteDriverTypePanel({ input, setInput }: { input: LoadInputs; setInput: React.Dispatch<React.SetStateAction<LoadInputs>> }) {
  return (
    <section className="mb-6 rounded-2xl border bg-white p-5">
      <h2 className="mb-4 text-xl font-semibold">Quote Driver Type</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <SelectField label="Driver Type" value={input.driverType} onChange={(v: string) => setInput((p) => ({ ...p, driverType: v as DriverType }))} options={[["company", "Company Driver"], ["owner", "Owner Operator"]]} />
        <ReadOnlyMetric label="Pay Rule Used" value={input.driverType === "owner" ? `${input.ownerOperatorPercent}% of Driver Rate` : `${input.companyDriverPercent}% of Driver Rate`} />
        {input.driverType === "owner" && (
          <CheckboxField label="Charge Owner-Op Tolls" checked={input.ownerOperatorChargesTolls} onChange={(checked) => setInput((p) => ({ ...p, ownerOperatorChargesTolls: checked }))} />
        )}
      </div>
      <p className="mt-3 text-sm text-slate-600">In quote mode, you only choose the driver type. No driver record is required.</p>
    </section>
  );
}

function DriverManagement(props: {
  drivers: Driver[];
  newDriverName: string;
  setNewDriverName: (v: string) => void;
  newDriverTruck: string;
  setNewDriverTruck: (v: string) => void;
  newDriverType: DriverType;
  setNewDriverType: (v: DriverType) => void;
  newDriverChargesTolls: boolean;
  setNewDriverChargesTolls: (v: boolean) => void;
  addDriver: () => void;
  editingDriverId: string;
  editDriverName: string;
  setEditDriverName: (v: string) => void;
  editDriverTruck: string;
  setEditDriverTruck: (v: string) => void;
  editDriverType: DriverType;
  setEditDriverType: (v: DriverType) => void;
  editDriverActive: boolean;
  setEditDriverActive: (v: boolean) => void;
  editDriverChargesTolls: boolean;
  setEditDriverChargesTolls: (v: boolean) => void;
  updateDriver: () => void;
  cancelEditDriver: () => void;
  startEditDriver: (driver: Driver) => void;
}) {
  return (
    <section className="mb-6 rounded-2xl border bg-white p-5">
      <h2 className="mb-4 text-xl font-semibold">Driver Management</h2>
      <div className="grid gap-4 md:grid-cols-5">
        <Field label="New Driver Name" value={props.newDriverName} onChange={props.setNewDriverName} />
        <Field label="Truck #" value={props.newDriverTruck} onChange={props.setNewDriverTruck} />
        <SelectField label="Driver Type" value={props.newDriverType} onChange={(v: string) => props.setNewDriverType(v as DriverType)} options={[["company", "Company Driver"], ["owner", "Owner Operator"]]} />
        <div className="flex items-end">
          <button onClick={props.addDriver} className="rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white">Add Driver</button>
        </div>
        <div className="flex items-end text-sm text-slate-600">{props.drivers.length} driver(s)</div>
      </div>

      {props.editingDriverId && (
        <div className="mt-5 rounded-2xl border bg-slate-50 p-4">
          <h3 className="mb-3 text-lg font-semibold">Edit Driver</h3>
          <div className="grid gap-4 md:grid-cols-5">
            <Field label="Driver Name" value={props.editDriverName} onChange={props.setEditDriverName} />
            <Field label="Truck #" value={props.editDriverTruck} onChange={props.setEditDriverTruck} />
            <SelectField label="Driver Type" value={props.editDriverType} onChange={(v: string) => props.setEditDriverType(v as DriverType)} options={[["company", "Company Driver"], ["owner", "Owner Operator"]]} />
            <CheckboxField label="Active" checked={props.editDriverActive} onChange={props.setEditDriverActive} />
            {props.editDriverType === "owner" && <CheckboxField label="Charge Owner-Op Tolls" checked={props.editDriverChargesTolls} onChange={props.setEditDriverChargesTolls} />}
            <div className="flex items-end gap-2">
              <button onClick={props.updateDriver} className="rounded-xl bg-green-700 px-4 py-3 font-semibold text-white">Save</button>
              <button onClick={props.cancelEditDriver} className="rounded-xl bg-slate-200 px-4 py-3 font-semibold">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="p-3">Driver</th>
              <th className="p-3">Truck #</th>
              <th className="p-3">Type</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {props.drivers.length === 0 ? (
              <tr><td colSpan={6} className="p-3 text-center text-slate-500">No drivers loaded.</td></tr>
            ) : (
              props.drivers.map((driver) => (
                <tr key={driver.id} className="border-t">
                  <td className="p-3 font-semibold">{driver.name}</td>
                  <td className="p-3">{driver.truck_number || "-"}</td>
                  <td className="p-3">{driver.driver_type === "owner" ? "Owner Operator" : "Company Driver"}</td>
                  <td className="p-3">{driver.is_active ? "Active" : "Inactive"}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => props.startEditDriver(driver)} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white">Edit</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CompletedHeader({ input, setInput, drivers, driverOptions }: { input: LoadInputs; setInput: React.Dispatch<React.SetStateAction<LoadInputs>>; drivers: Driver[]; driverOptions: [string, string][] }) {
  return (
    <section className="mb-6 rounded-2xl border bg-white p-5">
      <h2 className="mb-4 text-xl font-semibold">Completed Load Header</h2>
      <div className="grid gap-4 md:grid-cols-5">
        <SelectField
          label="Driver"
          value={input.driverId}
          onChange={(v: string) => {
            const selectedDriver = drivers.find((driver) => driver.id === v);
            setInput((p) => ({ ...p, driverId: v, driverType: selectedDriver?.driver_type || p.driverType, ownerOperatorChargesTolls: Boolean(selectedDriver?.owner_operator_charges_tolls) }));
          }}
          options={driverOptions}
        />
        <DateField label="Load Date" value={input.loadDate} onChange={(v: string) => setInput((p) => ({ ...p, loadDate: v }))} />
        <ReadOnlyMetric label="Driver Type" value={input.driverType === "owner" ? "Owner Operator" : "Company Driver"} />
        <Field label="Broker" value={input.broker} onChange={(v: string) => setInput((p) => ({ ...p, broker: v }))} />
        <Field label="Load #" value={input.loadNumber} onChange={(v: string) => setInput((p) => ({ ...p, loadNumber: v }))} />
      </div>
    </section>
  );
}

function QuoteOrLoadForm(props: {
  input: LoadInputs;
  result: ReturnType<typeof calculateLoad>;
  setInput: React.Dispatch<React.SetStateAction<LoadInputs>>;
  setNumber: <K extends keyof LoadInputs>(key: K, value: string) => void;
  setText: <K extends keyof LoadInputs>(key: K, value: string) => void;
  driverOptions: [string, string][];
  showDriverFields: boolean;
  calculateMiles: (kind: "origin" | "return") => void;
  calculateTolls: (kind: "origin" | "return") => void;
  refreshDiesel: (kind: "origin" | "return") => void;
  updateStopCount: (kind: "origin" | "return", stopType: "pickup" | "delivery", value: string) => void;
  updateStopAddress: (kind: "origin" | "return", stopType: "pickup" | "delivery", index: number, value: string) => void;
}) {
  const { input, result } = props;

  return (
    <>
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
          estimatedDieselCost={(result.originTotalMiles / Math.max(input.mpg, 1)) * input.dieselPrice}
          pickupCount={input.originPickupCount}
          deliveryCount={input.originDeliveryCount}
          pickupLocations={input.originPickupLocations}
          deliveryLocations={input.originDeliveryLocations}
          onPickupCount={(v: string) => props.updateStopCount("origin", "pickup", v)}
          onDeliveryCount={(v: string) => props.updateStopCount("origin", "delivery", v)}
          onPickupAddress={(index: number, v: string) => props.updateStopAddress("origin", "pickup", index, v)}
          onDeliveryAddress={(index: number, v: string) => props.updateStopAddress("origin", "delivery", index, v)}
          onCurrent={(v: string) => props.setText("originDriverLocation", v)}
          onPickup={(v: string) => props.setText("originPickupLocation", v)}
          onDelivery={(v: string) => props.setText("originDeliveryLocation", v)}
          onRc={(v: string) => props.setNumber("originActualRate", v)}
          onDriverRate={(v: string) => props.setNumber("originDriverRate", v)}
          onDeadhead={(v: string) => props.setNumber("originDeadheadMiles", v)}
          onLoaded={(v: string) => props.setNumber("originLoadedMiles", v)}
          onTolls={(v: string) => props.setNumber("originTolls", v)}
          onDiesel={(v: string) => props.setNumber("dieselPrice", v)}
          onMiles={() => props.calculateMiles("origin")}
          onTollsCalc={() => props.calculateTolls("origin")}
          onDieselRefresh={() => props.refreshDiesel("origin")}
        />

        <div>
          <label className="mb-2 block text-sm font-semibold">Return Status</label>
          <select value={input.returnStatus} onChange={(e) => props.setInput((p) => ({ ...p, returnStatus: e.target.value as ReturnStatus }))} className="mb-3 w-full rounded-xl border p-3">
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
            estimatedDieselCost={(result.returnTotalMiles / Math.max(input.returnMpg, 1)) * input.returnDieselPrice}
            pickupCount={input.returnPickupCount}
            deliveryCount={input.returnDeliveryCount}
            pickupLocations={input.returnPickupLocations}
            deliveryLocations={input.returnDeliveryLocations}
            onPickupCount={(v: string) => props.updateStopCount("return", "pickup", v)}
            onDeliveryCount={(v: string) => props.updateStopCount("return", "delivery", v)}
            onPickupAddress={(index: number, v: string) => props.updateStopAddress("return", "pickup", index, v)}
            onDeliveryAddress={(index: number, v: string) => props.updateStopAddress("return", "delivery", index, v)}
            onCurrent={(v: string) => props.setText("returnDriverLocation", v)}
            onPickup={(v: string) => props.setText("returnPickupLocation", v)}
            onDelivery={(v: string) => props.setText("returnDeliveryLocation", v)}
            onRc={(v: string) => props.setNumber("returnActualRate", v)}
            onDriverRate={(v: string) => props.setNumber("returnDriverRate", v)}
            onDeadhead={(v: string) => props.setNumber("returnDeadheadMiles", v)}
            onLoaded={(v: string) => props.setNumber("returnLoadedMiles", v)}
            onTolls={(v: string) => props.setNumber("returnTolls", v)}
            onDiesel={(v: string) => props.setNumber("returnDieselPrice", v)}
            onMiles={() => props.calculateMiles("return")}
            onTollsCalc={() => props.calculateTolls("return")}
            onDieselRefresh={() => props.refreshDiesel("return")}
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
          <ReadOnlyMetric label="Company Driver %" value={`${input.companyDriverPercent}%`} />
          <ReadOnlyMetric label="Owner Operator %" value={`${input.ownerOperatorPercent}%`} />
          <NumberField label="Dispatch Fee %" value={input.dispatchFeePercent} step="0.01" onChange={(v: string) => props.setNumber("dispatchFeePercent", v)} />
          <NumberField label="Min Profit / Mile" value={input.minNetProfitPerMile} step="0.01" onChange={(v: string) => props.setNumber("minNetProfitPerMile", v)} />
          <NumberField label="Origin MPG" value={input.mpg} step="0.1" onChange={(v: string) => props.setNumber("mpg", v)} />
          <NumberField label="Return MPG" value={input.returnMpg} step="0.1" onChange={(v: string) => props.setNumber("returnMpg", v)} />
          <NumberField label="Insurance / Week" value={input.insuranceWeekly} onChange={(v: string) => props.setNumber("insuranceWeekly", v)} />
          <NumberField label="ELD / Month" value={input.eldMonthly} onChange={(v: string) => props.setNumber("eldMonthly", v)} />
          <NumberField label="Camera / Month" value={input.cameraMonthly} onChange={(v: string) => props.setNumber("cameraMonthly", v)} />
          <NumberField label="Repair Reserve / Mile" value={input.repairPerMile} step="0.01" onChange={(v: string) => props.setNumber("repairPerMile", v)} />
          <NumberField label="Factoring %" value={input.factoringPercent} step="0.01" onChange={(v: string) => props.setNumber("factoringPercent", v)} />
          <NumberField label="Miles / Day" value={input.milesPerDay} step="1" onChange={(v: string) => props.setNumber("milesPerDay", v)} />
        </div>

        <div className="mt-4 rounded-2xl border bg-slate-50 p-4">
          <div className="mb-3 text-sm font-semibold">Apply Dispatch Fee To</div>
          <div className="grid gap-3 md:grid-cols-2">
            <CheckboxField label="Originating Load" checked={input.applyDispatchFeeOrigin} onChange={(checked) => props.setInput((p) => ({ ...p, applyDispatchFeeOrigin: checked }))} />
            <CheckboxField label="Return Load" checked={input.applyDispatchFeeReturn} onChange={(checked) => props.setInput((p) => ({ ...p, applyDispatchFeeReturn: checked }))} />
          </div>
        </div>
      </section>

      <section className="mb-6 rounded-2xl border bg-white p-5">
        <h2 className="mb-4 text-xl font-semibold">Calculation Breakdown</h2>
        <div className="overflow-hidden rounded-xl border">
          {result.breakdown.map((row) => (
            <div key={row.label} className={`grid grid-cols-2 border-b p-3 ${row.strong ? "bg-slate-100 font-bold" : ""}`}>
              <div>{row.label}</div>
              <div className="text-right">{row.value}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function ActualCostSections(props: any) {
  return (
    <section className="mb-6 grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border bg-white p-5">
        <h2 className="mb-4 text-xl font-semibold">Actual Repairs</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <SelectField label="Driver" value={props.repairDriverId} onChange={props.setRepairDriverId} options={props.driverOptions} />
          <DateField label="Repair Date" value={props.repairDate} onChange={props.setRepairDate} />
          <NumberField label="Repair Amount" value={props.repairAmount} step="0.01" onChange={(v: string) => props.setRepairAmount(Number(v) || 0)} />
          <Field label="Truck #" value={props.repairTruck} onChange={props.setRepairTruck} />
          <Field label="Vendor" value={props.repairVendor} onChange={props.setRepairVendor} />
          <Field label="Description" value={props.repairDescription} onChange={props.setRepairDescription} />
        </div>
        <button onClick={props.saveRepair} className="mt-4 rounded-xl bg-green-700 px-4 py-2 font-semibold text-white">Save Repair</button>
      </section>

      <section className="rounded-2xl border bg-white p-5">
        <h2 className="mb-4 text-xl font-semibold">Actual Diesel / Misc Costs</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <SelectField label="Driver" value={props.costDriverId} onChange={props.setCostDriverId} options={props.driverOptions} />
          <DateField label="Cost Date" value={props.costDate} onChange={props.setCostDate} />
          <SelectField label="Cost Type" value={props.costType} onChange={(v: string) => props.setCostType(v as "diesel" | "misc")} options={[["diesel", "Diesel"], ["misc", "Misc Cost"]]} />
          <NumberField label="Amount" value={props.costAmount} step="0.01" onChange={(v: string) => props.setCostAmount(Number(v) || 0)} />
          <Field label="Truck #" value={props.costTruck} onChange={props.setCostTruck} />
          <Field label="Vendor" value={props.costVendor} onChange={props.setCostVendor} />
          <Field label="Description" value={props.costDescription} onChange={props.setCostDescription} />
        </div>
        <button onClick={props.saveActualCost} className="mt-4 rounded-xl bg-green-700 px-4 py-2 font-semibold text-white">Save Actual Cost</button>
      </section>

      <section className="rounded-2xl border bg-white p-5 lg:col-span-2">
        <h2 className="mb-4 text-xl font-semibold">Bulk Diesel Entry</h2>
        <p className="mb-3 text-sm text-slate-600">Paste one diesel transaction per line: date, driver name or truck #, amount, vendor, description.</p>
        <textarea
          value={props.bulkDieselText}
          onChange={(e) => props.setBulkDieselText(e.target.value)}
          className="h-40 w-full rounded-xl border p-3 font-mono text-sm"
          placeholder={"2026-05-04, Djamel, 736.95, Fuelman, Diesel\n2026-05-07, 112, 483.34, Mudflap, Diesel"}
        />
        <div className="mt-3 flex flex-wrap gap-3">
          <button onClick={props.parseBulkDieselText} className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white">Preview Diesel Entries</button>
          <button onClick={props.saveBulkDiesel} className="rounded-xl bg-green-700 px-4 py-2 font-semibold text-white">Save Previewed Entries</button>
        </div>
        {props.bulkDieselErrors.length > 0 && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {props.bulkDieselErrors.map((error: string) => <div key={error}>{error}</div>)}
          </div>
        )}
        {props.bulkDieselPreview.length > 0 && (
          <div className="mt-4 overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="bg-slate-100 text-left">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Driver</th>
                  <th className="p-3">Truck #</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3">Vendor</th>
                  <th className="p-3">Description</th>
                </tr>
              </thead>
              <tbody>
                {props.bulkDieselPreview.map((entry: any, index: number) => (
                  <tr key={`${entry.driver_id}-${entry.cost_date}-${index}`} className="border-t">
                    <td className="p-3">{entry.cost_date}</td>
                    <td className="p-3 font-semibold">{entry.driver_name}</td>
                    <td className="p-3">{entry.truck_number || "-"}</td>
                    <td className="p-3 text-right">{currency(entry.amount)}</td>
                    <td className="p-3">{entry.vendor || "-"}</td>
                    <td className="p-3">{entry.description || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}

function ReportSection(props: any) {
  return (
    <>
      <section className="mb-6 rounded-2xl border bg-white p-5">
        <h2 className="mb-4 text-xl font-semibold">Driver Profit Report</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <SelectField label="Driver" value={props.reportDriverId} onChange={props.setReportDriverId} options={props.driverOptions} />
          <DateField label="Start Date" value={props.reportStart} onChange={props.setReportStart} />
          <DateField label="End Date" value={props.reportEnd} onChange={props.setReportEnd} />
        </div>
        <button onClick={props.runReport} className="mt-4 rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white">Run Report</button>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <Metric label="Saved Load Profit" value={currency(props.report.loadProfit)} />
          <Metric label="Estimated Diesel Added Back" value={currency(props.report.estimatedDiesel)} />
          <Metric label="Repair Reserve Added Back" value={currency(props.report.repairReserve)} />
          <Metric label="Actual Diesel" value={currency(props.report.actualDiesel)} />
          <Metric label="Actual Repairs" value={currency(props.report.actualRepairs)} />
          <Metric label="Misc Costs" value={currency(props.report.miscCosts)} />
          <Metric label="Adjusted Net" value={currency(props.report.adjustedNet)} />
        </div>
      </section>
      <ReportTables report={props.report} />
    </>
  );
}

function buildReport(loads: SavedLoad[], repairs: Repair[], costs: ActualCost[]) {
  const hasOwnerLoads = loads.some((load) => load.driver_type === "owner");
  const hasCompanyLoads = loads.some((load) => load.driver_type === "company");
  const treatAsOwnerOperator = hasOwnerLoads && !hasCompanyLoads;

  const loadProfit = loads.reduce((sum, load) => sum + Number(load.relay_profit || 0), 0);

  // For company drivers, saved load profit includes estimated diesel and repair reserve.
  // Reports add those estimates back and subtract actuals.
  // For owner-operators, diesel and repairs are their responsibility, so actual diesel/repairs do not reduce Relay profit.
  const repairReserve = treatAsOwnerOperator
    ? 0
    : loads.reduce((sum, load) => sum + Number(load.repair_reserve_amount || 0), 0);

  const estimatedDiesel = treatAsOwnerOperator
    ? 0
    : loads.reduce((sum, load) => sum + Number(load.estimated_diesel_cost || 0), 0);

  const actualRepairs = treatAsOwnerOperator
    ? 0
    : repairs.reduce((sum, repair) => sum + Number(repair.amount || 0), 0);

  const actualDiesel = treatAsOwnerOperator
    ? 0
    : costs.filter((c) => c.cost_type === "diesel").reduce((sum, cost) => sum + Number(cost.amount || 0), 0);

  const miscCosts = costs.filter((c) => c.cost_type === "misc").reduce((sum, cost) => sum + Number(cost.amount || 0), 0);
  const adjustedNet = loadProfit + repairReserve + estimatedDiesel - actualRepairs - actualDiesel - miscCosts;

  const makeBlank = () => ({
    loadProfit: 0,
    repairReserve: 0,
    estimatedDiesel: 0,
    actualRepairs: 0,
    actualDiesel: 0,
    miscCosts: 0,
    adjustedNet: 0,
    loads: 0,
  });

  const daily: Record<string, ReturnType<typeof makeBlank>> = {};
  const weekly: Record<string, ReturnType<typeof makeBlank>> = {};
  const monthly: Record<string, ReturnType<typeof makeBlank>> = {};

  for (const load of loads) {
    const date = load.load_date || "";
    if (!date) continue;
    const isOwner = load.driver_type === "owner";
    const keys = [date, weekKeySunday(date), monthKey(date)];

    [daily, weekly, monthly].forEach((group, index) => {
      const key = keys[index];
      group[key] ||= makeBlank();
      group[key].loadProfit += Number(load.relay_profit || 0);
      if (!isOwner) {
        group[key].repairReserve += Number(load.repair_reserve_amount || 0);
        group[key].estimatedDiesel += Number(load.estimated_diesel_cost || 0);
      }
      group[key].loads += 1;
    });
  }

  for (const repair of repairs) {
    if (treatAsOwnerOperator) continue;
    const keys = [repair.repair_date, weekKeySunday(repair.repair_date), monthKey(repair.repair_date)];
    [daily, weekly, monthly].forEach((group, index) => {
      const key = keys[index];
      group[key] ||= makeBlank();
      group[key].actualRepairs += Number(repair.amount || 0);
    });
  }

  for (const cost of costs) {
    const keys = [cost.cost_date, weekKeySunday(cost.cost_date), monthKey(cost.cost_date)];
    [daily, weekly, monthly].forEach((group, index) => {
      const key = keys[index];
      group[key] ||= makeBlank();

      if (cost.cost_type === "diesel") {
        if (!treatAsOwnerOperator) group[key].actualDiesel += Number(cost.amount || 0);
      } else {
        group[key].miscCosts += Number(cost.amount || 0);
      }
    });
  }

  [daily, weekly, monthly].forEach((group) => {
    Object.values(group).forEach((row) => {
      row.adjustedNet = row.loadProfit + row.repairReserve + row.estimatedDiesel - row.actualRepairs - row.actualDiesel - row.miscCosts;
    });
  });

  return { loadProfit, repairReserve, estimatedDiesel, actualRepairs, actualDiesel, miscCosts, adjustedNet, daily, weekly, monthly };
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

function SummaryTable({ title, data }: { title: string; data: Record<string, { loadProfit: number; repairReserve: number; estimatedDiesel: number; actualRepairs: number; actualDiesel: number; miscCosts: number; adjustedNet: number; loads: number }> }) {
  const rows = Object.entries(data).sort(([a], [b]) => a.localeCompare(b));
  return (
    <section className="rounded-2xl border bg-white p-5">
      <h2 className="mb-4 text-xl font-semibold">{title}</h2>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[620px] text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="p-3">Period</th>
              <th className="p-3 text-right">Loads</th>
              <th className="p-3 text-right">Load Profit</th>
              <th className="p-3 text-right">Diesel</th>
              <th className="p-3 text-right">Repairs</th>
              <th className="p-3 text-right">Misc</th>
              <th className="p-3 text-right">Adjusted Net</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="p-3 text-center text-slate-500">No data</td></tr>
            ) : (
              rows.map(([key, row]) => (
                <tr key={key} className="border-t">
                  <td className="p-3">{key}</td>
                  <td className="p-3 text-right">{row.loads}</td>
                  <td className="p-3 text-right">{currency(row.loadProfit)}</td>
                  <td className="p-3 text-right">{currency(row.actualDiesel)}</td>
                  <td className="p-3 text-right">{currency(row.actualRepairs)}</td>
                  <td className="p-3 text-right">{currency(row.miscCosts)}</td>
                  <td className="p-3 text-right font-semibold">{currency(row.adjustedNet)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function LoadCard(props: any) {
  return (
    <div className="rounded-2xl border bg-white p-6">
      <h2 className="mb-6 text-2xl font-semibold">{props.title}</h2>
      <div className="grid gap-5">
        <Field label="Current Location / ZIP" value={props.current} onChange={props.onCurrent} />

        <div className="grid gap-5 md:grid-cols-2">
          <NumberField label="# of Pickup Locations" value={props.pickupCount || 1} onChange={props.onPickupCount} />
          <NumberField label="# of Delivery Locations" value={props.deliveryCount || 1} onChange={props.onDeliveryCount} />
        </div>

        <div className="grid gap-4">
          {(props.pickupLocations || [""]).map((value: string, index: number) => (
            <Field key={`pickup-${index}`} label={`Pickup Location ${index + 1} / ZIP`} value={value} onChange={(v: string) => props.onPickupAddress(index, v)} />
          ))}
        </div>

        <div className="grid gap-4">
          {(props.deliveryLocations || [""]).map((value: string, index: number) => (
            <Field key={`delivery-${index}`} label={`Delivery Location ${index + 1} / ZIP`} value={value} onChange={(v: string) => props.onDeliveryAddress(index, v)} />
          ))}
        </div>
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
      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <CurrencyField label="Tolls" value={props.tolls} onChange={props.onTolls} />
        <CurrencyField label="Diesel Price" value={props.diesel} onChange={props.onDiesel} />
        <ReadOnlyMetric label="Est. Diesel Cost" value={currency(Number(props.estimatedDieselCost || 0))} />
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
  const displayValue = Number.isFinite(value) && value !== 0 ? String(value) : "";

  return (
    <label className="block">
      <span className="mb-2 flex min-h-[1.25rem] items-end text-sm font-semibold leading-tight">{label}</span>
      <input
        type="number"
        step="0.01"
        min="0"
        placeholder="0.00"
        value={displayValue}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => e.currentTarget.select()}
        onBlur={(e) => {
          const nextValue = Number(e.target.value);
          onChange(nextValue ? nextValue.toFixed(2) : "0");
        }}
        className="w-full rounded-xl border p-3"
      />
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
