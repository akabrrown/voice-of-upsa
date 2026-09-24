import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

async function reload() {
  console.log("Triggering schema cache reload...");
  const { data, error } = await supabase.rpc("reload_schema_cache", {}).returns<any>();
  if (error) {
    console.log("RPC failed, trying raw query...", error);
    // There is no direct sql execution from JS client without postgres connection, 
    // but maybe the user can just re-save it now?
  } else {
    console.log("Reload successful:", data);
  }
}

reload();
