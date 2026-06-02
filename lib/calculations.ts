import { CalculationResult, LoadInputs } from "@/types/load";

function money(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function rpm(value: number) {
  return `$${value.toFixed(2)}/mi`;
}

export function calculateLoad(input: LoadInputs): CalculationResult {
  const hasReturn = input.returnStatus !== "none";

  const originTotalMiles = input.originLoadedMiles + input.originDeadheadMiles;
  const returnTotalMiles = hasReturn ? input.returnLoadedMiles + input.returnDeadheadMiles : 0;
  const totalMiles = originTotalMiles + returnTotalMiles;

  const returnRevenue = hasReturn ? input.returnActualRate : 0;
  const returnDriverRate = hasReturn ? input.returnDriverRate : 0;
  const returnTolls = hasReturn ? input.returnTolls : 0;

  const totalRevenue = input.originActualRate + returnRevenue;
  const totalDriverFacingRate = input.originDriverRate + returnDriverRate;

  const outboundFuel = (originTotalMiles / Math.max(input.mpg, 1)) * input.dieselPrice;
  const returnFuel = hasReturn ? (returnTotalMiles / Math.max(input.returnMpg, 1)) * input.returnDieselPrice : 0;
  const fuel = outboundFuel + returnFuel;

  const tolls = input.originTolls + returnTolls;
  const tripDays = 3 + (hasReturn ? 1 : 0);
  const insurance = (input.insuranceWeekly / 7) * tripDays;
  const eld = ((input.eldMonthly / 4.33) / 7) * tripDays;
  const camera = ((input.cameraMonthly / 4.33) / 7) * tripDays;
  const repair = totalMiles * input.repairPerMile;
  const factoring = totalRevenue * (input.factoringPercent / 100);

  const grossRevenuePerMile = totalMiles ? totalRevenue / totalMiles : 0;

  let relayProfit = 0;
  let driverSettlement = 0;
  const rows: CalculationResult["breakdown"] = [];

  rows.push({ label: "Driver Type", value: input.driverType === "company" ? "Company Driver" : "Owner Operator" });
  rows.push({ label: "Origin Total Miles", value: `${originTotalMiles.toFixed(1)} mi` });
  rows.push({ label: "Return Total Miles", value: `${returnTotalMiles.toFixed(1)} mi` });
  rows.push({ label: "Total Miles", value: `${totalMiles.toFixed(1)} mi` });
  rows.push({ label: "Total Revenue", value: money(totalRevenue) });
  rows.push({ label: "Total Driver-Facing Rate", value: money(totalDriverFacingRate) });
  rows.push({ label: "Gross Revenue Per Mile", value: rpm(grossRevenuePerMile) });

  if (input.driverType === "company") {
    const driverPay = totalDriverFacingRate * 0.35;
    const directCosts = fuel + tolls + insurance + eld + camera + repair + factoring;

    relayProfit = totalRevenue - driverPay - directCosts;
    driverSettlement = driverPay;

    rows.push({ label: "Company Driver Pay, 35%", value: `-${money(driverPay)}` });
    rows.push({ label: "Diesel Cost", value: `-${money(fuel)}` });
    rows.push({ label: "Tolls", value: `-${money(tolls)}` });
    rows.push({ label: "Insurance Allocation", value: `-${money(insurance)}` });
    rows.push({ label: "ELD Allocation", value: `-${money(eld)}` });
    rows.push({ label: "Camera Allocation", value: `-${money(camera)}` });
    rows.push({ label: "Repair Reserve", value: `-${money(repair)}` });
    rows.push({ label: "Factoring", value: `-${money(factoring)}` });
  } else {
    const relayFee = totalDriverFacingRate * 0.15;
    const ownerGross = totalDriverFacingRate * 0.85;

    // Owner-op always pays diesel.
    // Current defaults: camera charged back, tolls/ELD/repair/factoring tracked as Relay absorbed.
    const chargebacks = camera;
    const absorbed = tolls + eld + repair + factoring;

    relayProfit = relayFee + chargebacks - absorbed;
    driverSettlement = ownerGross - chargebacks;

    rows.push({ label: "Relay Gross Fee, 15%", value: money(relayFee) });
    rows.push({ label: "Owner-Op Gross, 85%", value: money(ownerGross) });
    rows.push({ label: "Diesel Paid by Owner-Op", value: money(fuel) });
    rows.push({ label: "Camera Charged Back", value: `+${money(camera)}` });
    rows.push({ label: "Tolls Absorbed by Relay", value: `-${money(tolls)}` });
    rows.push({ label: "ELD Absorbed by Relay", value: `-${money(eld)}` });
    rows.push({ label: "Repair Reserve Tracked", value: `-${money(repair)}` });
    rows.push({ label: "Factoring Absorbed by Relay", value: `-${money(factoring)}` });
    rows.push({ label: "Owner-Op Net Settlement", value: money(driverSettlement) });
  }

  const netProfitPerMile = totalMiles ? relayProfit / totalMiles : 0;

  const decision =
    relayProfit <= 0 || netProfitPerMile <= 0
      ? "REJECT"
      : relayProfit >= input.minProfit && netProfitPerMile >= input.minNetProfitPerMile
        ? "BOOK"
        : "NEGOTIATE";

  rows.push({ label: "Relay Net Profit", value: money(relayProfit), strong: true });
  rows.push({ label: "Net Profit Per Mile", value: rpm(netProfitPerMile), strong: true });
  rows.push({ label: "Decision", value: decision, strong: true });

  return {
    totalRevenue,
    totalDriverFacingRate,
    originTotalMiles,
    returnTotalMiles,
    totalMiles,
    grossRevenuePerMile,
    relayProfit,
    netProfitPerMile,
    driverSettlement,
    decision,
    breakdown: rows,
  };
}
