import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("include_inactive") === "true";

    const supabase = getSupabaseServiceClient();
    let query = supabase.from("drivers").select("*").order("name", { ascending: true });

    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

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

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const supabase = getSupabaseServiceClient();

    if (!body.id) {
      return NextResponse.json({ error: "Missing driver id." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("drivers")
      .update({
        name: body.name,
        truck_number: body.truck_number || null,
        driver_type: body.driver_type || "company",
        is_active: Boolean(body.is_active),
      })
      .eq("id", body.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ driver: data });
  } catch {
    return NextResponse.json({ error: "Could not update driver." }, { status: 500 });
  }
}
