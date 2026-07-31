import { NextResponse } from "next/server";

type Body = {
  from?: string;
  to?: string;
  stops?: string[];
};

async function getMiles(from: string, to: string, apiKey: string) {
  const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
    },
    body: JSON.stringify({
      origin: { address: from },
      destination: { address: to },
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE",
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || "Google Routes API error.");

  return (data?.routes?.[0]?.distanceMeters || 0) / 1609.344;
}

async function getOrderedLegMiles(stops: string[], apiKey: string) {
  const cleanStops = stops.map((stop) => stop.trim()).filter(Boolean);

  if (cleanStops.length < 2) {
    throw new Error("At least two ordered stops are required.");
  }

  let totalMiles = 0;
  const legs: { from: string; to: string; miles: number }[] = [];

  for (let i = 0; i < cleanStops.length - 1; i++) {
    const from = cleanStops[i];
    const to = cleanStops[i + 1];
    const miles = await getMiles(from, to, apiKey);
    const roundedMiles = Number(miles.toFixed(1));
    totalMiles += miles;
    legs.push({ from, to, miles: roundedMiles });
  }

  return {
    miles: Number(totalMiles.toFixed(1)),
    stopCount: cleanStops.length,
    legCount: legs.length,
    legs,
  };
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const body = (await request.json()) as Body;

    if (!apiKey) return NextResponse.json({ error: "Missing GOOGLE_MAPS_API_KEY." }, { status: 400 });

    if (Array.isArray(body.stops) && body.stops.length >= 2) {
      const result = await getOrderedLegMiles(body.stops, apiKey);
      return NextResponse.json({
        miles: result.miles,
        mode: "ordered-leg-sum",
        stopCount: result.stopCount,
        legCount: result.legCount,
        legs: result.legs,
      });
    }

    if (!body.from || !body.to) return NextResponse.json({ error: "Missing from/to address or ZIP." }, { status: 400 });

    const miles = await getMiles(body.from, body.to, apiKey);
    return NextResponse.json({ miles: Number(miles.toFixed(1)), mode: "point-to-point" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not calculate miles." }, { status: 500 });
  }
}
