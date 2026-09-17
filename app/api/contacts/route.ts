import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    if (!name?.trim() || typeof name !== "string") {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
    }

    if (!email?.trim() || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json({ success: false, error: "A valid email address is required" }, { status: 400 });
    }

    if (!subject?.trim() || typeof subject !== "string") {
      return NextResponse.json({ success: false, error: "Subject is required" }, { status: 400 });
    }

    if (!message?.trim() || typeof message !== "string") {
      return NextResponse.json({ success: false, error: "Message content is required" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("contacts")
      .insert([
        {
          name: name.trim().slice(0, 150),
          email: email.trim().toLowerCase().slice(0, 255),
          subject: subject.trim().slice(0, 200),
          message: message.trim().slice(0, 5000),
          status: "unread",
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: "Invalid request payload" }, { status: 400 });
  }
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
