import { createClient } from "@/lib/supabase/server";

export async function logAudit(
  actor_id: string,
  action: string,
  target_type: string,
  target_id: string,
  metadata: any = {}
) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("audit_logs")
      .insert({
        actor_id,
        action,
        target_type,
        target_id,
        metadata
      });
      
    if (error) {
      console.error("Failed to log audit event:", error);
    }
  } catch (err) {
    console.error("Audit logger exception:", err);
  }
}
