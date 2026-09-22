import { NextResponse } from "next/server";
import { isDisposableEmail } from "@/lib/security/disposable-email";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { valid: false, message: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const check = isDisposableEmail(email);

    if (check.isDisposable) {
      return NextResponse.json(
        {
          valid: false,
          isDisposable: true,
          message: check.reason || "Disposable or temporary email addresses are not permitted.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      isDisposable: false,
      message: "Email is valid and accepted.",
    });
  } catch (error) {
    console.error("Email validation error:", error);
    return NextResponse.json(
      { valid: false, message: "An error occurred while validating the email address." },
      { status: 500 }
    );
  }
}
