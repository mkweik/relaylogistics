import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.TOLLGURU_API_KEY;
  const body = await request.json();

  if (!apiKey) {
    return NextResponse.json({ error: "Missing TOLLGURU_API_KEY in Vercel environment variables.", fallbackTolls: 0 }, { status: 400 });
  }

  return NextResponse.json(
    {
      error: "TollGuru key found, but endpoint payload still needs final account-specific setup.",
      received: body,
    },
    { status: 501 }
  );
}
