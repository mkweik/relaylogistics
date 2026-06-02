import { NextResponse } from "next/server";

type Body = { origin: string; destination: string; waypoints?: string[]; vehicleType?: string; };

export async function POST(request: Request) {
  const apiKey = process.env.TOLLGURU_API_KEY;
  const body = (await request.json()) as Body;
  if (!apiKey) return NextResponse.json({ error: "Missing TOLLGURU_API_KEY in Vercel environment variables.", fallbackTolls: 0 }, { status: 400 });
  return NextResponse.json({ error: "TollGuru key found, but endpoint payload still needs final account-specific setup.", origin: body.origin, destination: body.destination, waypoints: body.waypoints || [], vehicleType: body.vehicleType || "5 axle truck" }, { status: 501 });
}
