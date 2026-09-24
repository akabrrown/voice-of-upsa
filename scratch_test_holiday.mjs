import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy";

const adminClient = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testUpsert() {
  const { data, error } = await adminClient
    .from("holiday_wishes")
    .upsert({
      holiday_key: "new_year",
      title: "New Year's Day",
      date_type: "fixed",
      month: 1,
      day: 1,
      headline: "Happy New Year!",
      body_message: "Wishing you a great year.",
      theme_accent: "gold",
      academic_status: "Statutory public holiday — Lectures suspended",
      send_push_notification: false,
      is_active: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "holiday_key" })
    .select()
    .single();

  if (error) {
    console.error("DB Error:", error);
  } else {
    console.log("Success:", data);
  }
}

testUpsert();
