import { createClient } from "@/lib/supabase/server";

export async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  const is_admin = Boolean(
    profile.is_admin === true || 
    profile.role === "admin" || 
    profile.role === "developer"
  );

  return { ...user, ...profile, is_admin };
}
