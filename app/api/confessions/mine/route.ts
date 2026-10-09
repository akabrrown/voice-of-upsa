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
    
    const { data, error } = await supabase
      .from('confession_posts')
      .select(`
        id, type, category, body_text, created_at, status
      `)
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error fetching my confessions:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
