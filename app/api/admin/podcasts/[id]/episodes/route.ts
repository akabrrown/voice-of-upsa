import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/user";
import { logAudit } from "@/lib/audit/logger";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getUser();

  if (!user || !user.is_admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { 
      title, 
      description, 
      episode_number, 
      season_number, 
      audio_url, 
      duration_seconds, 
      status, 
      transcript 
    } = body;

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const { data, error } = await supabase
      .from("podcast_episodes")
      .insert({
        show_id: id,
        title,
        slug,
        description,
        episode_number,
        season_number,
        audio_url,
        duration_seconds,
        status: status || 'draft',
        transcript: transcript || null,
        published_at: status === 'published' ? new Date().toISOString() : null
      })
      .select()
      .single();

    if (error) throw error;
    
    if (status === 'published') {
      await logAudit(user.id, "episode.published", "podcast_episodes", data.id, { show_id: id, title: data.title });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
