import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from("drivers")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ drivers: data || [] });
  } catch {
    return NextResponse.json({ error: "Could not fetch drivers." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from("drivers")
      .insert({
        name: body.name,
        truck_number: body.truck_number || null,
        driver_type: body.driver_type || "company",
        is_active: true,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ driver: data });
  } catch {
    return NextResponse.json({ error: "Could not add driver." }, { status: 500 });
  }
}
