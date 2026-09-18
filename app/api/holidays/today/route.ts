import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getActiveHolidayForDate, formatDateISO } from "@/lib/holidays/engine";
import { DBHolidayWish, TodayHolidayResponse } from "@/lib/holidays/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    // Optional date query for testing/preview: ?date=2026-03-06
    const queryDate = searchParams.get("date");
    const targetDate = queryDate || formatDateISO(new Date());

    let dbRecords: DBHolidayWish[] = [];
    try {
      const supabase = getAdminClient();
      const { data, error } = await supabase
        .from("holiday_wishes")
        .select("*")
        .eq("is_active", true);

      if (!error && data) {
        dbRecords = data as DBHolidayWish[];
      }
    } catch {
      // Fall back to built-in statutory engine definitions if table is not yet migrated
      dbRecords = [];
    }

    const activeHoliday = getActiveHolidayForDate(targetDate, dbRecords);

    const payload: TodayHolidayResponse = {
      isHoliday: !!activeHoliday,
      holiday: activeHoliday,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { isHoliday: false, holiday: null, error: error.message },
      { status: 500 }
    );
  }
}
