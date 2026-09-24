import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";

const ActionSchema = z.object({
  profile_id: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
});

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set(name: string, value: string, options: CookieOptions) { cookieStore.set({ name, value, ...options }); },
          remove(name: string, options: CookieOptions) { cookieStore.set({ name, value: "", ...options }); },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify admin
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('is_admin, role')
      .eq('id', session.user.id)
      .single();

    if (!adminProfile?.is_admin && adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = ActionSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

    const { profile_id, action } = parsed.data;

    const newStatus = action === 'approve' ? 'verified' : 'rejected';

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ seller_status: newStatus })
      .eq('id', profile_id);

    if (profileError) throw profileError;

    // Update seller_details verified_by
    if (action === 'approve') {
      await supabase
        .from('seller_details')
        .update({ verified_at: new Date().toISOString(), verified_by: session.user.id })
        .eq('profile_id', profile_id);
    }

    return NextResponse.json({ message: `Seller ${action}d successfully` });
  } catch (error: any) {
    console.error("Seller action error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
