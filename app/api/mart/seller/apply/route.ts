import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ApplySellerSchema } from "@/lib/marketplace/schemas";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = ApplySellerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.format() }, { status: 400 });
    }

    const { seller_type, full_name, phone, index_number, whatsapp_number, student_id_url, business_name } = parsed.data;

    // 1. Update profiles table with whatsapp_number, is_seller, seller_status
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        is_seller: true,
        seller_status: 'pending_verification',
        whatsapp_number: whatsapp_number || null,
      })
      .eq('id', session.user.id);

    if (profileError) throw profileError;

    // 2. Insert into seller_details
    const { error: detailsError } = await supabase
      .from('seller_details')
      .upsert({
        profile_id: session.user.id,
        seller_type,
        full_name,
        phone,
        index_number: index_number || null,
        student_id_url: student_id_url || null,
        business_name: business_name || null,
      }, { onConflict: 'profile_id' });

    if (detailsError) throw detailsError;

    return NextResponse.json({ message: "Application submitted successfully" });
  } catch (error: any) {
    console.error("Seller application error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
