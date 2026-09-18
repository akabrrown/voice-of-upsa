import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getAllHolidaysForYear } from "@/lib/holidays/engine";
import { DBHolidayWish } from "@/lib/holidays/types";
import { sendHolidayPushNotification } from "@/lib/onesignal";

export const dynamic = "force-dynamic";

async function verifyStaffRole() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "editor"].includes(profile.role)) {
    return null;
  }
  return { user, role: profile.role };
}

export async function GET(request: Request) {
  const auth = await verifyStaffRole();
  if (!auth) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()), 10);

  try {
    const adminClient = getAdminClient();
    const { data: dbRecords, error } = await adminClient
      .from("holiday_wishes")
      .select("*")
      .order("created_at", { ascending: true });

    const records = (dbRecords || []) as DBHolidayWish[];
    const computedHolidays = getAllHolidaysForYear(year, records);

    return NextResponse.json({
      success: true,
      year,
      dbRecords: records,
      computedHolidays,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await verifyStaffRole();
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ success: false, error: "Unauthorized. Admin role required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      holiday_key,
      title,
      custom_date_override,
      headline,
      body_message,
      theme_accent,
      academic_status,
      featured_article_slug,
      send_push_notification,
      is_active,
      broadcast_push_now,
    } = body;

    if (!holiday_key) {
      return NextResponse.json({ success: false, error: "holiday_key is required" }, { status: 400 });
    }

    const adminClient = getAdminClient();

    // Upsert into holiday_wishes
    const { data, error } = await adminClient
      .from("holiday_wishes")
      .upsert({
        holiday_key,
        title,
        custom_date_override: custom_date_override || null,
        headline,
        body_message,
        theme_accent,
        academic_status,
        featured_article_slug: featured_article_slug || null,
        send_push_notification: !!send_push_notification,
        is_active: is_active !== false,
        updated_at: new Date().toISOString(),
      }, { onConflict: "holiday_key" })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    let pushResult = null;
    if (broadcast_push_now && headline && body_message) {
      pushResult = await sendHolidayPushNotification(headline, body_message);
    }

    return NextResponse.json({
      success: true,
      data,
      pushResult,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
