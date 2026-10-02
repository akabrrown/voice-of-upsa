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

    const { data: ad, error } = await supabase
      .from("advertisements")
      .insert({
        company_name,
        contact_email,
        contact_phone,
        ad_tier,
        ad_placement,
        target_url,
        banner_image_url,
        status: "pending"
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, ad });
  } catch (error: any) {
    console.error("Ad submission error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
