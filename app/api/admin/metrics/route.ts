import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getAdminClient();

    // Fetch all metrics ordered by views descending
    const { data, error } = await supabase
      .from("site_metrics")
      .select("*")
      .order("views", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error fetching metrics:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
