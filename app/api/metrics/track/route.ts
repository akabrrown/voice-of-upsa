import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { entity_type, entity_slug, metric_type } = await req.json();

    if (!entity_type || !entity_slug || !metric_type) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    if (!['article', 'holiday', 'page'].includes(entity_type)) {
      return NextResponse.json({ success: false, error: "Invalid entity_type" }, { status: 400 });
    }

    if (!['view', 'share'].includes(metric_type)) {
      return NextResponse.json({ success: false, error: "Invalid metric_type" }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Call the RPC function to atomically increment the metric
    const { error } = await supabase.rpc('increment_metric', {
      p_entity_type: entity_type,
      p_entity_slug: entity_slug,
      p_metric_type: metric_type
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error tracking metric:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
