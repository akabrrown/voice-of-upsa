import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, requireStaff } from "@/lib/auth/server-auth";
import { getAllHolidaysForYear, GHANA_STATUTORY_HOLIDAYS } from "@/lib/holidays/engine";
import { DBHolidayWish } from "@/lib/holidays/types";
import { sendPushToTopic } from "@/lib/push/send";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireStaff();
  if (auth.errorResponse) {
    return auth.errorResponse;
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
  const auth = await requireAdmin();
  if (auth.errorResponse) {
    return auth.errorResponse;
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
    } = body;

    if (!holiday_key) {
      return NextResponse.json({ success: false, error: "holiday_key is required" }, { status: 400 });
    }

    const adminClient = getAdminClient();

    const def = GHANA_STATUTORY_HOLIDAYS.find((h) => h.key === holiday_key);
    const date_type = body.date_type || def?.dateType || "fixed";
    const month = body.month ?? def?.month ?? null;
    const day = body.day ?? def?.day ?? null;
    const resolvedTitle = title || def?.title || holiday_key;

    // Upsert into holiday_wishes
    const { data, error } = await adminClient
      .from("holiday_wishes")
      .upsert({
        holiday_key,
        title: resolvedTitle,
        date_type,
        month,
        day,
        custom_date_override: custom_date_override || null,
        headline,
        body_message,
        theme_accent: theme_accent || def?.themeAccent || "gold",
        academic_status: academic_status || def?.academicStatus || "Statutory public holiday — Lectures suspended",
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
    if (is_active !== false && headline && body_message) {
      try {
        await sendPushToTopic("all_users", {
          title: resolvedTitle || headline,
          body: body_message,
          url: "/",
          tag: "holiday",
        });
        pushResult = { success: true };
      } catch (e: any) {
        console.error("Native Web Push error:", e);
        pushResult = { success: false, error: e.message };
      }
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
