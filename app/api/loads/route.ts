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

export async function GET() {
  try {
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase.from("loads").select("*").order("created_at", { ascending: false }).limit(25);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ loads: data });
  } catch {
    return NextResponse.json({ error: "Could not fetch loads." }, { status: 500 });
  }
}
