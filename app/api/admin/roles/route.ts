import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
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

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const adminSupabase = getAdminClient();
    
    // Fetch profiles without the email column
    const { data: profiles, error } = await adminSupabase
      .from("profiles")
      .select("id, full_name, role, avatar_url, created_at")
      .in("role", ["admin", "editor"])
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Fetch auth users to get emails (increase limit to avoid missing users)
    const { data: usersData, error: usersError } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 });
    
    let mergedProfiles = profiles || [];
    if (!usersError && usersData?.users) {
      mergedProfiles = profiles.map(profile => {
        const authUser = usersData.users.find(u => u.id === profile.id);
        return {
          ...profile,
          email: authUser?.email || "No email"
        };
      });
    }

    return NextResponse.json({ success: true, data: mergedProfiles });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
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

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { userId, newRole } = await request.json();

    if (!userId || !newRole) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Only allow specific roles
    if (!["user", "editor", "admin"].includes(newRole)) {
      return NextResponse.json({ success: false, error: "Invalid role" }, { status: 400 });
    }

    const adminSupabase = getAdminClient();
    const { error } = await adminSupabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Role updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
