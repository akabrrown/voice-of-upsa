import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  role: "admin" | "editor" | "public";
  full_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  is_active?: boolean;
}

export interface AuthSuccess {
  user: User;
  profile: UserProfile;
  errorResponse: null;
}

export interface AuthFailure {
  user: null;
  profile: null;
  errorResponse: NextResponse;
}

export type AuthResult = AuthSuccess | AuthFailure;

/**
 * Validates that the current request has an active authenticated user session.
 */
export async function requireAuth(): Promise<AuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      user: null,
      profile: null,
      errorResponse: NextResponse.json(
        { success: false, error: "Unauthorized. Valid authentication session required." },
        { status: 401 }
      ),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, full_name, username, avatar_url, is_active")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      user: null,
      profile: null,
      errorResponse: NextResponse.json(
        { success: false, error: "User profile not found or inactive." },
        { status: 403 }
      ),
    };
  }

  return {
    user,
    profile: profile as UserProfile,
    errorResponse: null,
  };
}

/**
 * Validates that the current user possesses an Administrator role.
 */
export async function requireAdmin(): Promise<AuthResult> {
  const auth = await requireAuth();
  if (auth.errorResponse) {
    return auth;
  }

  if (auth.profile.role !== "admin") {
    return {
      user: null,
      profile: null,
      errorResponse: NextResponse.json(
        { success: false, error: "Forbidden. Administrator privileges required." },
        { status: 403 }
      ),
    };
  }

  return auth;
}

/**
 * Validates that the current user is an authorized staff member (Admin or Editor).
 */
export async function requireStaff(): Promise<AuthResult> {
  const auth = await requireAuth();
  if (auth.errorResponse) {
    return auth;
  }

  if (!["admin", "editor"].includes(auth.profile.role)) {
    return {
      user: null,
      profile: null,
      errorResponse: NextResponse.json(
        { success: false, error: "Forbidden. Editorial or administrative privileges required." },
        { status: 403 }
      ),
    };
  }

  return auth;
}
