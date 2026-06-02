export type DriverType = "company" | "owner";
export type ReturnStatus = "none" | "estimated" | "confirmed";

export type LoadInputs = {
  driverType: DriverType;
  driverId: string;
  loadDate: string;
  broker: string;
  loadNumber: string;

  originDriverLocation: string;
  originPickupLocation: string;
  originDeliveryLocation: string;

  returnDriverLocation: string;
  returnPickupLocation: string;
  returnDeliveryLocation: string;

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

  companyDriverPercent: number;
  ownerOperatorPercent: number;

  dispatchFeePercent: number;
  applyDispatchFeeOrigin: boolean;
  applyDispatchFeeReturn: boolean;

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
  originTotalMiles: number;
  returnTotalMiles: number;
  totalMiles: number;
  dispatchFee: number;
  estimatedDieselCost: number;
  repairReserveAmount: number;
  grossRevenuePerMile: number;
  relayProfit: number;
  netProfitPerMile: number;
  driverSettlement: number;
  decision: "BOOK" | "ACCEPTABLE" | "NEGOTIATE" | "WEAK" | "REJECT";
  breakdown: { label: string; value: string; strong?: boolean }[];
};
