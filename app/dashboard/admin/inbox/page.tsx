import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import InboxClient from "./InboxClient";

export const metadata = {
  title: "Inbox | Admin Dashboard",
};

export default async function AdminInboxPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/");
  }

  const { data: messages, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching inbox messages:", error);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black text-upsa-navy tracking-tight">Inbox</h1>
        <p className="text-gray-500 mt-2 font-medium">Manage and reply to contact form submissions.</p>
      </div>

      <InboxClient initialMessages={messages || []} />
    </div>
  );
}
