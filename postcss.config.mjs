import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const loadId = String(formData.get("loadId") || "");
    const fileType = String(formData.get("fileType") || "");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    if (!loadId) {
      return NextResponse.json({ error: "Missing loadId. Save the estimate before uploading RC files." }, { status: 400 });
    }

    if (!["origin_rc", "return_rc"].includes(fileType)) {
      return NextResponse.json({ error: "Invalid fileType." }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();
    const ext = file.name.split(".").pop() || "pdf";
    const filePath = `${loadId}/${fileType}-${Date.now()}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("rate-confirmations")
      .upload(filePath, buffer, {
        contentType: file.type || "application/pdf",
        upsert: false
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 400 });
    }

    const { data, error: insertError } = await supabase
      .from("load_files")
      .insert({
        load_id: loadId,
        file_type: fileType,
        file_path: filePath,
        original_filename: file.name
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    return NextResponse.json({ file: data });
  } catch (error) {
    return NextResponse.json({ error: "Could not upload RC file." }, { status: 500 });
  }
}
