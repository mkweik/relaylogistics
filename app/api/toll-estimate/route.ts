import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  from?: string;
  to?: string;
};

type HerePosition = {
  lat: number;
  lng: number;
};

type HereApiError = {
  title?: string;
  cause?: string;
  action?: string;
  error?: string;
  error_description?: string;
  status?: number;
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
  tollSystem?: string;
  countryCode?: string;
  fares?: HereFare[];
};

type HereSection = {
  tolls?: HereToll[];
  notices?: Array<{
    title?: string;
    code?: string;
    severity?: string;
  }>;
};

type HereRoute = {
  sections?: HereSection[];
};

type HereRouteResponse = {
  routes?: HereRoute[];
} & HereApiError;

type HereGeocodeResponse = {
  items?: Array<{
    position?: HerePosition;
  }>;
} & HereApiError;

function errorMessage(data: HereApiError, fallback: string) {
  return data.error_description || data.title || data.cause || data.action || data.error || fallback;
}

async function fetchHereJson<T>(url: URL, label: string): Promise<{ response: Response; data: T }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url.toString(), {
      cache: "no-store",
      signal: controller.signal,
    });

    const text = await response.text();
    const data = (text ? JSON.parse(text) : {}) as T;

    return { response, data };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`${label} timed out after 10 seconds.`);
    }

    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function geocode(address: string, apiKey: string): Promise<HerePosition> {
  const url = new URL("https://geocode.search.hereapi.com/v1/geocode");
  url.searchParams.set("q", address);
  url.searchParams.set("apiKey", apiKey);
  url.searchParams.set("limit", "1");

  const { response, data } = await fetchHereJson<HereGeocodeResponse>(url, "HERE geocode");

  if (!response.ok) {
    throw new Error(errorMessage(data, "HERE geocode failed."));
  }

  const position = data.items?.[0]?.position;

  if (!position || typeof position.lat !== "number" || typeof position.lng !== "number") {
    throw new Error(`HERE could not geocode this address/ZIP: ${address}`);
  }

  return position;
}

function totalTolls(data: HereRouteResponse) {
  const seen = new Set<string>();
  let total = 0;
  let count = 0;
  let currency = "USD";
  const notices: string[] = [];

  for (const route of data.routes || []) {
    for (const section of route.sections || []) {
      for (const notice of section.notices || []) {
        const value = notice.code || notice.title || notice.severity;
        if (value) notices.push(value);
      }

      for (const toll of section.tolls || []) {
        for (const fare of toll.fares || []) {
          const value = Number(fare.price?.value || 0);
          if (!value) continue;

          currency = fare.price?.currency || currency;

          const id = fare.id || `${toll.tollSystem || "toll"}-${fare.name || "fare"}-${value}-${count}`;
          if (seen.has(id)) continue;

          seen.add(id);
          total += value;
          count += 1;
        }
      }
    }
  }

  return {
    tolls: Number(total.toFixed(2)),
    fareCount: count,
    currency,
    notices: Array.from(new Set(notices)),
  };
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.HERE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing HERE_API_KEY in Vercel environment variables.", tolls: 0 },
        { status: 400 }
      );
    }

    const body = (await request.json()) as Body;
    const from = body.from?.trim();
    const to = body.to?.trim();

    if (!from || !to) {
      return NextResponse.json(
        { error: "Missing pickup and delivery address/ZIP.", tolls: 0 },
        { status: 400 }
      );
    }

    const [origin, destination] = await Promise.all([
      geocode(from, apiKey),
      geocode(to, apiKey),
    ]);

    const url = new URL("https://router.hereapi.com/v8/routes");
    url.searchParams.set("apiKey", apiKey);
    url.searchParams.set("transportMode", "truck");
    url.searchParams.set("origin", `${origin.lat},${origin.lng}`);
    url.searchParams.set("destination", `${destination.lat},${destination.lng}`);
    url.searchParams.set("return", "summary,tolls");
    url.searchParams.set("routingMode", "fast");
    url.searchParams.set("currency", "USD");

    // Keep the profile simple. HERE can reject some detailed truck dimensions by account/product.
    // Axle count is the main toll-class signal we need first for a 5-axle tractor-trailer.
    url.searchParams.set("vehicle[axleCount]", "5");

    const { response, data } = await fetchHereJson<HereRouteResponse>(url, "HERE toll route");

    if (!response.ok) {
      return NextResponse.json(
        {
          error: errorMessage(data, "HERE toll route failed."),
          tolls: 0,
          source: "HERE",
        },
        { status: response.status }
      );
    }

    const result = totalTolls(data);

    return NextResponse.json({
      tolls: result.tolls,
      source: "HERE",
      currency: result.currency,
      fareCount: result.fareCount,
      notices: result.notices,
      message:
        result.fareCount > 0
          ? `HERE returned ${result.fareCount} toll fare(s).`
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
