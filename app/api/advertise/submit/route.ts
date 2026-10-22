import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const data = await req.json();

    const { company_name, contact_email, contact_phone, ad_tier, ad_placement, target_url, banner_image_url } = data;

    if (!company_name || !contact_email || !ad_tier || !ad_placement) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const basePayload: Record<string, any> = {
      company_name,
      contact_name: company_name,
      contact_email,
      contact_phone: contact_phone || null,
      target_url: target_url || null,
      package_tier: ad_tier,
      ad_type: ad_placement,
      ad_placement,
      creative_url: banner_image_url || null,
      status: "pending"
    };

    let { data: ad, error } = await supabase
      .from("advertisements")
      .insert({
        ...basePayload,
        ad_tier,
        banner_image_url: banner_image_url || null,
      })
      .select()
      .single();

    if (error && (error.message?.includes("ad_tier") || error.message?.includes("banner_image_url") || (error as any).code === "PGRST204")) {
      const fallback = await supabase
        .from("advertisements")
        .insert(basePayload)
        .select()
        .single();
      ad = fallback.data;
      error = fallback.error;
    }

    if (error) throw error;

    return NextResponse.json({ success: true, ad });
  } catch (error: any) {
    console.error("Ad submission error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
