import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 20;

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

function timeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out.`)), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

async function fetchJsonWithTimeout(url: string, label: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
    });

    const text = await response.text();
    let data: any = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    return { response, data };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`${label} timed out.`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function geocodeAddress(address: string, apiKey: string): Promise<HerePosition> {
  const url = new URL("https://geocode.search.hereapi.com/v1/geocode");
  url.searchParams.set("q", address);
  url.searchParams.set("apiKey", apiKey);
  url.searchParams.set("limit", "1");

  const { response, data } = await fetchJsonWithTimeout(url.toString(), "HERE geocode");

  if (!response.ok) {
    throw new Error(data?.error_description || data?.title || data?.cause || "HERE geocode request failed.");
  }

  const position = data?.items?.[0]?.position;

  if (!position?.lat || !position?.lng) {
    throw new Error(`Could not geocode: ${address}`);
  }

  return { lat: position.lat, lng: position.lng };
}

function collectTollFares(data: any): { total: number; currency: string; fareCount: number } {
  const seenFareIds = new Set<string>();
  let total = 0;
  let currency = "USD";
  let fareCount = 0;

  const routes = data?.routes || [];

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

async function calculateHereTolls(from: string, to: string, apiKey: string) {
  const [origin, destination] = await Promise.all([
    geocodeAddress(from, apiKey),
    geocodeAddress(to, apiKey),
  ]);

  const url = new URL("https://router.hereapi.com/v8/routes");
  url.searchParams.set("transportMode", "truck");
  url.searchParams.set("origin", `${origin.lat},${origin.lng}`);
  url.searchParams.set("destination", `${destination.lat},${destination.lng}`);
  url.searchParams.set("return", "summary,tolls");
  url.searchParams.set("routingMode", "fast");
  url.searchParams.set("currency", "USD");
  url.searchParams.set("units", "imperial");

  // Keep this simple first. Some HERE accounts reject detailed truck parameters
  // unless the exact parameter format/product entitlement is enabled.
  url.searchParams.set("vehicle[axleCount]", "5");
  url.searchParams.set("apiKey", apiKey);

  const { response, data } = await fetchJsonWithTimeout(url.toString(), "HERE route/toll");

  if (!response.ok) {
    throw new Error(data?.error_description || data?.title || data?.cause || "HERE toll route request failed.");
  }

  const tollResult = collectTollFares(data);

  return {
    tolls: tollResult.total,
    currency: tollResult.currency,
    fareCount: tollResult.fareCount,
    source: "HERE",
    message:
      tollResult.fareCount > 0
        ? `HERE toll estimate returned ${tollResult.fareCount} toll fare(s).`
        : "HERE returned no priced toll fares for this route. Enter tolls manually if needed.",
  };
}

export async function POST(request: Request) {
  try {
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

    const result = await timeout(calculateHereTolls(body.from, body.to, apiKey), 15000, "HERE toll estimate");

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not calculate HERE tolls.";

    return NextResponse.json(
      {
        error: message,
        tolls: 0,
        source: "HERE",
      },
      { status: 500 }
    );
  }
}
