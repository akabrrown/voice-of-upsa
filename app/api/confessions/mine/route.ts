import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/user";

export async function GET(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    
    let { data, error } = await supabase
      .from('confession_posts')
      .select(`
        id, type, category, body_text, created_at, status, review_note
      `)
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });

    if (error && (error.message?.includes("review_note") || (error as any).code === "42703" || (error as any).code === "PGRST204")) {
      const fallback = await supabase
        .from('confession_posts')
        .select(`
          id, type, category, body_text, created_at, status
        `)
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });
      data = (fallback.data || []).map((p: any) => ({ ...p, review_note: null }));
      error = fallback.error;
    }

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error fetching my confessions:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
