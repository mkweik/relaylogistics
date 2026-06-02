import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Body = {
  from: string;
  to: string;
};

type HerePosition = {
  lat: number;
  lng: number;
};

type HereFare = {
  id?: string;
  name?: string;
  price?: {
    type?: string;
    currency?: string;
    value?: number;
  };
};

type HereToll = {
  countryCode?: string;
  tollSystem?: string;
  fares?: HereFare[];
};

async function geocodeAddress(address: string, apiKey: string): Promise<HerePosition> {
  const url = new URL("https://geocode.search.hereapi.com/v1/geocode");
  url.searchParams.set("q", address);
  url.searchParams.set("apiKey", apiKey);
  url.searchParams.set("limit", "1");

  const response = await fetch(url.toString(), { cache: "no-store" });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error_description || data?.title || "HERE geocode request failed.");
  }

  const position = data?.items?.[0]?.position;

  if (!position?.lat || !position?.lng) {
    throw new Error(`Could not geocode: ${address}`);
  }

  return { lat: position.lat, lng: position.lng };
}

function collectTollFares(data: unknown): { total: number; currency: string; fareCount: number } {
  const seenFareIds = new Set<string>();
  let total = 0;
  let currency = "USD";
  let fareCount = 0;

  const routes = (data as any)?.routes || [];

  for (const route of routes) {
    for (const section of route.sections || []) {
      for (const toll of (section.tolls || []) as HereToll[]) {
        for (const fare of toll.fares || []) {
          const value = Number(fare.price?.value || 0);
          const fareCurrency = fare.price?.currency || currency;

          if (!value) continue;

          const key = fare.id || `${fare.name || "fare"}-${fareCurrency}-${value}-${fareCount}`;
          if (seenFareIds.has(key)) continue;

          seenFareIds.add(key);
          total += value;
          currency = fareCurrency;
          fareCount += 1;
        }
      }
    }
  }

  return {
    total: Number(total.toFixed(2)),
    currency,
    fareCount,
  };
}

export async function POST(request: Request) {
  const apiKey = process.env.HERE_API_KEY;
  const body = (await request.json()) as Body;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing HERE_API_KEY in Vercel environment variables.", tolls: 0 },
      { status: 400 }
    );
  }

  if (!body.from || !body.to) {
    return NextResponse.json({ error: "Missing from/to address or ZIP.", tolls: 0 }, { status: 400 });
  }

  try {
    const [origin, destination] = await Promise.all([
      geocodeAddress(body.from, apiKey),
      geocodeAddress(body.to, apiKey),
    ]);

    const url = new URL("https://router.hereapi.com/v8/routes");
    url.searchParams.set("transportMode", "truck");
    url.searchParams.set("origin", `${origin.lat},${origin.lng}`);
    url.searchParams.set("destination", `${destination.lat},${destination.lng}`);
    url.searchParams.set("return", "summary,tolls");
    url.searchParams.set("routingMode", "fast");
    url.searchParams.set("currency", "USD");
    url.searchParams.set("departureTime", "any");
    url.searchParams.set("units", "imperial");

    // Default truck profile: typical 5-axle tractor + 53' dry van setup.
    // Weight is in kilograms. 80,000 lb = about 36,287 kg.
    url.searchParams.set("vehicle[axleCount]", "5");
    url.searchParams.set("vehicle[grossWeight]", "36287");
    url.searchParams.set("vehicle[height]", "411"); // cm, about 13'6"
    url.searchParams.set("vehicle[width]", "259");  // cm, about 102"
    url.searchParams.set("vehicle[length]", "2290"); // cm, about 75'
    url.searchParams.set("apiKey", apiKey);

    const response = await fetch(url.toString(), { cache: "no-store" });
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: data?.error_description || data?.title || data?.cause || "HERE toll route request failed.",
          tolls: 0,
          source: "HERE",
        },
        { status: response.status }
      );
    }

    const tollResult = collectTollFares(data);

    const notices = (data?.routes || [])
      .flatMap((route: any) => route.sections || [])
      .flatMap((section: any) => section.notices || [])
      .map((notice: any) => notice.code || notice.title || notice.severity)
      .filter(Boolean);

    return NextResponse.json({
      tolls: tollResult.total,
      currency: tollResult.currency,
      fareCount: tollResult.fareCount,
      source: "HERE",
      notices,
      message:
        tollResult.fareCount > 0
          ? `HERE toll estimate returned ${tollResult.fareCount} toll fare(s).`
          : "HERE returned no priced toll fares for this route. Enter tolls manually if needed.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not calculate HERE tolls.",
        tolls: 0,
        source: "HERE",
      },
      { status: 500 }
    );
  }
}
