import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PreferencesClient } from "./PreferencesClient";
import { PushPermissionPrompt } from "@/components/push/PushPermissionPrompt";

export const metadata = {
  title: "Notification Preferences | Voice of UPSA",
  description: "Manage your notification preferences.",
};

export default async function NotificationPreferencesPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  // Fetch preferences
  const { data: preferences } = await supabase
    .from("notification_preferences")
    .select("category, muted")
    .eq("profile_id", user.id);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#1B2A4A]">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage your account settings and preferences.
        </p>
      </div>

      <PreferencesClient initialPreferences={preferences || []} />
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-[#1B2A4A] mb-4">Web Push Notifications</h2>
        <p className="text-sm text-gray-500 mb-6">Manage browser-level push notifications for major announcements.</p>
        <PushPermissionPrompt topics={["new_articles"]} />
      </div>
    </div>
  );
}
