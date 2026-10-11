import { getAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { logAudit } from "@/lib/audit/logger";
import { getUser } from "@/lib/auth/user";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const user = await getUser();
  const isAdmin = Boolean(user && (user.is_admin === true || user.role === 'admin' || user.role === 'developer'));

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getAdminClient();

  try {
    const { data, error } = await supabase
      .from("podcast_shows")
      .select("*, episodes:podcast_episodes(count)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) throw error;
    
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getUser();
  const isAdmin = Boolean(user && (user.is_admin === true || user.role === 'admin' || user.role === 'developer'));

  if (!isAdmin || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getAdminClient();

  try {
    const body = await request.json();
    const { title, description, category, cover_image_url, itunes_author, itunes_explicit } = body;

    // Generate slug from title
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const { data, error } = await supabase
      .from("podcast_shows")
      .insert({
        title,
        slug,
        description,
        category,
        cover_image_url,
        itunes_author,
        itunes_explicit: itunes_explicit || false,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;

    await logAudit(user.id, "show.created", "podcast_shows", data.id, { title: data.title });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
