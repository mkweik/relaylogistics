import { NextResponse } from "next/server";

type Body = {
  origin: string;
  pickup: string;
  stops?: string[];
  destination: string;
};

export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const body = (await request.json()) as Body;

  if (!apiKey) {
    return NextResponse.json({ error: "Missing GOOGLE_MAPS_API_KEY in Vercel environment variables." }, { status: 400 });
  }

  const waypoints = [body.pickup, ...(body.stops || []), body.destination].filter(Boolean);

  try {
    const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
      },
      body: JSON.stringify({
        origin: { address: body.origin },
        destination: { address: body.destination },
        intermediates: waypoints.slice(0, -1).map((address) => ({ address })),
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
      }),
    });

    const data = await response.json();
    const meters = data?.routes?.[0]?.distanceMeters ?? 0;
    const miles = meters / 1609.344;

    return NextResponse.json({ totalMiles: Number(miles.toFixed(1)), raw: data });
  } catch {
    return NextResponse.json({ error: "Could not calculate route miles." }, { status: 500 });
  }
}
