import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const showSlug = searchParams.get('show');
  
  const supabase = await createClient();
  
  try {
    let data, error;
    
    if (showSlug) {
      const res = await supabase
        .from("podcast_shows")
        .select("*, episodes:podcast_episodes(*)")
        .eq("status", "active")
        .is("deleted_at", null)
        .eq("slug", showSlug)
        .single();
      data = res.data;
      error = res.error;
    } else {
      const res = await supabase
        .from("podcast_shows")
        .select("*, episodes:podcast_episodes(*)")
        .eq("status", "active")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      data = res.data;
      error = res.error;
    }

    if (error) throw error;
    
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error fetching podcasts:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
