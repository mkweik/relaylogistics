export type DriverType = "company" | "owner";
export type ReturnStatus = "none" | "estimated" | "confirmed";

export type LoadInputs = {
  driverType: DriverType;
  broker: string;
  loadNumber: string;
  originActualRate: number;
  originDriverRate: number;
  originLoadedMiles: number;
  originDeadheadMiles: number;
  originTolls: number;
  returnStatus: ReturnStatus;
  returnActualRate: number;
  returnDriverRate: number;
  returnLoadedMiles: number;
  returnDeadheadMiles: number;
  returnTolls: number;
  dieselPrice: number;
  returnDieselPrice: number;
  mpg: number;
  returnMpg: number;
  insuranceWeekly: number;
  eldMonthly: number;
  cameraMonthly: number;
  repairPerMile: number;
  factoringPercent: number;
  minProfit: number;
  minNetProfitPerMile: number;
};

export type CalculationResult = {
  totalRevenue: number;
  totalDriverFacingRate: number;
  totalMiles: number;
  grossRevenuePerMile: number;
  relayProfit: number;
  netProfitPerMile: number;
  driverSettlement: number;
  decision: "BOOK" | "NEGOTIATE" | "REJECT";
  breakdown: { label: string; value: string; strong?: boolean }[];
};
