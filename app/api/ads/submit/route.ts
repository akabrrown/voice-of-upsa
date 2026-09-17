import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

// Service role client to guarantee notification delivery across all admin accounts
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export async function POST(request: Request) {
  try {
    // 1. Verify user session via server auth cookies
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please log in to submit advertising campaigns." },
        { status: 401 }
      );
    }

    // 2. Validate submission payload
    const body = await request.json();
    const {
      company_name,
      contact_name,
      contact_email,
      contact_phone,
      product_name,
      product_description,
      ad_type,
      target_url,
      package_tier,
      creative_url,
    } = body;

    if (!company_name?.trim() || !contact_name?.trim() || !contact_email?.trim()) {
      return NextResponse.json(
        { success: false, error: "Company name, contact person, and contact email are required." },
        { status: 400 }
      );
    }

    if (!creative_url?.trim()) {
      return NextResponse.json(
        { success: false, error: "Creative banner asset is required." },
        { status: 400 }
      );
    }

    if (!target_url?.trim()) {
      return NextResponse.json(
        { success: false, error: "Target click-through URL is required." },
        { status: 400 }
      );
    }

    // 3. Insert advertisement into database
    const { data: adData, error: adError } = await supabaseAdmin
      .from("advertisements")
      .insert({
        company_name: company_name.trim(),
        contact_name: contact_name.trim(),
        contact_email: contact_email.trim(),
        contact_phone: contact_phone?.trim() || null,
        product_name: product_name?.trim() || company_name.trim(),
        product_description: product_description?.trim() || "",
        ad_type: ad_type || "sidebar",
        target_url: target_url.trim(),
        package_tier: package_tier || "standard",
        creative_url: creative_url.trim(),
        submitted_by: user.id,
        status: "pending",
      })
      .select()
      .single();

    if (adError) {
      console.error("[Ads Submit] Insert error:", adError);
      return NextResponse.json(
        { success: false, error: adError.message || "Failed to submit advertisement." },
        { status: 500 }
      );
    }

    // 4. Query all administrators to broadcast in-app notifications
    const { data: admins, error: adminsError } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, role")
      .eq("role", "admin");

    if (!adminsError && admins && admins.length > 0) {
      const tierLabel = package_tier ? package_tier.toUpperCase() : "STANDARD";
      const campaignName = product_name?.trim() || company_name.trim();

      const adminNotifications = admins.map((admin) => ({
        user_id: admin.id,
        type: "advertisement",
        title: "New Ad Campaign Submitted",
        message: `${company_name.trim()} submitted a ${tierLabel} campaign for "${campaignName}" awaiting moderation.`,
        link: "/dashboard/admin/ads",
        is_read: false,
      }));

      const { error: notifError } = await supabaseAdmin
        .from("notifications")
        .insert(adminNotifications);

      if (notifError) {
        console.warn("[Ads Submit] Notification broadcast warning:", notifError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Advertisement submitted successfully.",
      advertisement: adData,
    });
  } catch (err: any) {
    console.error("[Ads Submit] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error occurred." },
      { status: 500 }
    );
  }
}
