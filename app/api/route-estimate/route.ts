import { NextResponse } from "next/server";

type Body = { from: string; to: string };

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

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const body = (await request.json()) as Body;

    if (!apiKey) return NextResponse.json({ error: "Missing GOOGLE_MAPS_API_KEY." }, { status: 400 });
    if (!body.from || !body.to) return NextResponse.json({ error: "Missing from/to address or ZIP." }, { status: 400 });

    const miles = await getMiles(body.from, body.to, apiKey);
    return NextResponse.json({ miles: Number(miles.toFixed(1)) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not calculate miles." }, { status: 500 });
  }
}
