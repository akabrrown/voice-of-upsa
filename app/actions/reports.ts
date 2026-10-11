"use server";

import { createClient } from "@/lib/supabase/server";

export type ReportReason =
  | "harassment"
  | "inappropriate"
  | "identifies_person"
  | "self_harm"
  | "threat_of_violence"
  | "spam"
  | "scam"
  | "fraud"
  | "fake_product"
  | "misleading"
  | "other";

interface SubmitReportInput {
  resourceType: string;
  resourceId: string;
  reason: ReportReason;
  details?: string;
}

export async function submitContentReport({
  resourceType,
  resourceId,
  reason,
  details,
}: SubmitReportInput): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "You must be signed in to submit a report." };
    }

    if (!resourceType || !resourceId || !reason) {
      return { success: false, error: "Missing required report information." };
    }

    // Check if user already reported this exact resource
    const { data: existingReport } = await supabase
      .from("reports")
      .select("id")
      .eq("reporter_id", user.id)
      .eq("resource_type", resourceType)
      .eq("resource_id", resourceId)
      .maybeSingle();

    if (existingReport) {
      return {
        success: true,
        message: "You have already reported this item. Our moderation team has been notified.",
      };
    }

    const { error: insertError } = await supabase.from("reports").insert({
      reporter_id: user.id,
      resource_type: resourceType,
      resource_id: resourceId,
      reason,
      details: details?.trim() || null,
      status: "open",
    });

    if (insertError) {
      console.error("Error creating content report:", insertError);
      return { success: false, error: insertError.message || "Failed to submit report." };
    }

    return {
      success: true,
      message: "Report submitted successfully. Thank you for keeping our campus safe.",
    };
  } catch (err: any) {
    console.error("Report server action error:", err);
    return { success: false, error: err?.message || "Internal server error" };
  }
}
