import { createClient } from "@supabase/supabase-js";

export function getSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !service) {
    throw new Error("Missing Supabase service environment variables.");
  }

  return createClient(url, service);
}
