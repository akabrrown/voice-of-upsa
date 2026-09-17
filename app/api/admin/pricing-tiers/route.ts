import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const DEFAULT_TIERS = [
  {
    id: "basic",
    name: "Basic",
    price: 200,
    period: "per week",
    description: "Perfect for student-led initiatives and campus clubs.",
    features: [
      "Sidebar Ad (300x250)",
      "Standard Placement",
      "Basic Analytics",
      "Up to 10,000 Impressions",
    ],
    button_text: "Start Advertising",
    highlight: false,
    sort_order: 1,
    is_active: true,
  },
  {
    id: "standard",
    name: "Standard",
    price: 500,
    period: "per week",
    description: "Ideal for small businesses and service providers.",
    features: [
      "Leaderboard Ad (728x90)",
      "Premium Sidebar Placement",
      "In-feed Native Ad",
      "Detailed Analytics Report",
      "Up to 50,000 Impressions",
    ],
    button_text: "Most Popular",
    highlight: true,
    sort_order: 2,
    is_active: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: 1200,
    period: "per week",
    description: "Maximum exposure for corporate partners and brands.",
    features: [
      "All Standard Features",
      "Home Page Hero Banner",
      "Social Media Mention",
      "Article Sponsorship",
      "Unlimited Impressions",
      "Dedicated Account Manager",
    ],
    button_text: "Contact for Custom",
    highlight: false,
    sort_order: 3,
    is_active: true,
  },
];

export async function GET() {
  try {
    const supabaseAdmin = getAdminClient();
    const { data, error } = await supabaseAdmin
      .from("pricing_tiers")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("price", { ascending: true });

    if (error || !data || data.length === 0) {
      return NextResponse.json({ tiers: DEFAULT_TIERS });
    }

    // Merge database rows with default fallback fields if columns are null
    const merged = data.map((tier: any) => {
      const fallback = DEFAULT_TIERS.find((d) => d.id === tier.id);
      return {
        id: tier.id,
        name: tier.name || fallback?.name || tier.id.charAt(0).toUpperCase() + tier.id.slice(1),
        price: Number(tier.price),
        period: tier.period || "per week",
        description: tier.description || fallback?.description || "High-impact advertising package on Voice of UPSA.",
        features: Array.isArray(tier.features) && tier.features.length > 0 
          ? tier.features 
          : fallback?.features || ["Campus Wide Visibility", "Targeted Audience Reach"],
        highlight: Boolean(tier.highlight),
        button_text: tier.button_text || fallback?.button_text || "Start Advertising",
        sort_order: Number(tier.sort_order) || fallback?.sort_order || 0,
        is_active: tier.is_active ?? true,
      };
    });

    return NextResponse.json({ tiers: merged });
  } catch (error: any) {
    console.error("Pricing tiers GET error:", error);
    return NextResponse.json({ tiers: DEFAULT_TIERS });
  }
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getAdminClient();
    const body = await request.json();
    const { id, name, price, period, description, features, highlight, button_text, sort_order, is_active } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Plan name is required" }, { status: 400 });
    }

    const tierId = (id || name.toLowerCase().replace(/[^a-z0-9_-]/g, "_")).trim();
    const numericPrice = Number(price);

    if (isNaN(numericPrice) || numericPrice < 0) {
      return NextResponse.json({ error: "A valid positive price is required" }, { status: 400 });
    }

    const payload: Record<string, any> = {
      id: tierId,
      price: numericPrice,
      period: period?.trim() || "per week",
      name: name.trim(),
      description: description?.trim() || "",
      features: Array.isArray(features) ? features : [],
      highlight: Boolean(highlight),
      button_text: button_text?.trim() || "Start Advertising",
      sort_order: Number(sort_order) || 0,
      is_active: is_active ?? true,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("pricing_tiers")
      .upsert(payload)
      .select()
      .single();

    if (error) {
      console.error("Pricing tier upsert error:", error);
      throw error;
    }

    return NextResponse.json({ tier: data, message: "Pricing plan saved successfully" });
  } catch (error: any) {
    console.error("Pricing tier POST error:", error);
    return NextResponse.json({ error: error.message || "Failed to create pricing tier" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabaseAdmin = getAdminClient();
    const body = await request.json();
    const { id, name, price, period, description, features, highlight, button_text, sort_order, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: "Plan ID is required" }, { status: 400 });
    }

    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      return NextResponse.json({ error: "A valid positive price is required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("pricing_tiers")
      .update({
        price: numericPrice,
        period: period?.trim() || "per week",
        name: name?.trim() || id,
        description: description?.trim() || "",
        features: Array.isArray(features) ? features : [],
        highlight: Boolean(highlight),
        button_text: button_text?.trim() || "Start Advertising",
        sort_order: Number(sort_order) || 0,
        is_active: is_active ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Pricing tier update error:", error);
      throw error;
    }

    return NextResponse.json({ tier: data, message: "Pricing plan updated successfully" });
  } catch (error: any) {
    console.error("Pricing tier PUT error:", error);
    return NextResponse.json({ error: error.message || "Failed to update pricing tier" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabaseAdmin = getAdminClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Plan ID is required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("pricing_tiers")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Pricing tier delete error:", error);
      throw error;
    }

    return NextResponse.json({ success: true, message: "Pricing tier removed successfully" });
  } catch (error: any) {
    console.error("Pricing tier DELETE error:", error);
    return NextResponse.json({ error: error.message || "Failed to remove pricing tier" }, { status: 500 });
  }
}
