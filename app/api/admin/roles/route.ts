import { getAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/server-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const adminSupabase = getAdminClient();
    
    // Fetch profiles - staff prioritized, up to 200 users
    const { data: profiles, error } = await adminSupabase
      .from("profiles")
      .select("id, full_name, role, avatar_url, created_at, is_admin")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw error;

    // Fetch auth users to get emails
    const { data: usersData, error: usersError } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 });
    
    let mergedProfiles = (profiles || []).map((profile) => {
      const authUser = usersData?.users?.find((u) => u.id === profile.id);
      return {
        ...profile,
        role: profile.role === "public" ? "user" : profile.role,
        email: authUser?.email || "No email",
      };
    });

    return NextResponse.json({ success: true, data: mergedProfiles });
  } catch (error: any) {
    console.error("Admin roles GET error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const { userId, newRole } = await request.json();

    if (!userId || !newRole) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Only allow specific roles
    const validRoles = ["user", "public", "editor", "admin"];
    if (!validRoles.includes(newRole)) {
      return NextResponse.json({ success: false, error: "Invalid role" }, { status: 400 });
    }

    // Map "user" to database check constraint value "public"
    const targetRole = newRole === "user" ? "public" : newRole;

    // Prevent demoting self
    if (auth.user.id === userId && targetRole !== "admin") {
      return NextResponse.json(
        { success: false, error: "Cannot revoke your own administrator privileges." },
        { status: 400 }
      );
    }

    const adminSupabase = getAdminClient();
    const { error } = await adminSupabase
      .from("profiles")
      .update({
        role: targetRole,
        is_admin: targetRole === "admin",
      })
      .eq("id", userId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Role updated successfully" });
  } catch (error: any) {
    console.error("Admin roles PATCH error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
