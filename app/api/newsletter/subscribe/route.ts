import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { mutationLimiter, checkRateLimit, getClientIp } from "@/lib/security/rate-limiter";
import { withInFlightLock, DuplicateRequestError } from "@/lib/utils/dedupe";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  // Rate limit newsletter mutations to 15 req/min per IP
  const clientIp = getClientIp(request);
  const rateLimit = await checkRateLimit(mutationLimiter, `newsletter:${clientIp}`);
  if (!rateLimit.allowed) {
    return rateLimit.response!;
  }

  const supabaseAdmin = getAdminClient();

  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // In-flight deduplication lock: prevents concurrent duplicate subscription submissions
    return await withInFlightLock(
      `newsletter_sub:${cleanEmail}`,
      async () => {
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
      },
      { behavior: "reject" }
    );
  } catch (err: unknown) {
    if (err instanceof DuplicateRequestError) {
      return NextResponse.json(
        { success: false, error: "Subscription already in progress. Please wait a moment." },
        { status: 409 }
      );
    }
    console.error("Newsletter API unexpected error:", err);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
