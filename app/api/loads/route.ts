import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase.from("loads").insert(body).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ load: data });
  } catch {
    return NextResponse.json({ error: "Could not save load." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get("driver_id");
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const supabase = getSupabaseServiceClient();
    let query = supabase.from("loads").select("*").order("load_date", { ascending: false }).limit(500);

    if (driverId) query = query.eq("driver_id", driverId);
    if (start) query = query.gte("load_date", start);
    if (end) query = query.lte("load_date", end);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ loads: data || [] });
  } catch {
    return NextResponse.json({ error: "Could not fetch loads." }, { status: 500 });
  }
}
