import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = getSupabaseServiceClient();

    if (Array.isArray(body.entries)) {
      const rows = body.entries.map((entry: any) => ({
        driver_id: entry.driver_id,
        cost_date: entry.cost_date,
        cost_type: entry.cost_type || "diesel",
        amount: Number(entry.amount || 0),
        vendor: entry.vendor || null,
        description: entry.description || null,
        truck_number: entry.truck_number || null,
      }));

      const { data, error } = await supabase
        .from("actual_costs")
        .insert(rows)
        .select();

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ costs: data || [], count: data?.length || 0 });
    }

    const { data, error } = await supabase
      .from("actual_costs")
      .insert({
        driver_id: body.driver_id,
        cost_date: body.cost_date,
        cost_type: body.cost_type,
        amount: body.amount,
        vendor: body.vendor || null,
        description: body.description || null,
        truck_number: body.truck_number || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ cost: data });
  } catch {
    return NextResponse.json({ error: "Could not save actual cost." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get("driver_id");
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const costType = searchParams.get("cost_type");

    const supabase = getSupabaseServiceClient();
    let query = supabase.from("actual_costs").select("*").order("cost_date", { ascending: false }).limit(1000);

    if (driverId) query = query.eq("driver_id", driverId);
    if (start) query = query.gte("cost_date", start);
    if (end) query = query.lte("cost_date", end);
    if (costType) query = query.eq("cost_type", costType);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ costs: data || [] });
  } catch {
    return NextResponse.json({ error: "Could not fetch actual costs." }, { status: 500 });
  }
}
