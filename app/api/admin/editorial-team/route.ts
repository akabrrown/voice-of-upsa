import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabaseAdmin = getAdminClient();
    const { data, error } = await supabaseAdmin
      .from("editorial_team")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Editorial team query notice:", error.message);
      // Fallback default team if table was just created
      return NextResponse.json({
        members: [
          {
            id: "1",
            name: "Dr. Kwesi Amponsah",
            role: "Editor-in-Chief",
            bio: "Supervising editorial direction, journalistic ethics, and publication strategy.",
            image_url: "/logo.jpg",
            display_order: 1,
            is_active: true,
          },
          {
            id: "2",
            name: "Sarah Mensah",
            role: "Managing Editor",
            bio: "Directing newsroom operations, investigative desks, and campus outreach.",
            image_url: "/logo.jpg",
            display_order: 2,
            is_active: true,
          },
          {
            id: "3",
            name: "Isaac Osei",
            role: "Digital Content Lead",
            bio: "Leading multimedia storytelling, audio-visual desks, and social engagement.",
            image_url: "/logo.jpg",
            display_order: 3,
            is_active: true,
          },
          {
            id: "4",
            name: "Grace Appiah",
            role: "Lead Reporter",
            bio: "Covering student council affairs, academic achievements, and campus development.",
            image_url: "/logo.jpg",
            display_order: 4,
            is_active: true,
          },
        ],
      });
    }

    return NextResponse.json({ members: data || [] });
  } catch (error: any) {
    console.error("Editorial team GET error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch team members" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getAdminClient();
    const body = await request.json();
    const { name, role, bio, image_url, email, social_links, display_order, is_active } = body;

    if (!name?.trim() || !role?.trim()) {
      return NextResponse.json({ error: "Name and Role/Position are required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("editorial_team")
      .insert({
        name: name.trim(),
        role: role.trim(),
        bio: bio?.trim() || null,
        image_url: image_url?.trim() || "/logo.jpg",
        email: email?.trim() || null,
        social_links: social_links || {},
        display_order: Number(display_order) || 0,
        is_active: is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error("Editorial team insert error:", error);
      throw error;
    }

    return NextResponse.json({ member: data, message: "Team member added successfully" });
  } catch (error: any) {
    console.error("Editorial team POST error:", error);
    return NextResponse.json({ error: error.message || "Failed to add team member" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabaseAdmin = getAdminClient();
    const body = await request.json();
    const { id, name, role, bio, image_url, email, social_links, display_order, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
    }

    if (!name?.trim() || !role?.trim()) {
      return NextResponse.json({ error: "Name and Role/Position are required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("editorial_team")
      .update({
        name: name.trim(),
        role: role.trim(),
        bio: bio?.trim() || null,
        image_url: image_url?.trim() || "/logo.jpg",
        email: email?.trim() || null,
        social_links: social_links || {},
        display_order: Number(display_order) || 0,
        is_active: is_active ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Editorial team update error:", error);
      throw error;
    }

    return NextResponse.json({ member: data, message: "Team member updated successfully" });
  } catch (error: any) {
    console.error("Editorial team PUT error:", error);
    return NextResponse.json({ error: error.message || "Failed to update team member" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabaseAdmin = getAdminClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("editorial_team")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Editorial team delete error:", error);
      throw error;
    }

    return NextResponse.json({ success: true, message: "Team member deleted successfully" });
  } catch (error: any) {
    console.error("Editorial team DELETE error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete team member" }, { status: 500 });
  }
}
