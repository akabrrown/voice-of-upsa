import { NextResponse } from "next/server";
import { getAdminMessaging } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ success: false, error: "Token is required" }, { status: 400 });
    }

    // Subscribe the device token to the "all_users" topic
    // This allows us to broadcast notifications to everyone without needing to query thousands of tokens
    const messaging = getAdminMessaging();
    await messaging.subscribeToTopic([token], "all_users");

    return NextResponse.json({ success: true, message: "Successfully subscribed to notifications" });
  } catch (error: any) {
    console.error("Error subscribing to topic:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
