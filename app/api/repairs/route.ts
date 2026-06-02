import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from("repairs")
      .insert({
        driver_id: body.driver_id,
        repair_date: body.repair_date,
        amount: body.amount,
        vendor: body.vendor || null,
        description: body.description || null,
        truck_number: body.truck_number || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ repair: data });
  } catch {
    return NextResponse.json({ error: "Could not save repair." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get("driver_id");
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const supabase = getSupabaseServiceClient();
    let query = supabase.from("repairs").select("*").order("repair_date", { ascending: false }).limit(500);

    if (driverId) query = query.eq("driver_id", driverId);
    if (start) query = query.gte("repair_date", start);
    if (end) query = query.lte("repair_date", end);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ repairs: data || [] });
  } catch {
    return NextResponse.json({ error: "Could not fetch repairs." }, { status: 500 });
  }
}
