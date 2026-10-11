import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/server-auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const ActionSchema = z.object({
  profile_id: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
});

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const body = await request.json();
    const parsed = ActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid data", details: parsed.error.format() }, { status: 400 });
    }

    const { profile_id, action } = parsed.data;
    const newStatus = action === "approve" ? "verified" : "rejected";

    const adminSupabase = getAdminClient();

    // Update profile
    const { error: profileError } = await adminSupabase
      .from("profiles")
      .update({ seller_status: newStatus })
      .eq("id", profile_id);

    if (profileError) throw profileError;

    // Update seller_details verified_by
    if (action === "approve") {
      const { error: sellerError } = await adminSupabase
        .from("seller_details")
        .update({
          verified_at: new Date().toISOString(),
          verified_by: auth.user.id,
        })
        .eq("profile_id", profile_id);

      if (sellerError) throw sellerError;
    }

    return NextResponse.json({ success: true, message: `Seller ${action}d successfully` });
  } catch (error: any) {
    console.error("Seller action error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
