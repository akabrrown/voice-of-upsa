import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { screenConfession } from "@/lib/confessions/screening";
import { getUser } from "@/lib/auth/user";

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, category, body_text, acknowledgment_confirmed } = body;

    if (!body_text || body_text.length > 500) {
      return NextResponse.json({ success: false, error: "Body text must be between 1 and 500 characters" }, { status: 400 });
    }
    if (!acknowledgment_confirmed) {
      return NextResponse.json({ success: false, error: "Acknowledgment must be confirmed" }, { status: 400 });
    }
    if (!['confession', 'opinion'].includes(type)) {
      return NextResponse.json({ success: false, error: "Invalid type" }, { status: 400 });
    }
    if (!['academics', 'campus_life', 'relationships', 'humor', 'serious_support', 'other'].includes(category)) {
      return NextResponse.json({ success: false, error: "Invalid category" }, { status: 400 });
    }

    const screeningResult = screenConfession(body_text);
    
    // All confessions are set to pending_review by default so admins must approve them
    const status = 'pending_review';

    const supabase = await createClient();

    const { data: post, error } = await supabase
      .from('confession_posts')
      .insert({
        author_id: user.id,
        type,
        category,
        body_text,
        acknowledgment_confirmed,
        screening_flag: screeningResult.flag,
        status
      })
      .select('id, status, screening_flag')
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      data: post 
    });
  } catch (error: any) {
    console.error("Error creating confession:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    
    const supabase = await createClient();
    
    let query = supabase
      .from('confession_posts')
      .select(`
        id, type, category, body_text, created_at,
        confession_reactions (
          reaction_type, user_id
        )
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (type && type !== 'all') {
      query = query.eq('type', type);
    }
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data, error } = await query.limit(50);

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error fetching confessions:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
