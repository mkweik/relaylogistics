import { NextResponse } from "next/server";

type Body = {
  from: string;
  to: string;
};

export async function POST(request: Request) {
  const apiKey = process.env.TOLLGURU_API_KEY;
  const body = (await request.json()) as Body;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing TOLLGURU_API_KEY in Vercel environment variables.", tolls: 0 },
      { status: 400 }
    );
  }

  // This route intentionally returns a setup message until your exact TollGuru plan/endpoint is confirmed.
  // The UI is wired, so once the final endpoint is configured, tolls can auto-fill without changing the form.
  return NextResponse.json(
    {
      error: "TollGuru endpoint needs final account-specific setup.",
      tolls: 0,
      from: body.from,
      to: body.to,
    },
    { status: 501 }
  );
}
