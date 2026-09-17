import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if already subscribed
    const { data: existing } = await supabaseAdmin
      .from("contacts")
      .select("id")
      .eq("email", cleanEmail)
      .eq("subject", "Newsletter")
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success: true,
        alreadySubscribed: true,
        message: "You are already subscribed to the Voice of UPSA Weekly Digest!",
      });
    }

    // Insert subscriber record
    const { error: insertError } = await supabaseAdmin
      .from("contacts")
      .insert([
        {
          name: "Newsletter Subscriber",
          email: cleanEmail,
          subject: "Newsletter",
          message: "Weekly Campus Digest Subscription",
          status: "unread",
        },
      ]);

    if (insertError) {
      console.error("Newsletter subscription error:", insertError);
      return NextResponse.json(
        { success: false, error: "Failed to save subscription. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Thank you for subscribing! You'll receive our weekly campus highlights.",
    });
  } catch (err: any) {
    console.error("Newsletter API unexpected error:", err);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
