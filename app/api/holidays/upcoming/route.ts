import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getNextUpcomingHoliday, formatDateISO } from "@/lib/holidays/engine";
import { DBHolidayWish, UpcomingHolidayResponse } from "@/lib/holidays/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryDate = searchParams.get("from");
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
      dbRecords = [];
    }

    const nextUpcoming = getNextUpcomingHoliday(targetDate, dbRecords);

    const payload: UpcomingHolidayResponse = {
      upcoming: nextUpcoming,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { upcoming: null, error: error.message },
      { status: 500 }
    );
  }
}
