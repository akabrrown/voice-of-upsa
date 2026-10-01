import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const data = await req.json();

    const { name, email, subject, message } = data;

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: contactMsg, error } = await supabase
      .from("contact_messages")
      .insert({
        name,
        email,
        subject,
        message,
        status: "unread"
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, contactMsg });
  } catch (error: any) {
    console.error("Contact submission error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
