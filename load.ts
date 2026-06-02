import { NextResponse } from "next/server";

const SERIES_BY_REGION: Record<string, string> = {
  national: "PET.EMD_EPD2D_PTE_NUS_DPG.W",
  midwest: "PET.EMD_EPD2D_PTE_R20_DPG.W",
  east_coast: "PET.EMD_EPD2D_PTE_R10_DPG.W",
  new_england: "PET.EMD_EPD2D_PTE_R1X_DPG.W",
  central_atlantic: "PET.EMD_EPD2D_PTE_R1Y_DPG.W",
  lower_atlantic: "PET.EMD_EPD2D_PTE_R1Z_DPG.W"
};

export async function GET(request: Request) {
  const apiKey = process.env.EIA_API_KEY;
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region") || "national";
  const series = SERIES_BY_REGION[region] || SERIES_BY_REGION.national;
  if (!apiKey) return NextResponse.json({ error: "Missing EIA_API_KEY in Vercel environment variables.", fallbackPrice: 5.35 }, { status: 400 });
  try {
    const response = await fetch(`https://api.eia.gov/v2/seriesid/${series}?api_key=${apiKey}`, { next: { revalidate: 3600 } });
    const data = await response.json();
    const latest = data?.response?.data?.[0];
    return NextResponse.json({ region, price: Number(latest?.value ?? 5.35), period: latest?.period, source: "EIA" });
  } catch {
    return NextResponse.json({ error: "Could not fetch EIA diesel price.", fallbackPrice: 5.35 }, { status: 500 });
  }
}
