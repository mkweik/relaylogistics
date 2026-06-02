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

  const dispatchFee =
    (input.applyDispatchFeeOrigin ? input.originActualRate * (input.dispatchFeePercent / 100) : 0) +
    (hasReturn && input.applyDispatchFeeReturn ? input.returnActualRate * (input.dispatchFeePercent / 100) : 0);

  const estimatedDieselCost =
    (originTotalMiles / Math.max(input.mpg, 1)) * input.dieselPrice +
    (hasReturn ? (returnTotalMiles / Math.max(input.returnMpg, 1)) * input.returnDieselPrice : 0);

  const tolls = input.originTolls + returnTolls;
  const tripDays = 3 + (hasReturn ? 1 : 0);
  const insurance = (input.insuranceWeekly / 7) * tripDays;
  const eld = ((input.eldMonthly / 4.33) / 7) * tripDays;
  const camera = ((input.cameraMonthly / 4.33) / 7) * tripDays;
  const repairReserveAmount = totalMiles * input.repairPerMile;
  const factoring = totalRevenue * (input.factoringPercent / 100);
  const grossRevenuePerMile = totalMiles ? totalRevenue / totalMiles : 0;

  let relayProfit = 0;
  let driverSettlement = 0;
  const rows: CalculationResult["breakdown"] = [];

  rows.push({ label: "Total Revenue", value: money(totalRevenue) });
  rows.push({ label: "Total Miles", value: `${totalMiles.toFixed(1)} mi` });
  rows.push({ label: "Gross Revenue Per Mile", value: rpm(grossRevenuePerMile) });

  if (dispatchFee > 0) {
    rows.push({ label: `Dispatch Fee (${input.dispatchFeePercent.toFixed(2)}% of selected RC)`, value: `-${money(dispatchFee)}` });
  }

  if (input.driverType === "company") {
    const driverPay = totalDriverFacingRate * (input.companyDriverPercent / 100);
    relayProfit = totalRevenue - driverPay - estimatedDieselCost - tolls - insurance - eld - camera - repairReserveAmount - factoring - dispatchFee;
    driverSettlement = driverPay;

    rows.push({ label: `Company Driver Pay (${input.companyDriverPercent.toFixed(2)}%)`, value: `-${money(driverPay)}` });
    rows.push({ label: "Estimated Diesel", value: `-${money(estimatedDieselCost)}` });
    rows.push({ label: "Tolls", value: `-${money(tolls)}` });
    rows.push({ label: "Insurance", value: `-${money(insurance)}` });
    rows.push({ label: "ELD", value: `-${money(eld)}` });
    rows.push({ label: "Camera", value: `-${money(camera)}` });
    rows.push({ label: "Repair Reserve", value: `-${money(repairReserveAmount)}` });
    rows.push({ label: "Factoring", value: `-${money(factoring)}` });
  } else {
    const ownerGross = totalDriverFacingRate * (input.ownerOperatorPercent / 100);
    const brokerSpread = totalRevenue - totalDriverFacingRate;
    const relayFeeFromDriverRate = totalDriverFacingRate - ownerGross;

    const tollChargeback = input.ownerOperatorChargesTolls ? tolls : 0;
    const absorbedTolls = input.ownerOperatorChargesTolls ? 0 : tolls;

    // Owner-operator rules:
    // - Owner-op pays diesel, camera, insurance, and repairs.
    // - Owner-op toll chargebacks are pass-through only: not profit.
    // - Relay covers ELD, dispatch fee, factoring, and absorbed tolls.
    // - Broker spread (RC Rate - Driver Rate) remains Relay margin.
    const ownerPassThroughDeductions = camera + insurance + tollChargeback;
    const relayCosts = absorbedTolls + eld + factoring + dispatchFee;

    relayProfit = totalRevenue - ownerGross - relayCosts;
    driverSettlement = ownerGross - ownerPassThroughDeductions;

    rows.push({ label: "Broker Spread (RC Rate - Driver Rate)", value: money(brokerSpread) });
    rows.push({ label: `Relay Fee from Driver Rate (${(100 - input.ownerOperatorPercent).toFixed(2)}%)`, value: money(relayFeeFromDriverRate) });
    rows.push({ label: `Owner-Op Gross (${input.ownerOperatorPercent.toFixed(2)}%)`, value: money(ownerGross) });
    rows.push({ label: "Owner-Op Pays Diesel", value: money(estimatedDieselCost) });
    rows.push({ label: "Owner-Op Pays Camera", value: money(camera) });
    rows.push({ label: "Owner-Op Pays Insurance", value: money(insurance) });
    rows.push({ label: "Owner-Op Responsible for Repairs", value: money(repairReserveAmount) });
    if (tollChargeback > 0) rows.push({ label: "Tolls Charged to Owner-Op (Pass-Through)", value: money(tollChargeback) });
    if (absorbedTolls > 0) rows.push({ label: "Tolls Absorbed by Relay", value: `-${money(absorbedTolls)}` });
    rows.push({ label: "ELD Paid by Relay", value: `-${money(eld)}` });
    rows.push({ label: "Dispatch Fee Paid by Relay", value: `-${money(dispatchFee)}` });
    rows.push({ label: "Factoring Paid by Relay", value: `-${money(factoring)}` });
    rows.push({ label: "Owner-Op Net Settlement", value: money(driverSettlement) });
  }

  const netProfitPerMile = totalMiles ? relayProfit / totalMiles : 0;
  const decision =
    relayProfit <= 0 || netProfitPerMile < 0.15
      ? "REJECT"
      : netProfitPerMile < 0.30
        ? "WEAK"
        : netProfitPerMile < 0.45
          ? "NEGOTIATE"
          : netProfitPerMile < input.minNetProfitPerMile
            ? "ACCEPTABLE"
            : "BOOK";

  rows.push({ label: "Relay Net Profit", value: money(relayProfit), strong: true });
  rows.push({ label: "Net Profit Per Mile", value: rpm(netProfitPerMile), strong: true });
  rows.push({ label: "Decision", value: decision, strong: true });

  return {
    totalRevenue,
    totalDriverFacingRate,
    originTotalMiles,
    returnTotalMiles,
    totalMiles,
    dispatchFee,
    estimatedDieselCost,
    repairReserveAmount,
    grossRevenuePerMile,
    relayProfit,
    netProfitPerMile,
    driverSettlement,
    decision,
    breakdown: rows,
  };
}
