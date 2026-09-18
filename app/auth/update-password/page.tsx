"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, ResetPasswordFormValues } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;
    let sessionEstablished = false;

    const markSessionValid = () => {
      sessionEstablished = true;
      if (isMounted) {
        setHasValidSession(true);
        setIsVerifying(false);
      }
    };

    const checkAndEstablishSession = async () => {
      if (typeof window === "undefined") return;

      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));

      const errorDescription =
        urlParams.get("error_description") ||
        hashParams.get("error_description") ||
        urlParams.get("error");

      // 1. Direct PKCE code exchange if landed directly with ?code=
      const code = urlParams.get("code");
      if (code) {
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error && data?.session) {
            markSessionValid();
            return;
          }
        } catch (e) {
          console.warn("[UpdatePassword] Code exchange check:", e);
        }
      }

      // 2. Direct token_hash exchange if landed with ?token_hash=
      const tokenHash = urlParams.get("token_hash");
      const type = (urlParams.get("type") as "recovery" | "email" | null) || "recovery";
      if (tokenHash) {
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type,
          });
          if (!error && data?.session) {
            markSessionValid();
            return;
          }
        } catch (e) {
          console.warn("[UpdatePassword] token_hash check:", e);
        }
      }

      // 3. Hash parameters (implicit recovery tokens: #access_token=...&refresh_token=...)
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      if (accessToken && refreshToken) {
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!error && data?.session) {
            markSessionValid();
            return;
          }
        } catch (e) {
          console.warn("[UpdatePassword] Set session from hash:", e);
        }
      }

      // 4. Check existing session from cookies (set by callback route)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        markSessionValid();
        return;
      }

      // 5. Listen for auth state change
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
        if (newSession || event === "PASSWORD_RECOVERY") {
          markSessionValid();
        }
      });

      // 6. If an explicit error was passed and no session exists, display it
      if (errorDescription && !sessionEstablished) {
        const decoded = decodeURIComponent(errorDescription.replace(/\+/g, " "));
        setErrorMessage(decoded);
        if (isMounted) {
          setIsVerifying(false);
          setHasValidSession(false);
        }
        return;
      }

      // 7. Grace period for slower mobile network hydration
      setTimeout(async () => {
        if (!isMounted || sessionEstablished) return;
        const { data: { session: finalSession } } = await supabase.auth.getSession();
        if (finalSession) {
          markSessionValid();
        } else {
          setHasValidSession(false);
          setErrorMessage(
            errorDescription
              ? decodeURIComponent(errorDescription.replace(/\+/g, " "))
              : "This password reset link has expired or has already been used."
          );
          setIsVerifying(false);
        }
      }, 1800);

      return () => {
        subscription.unsubscribe();
      };
    };

    checkAndEstablishSession();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Password updated successfully! Welcome back.");

      // Route directly to dashboard so user continues with their account immediately
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error?.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-xl border border-gray-100 text-center space-y-4">
          <div className="relative h-16 w-16 mx-auto rounded-full overflow-hidden border-2 border-upsa-gold/20 shadow-md">
            <Image src="/logo.jpg" alt="Voice of UPSA" fill sizes="64px" className="object-cover" />
          </div>
          <div className="flex items-center justify-center space-x-2 text-upsa-navy">
            <span className="h-4 w-4 border-2 border-upsa-navy/30 border-t-upsa-navy rounded-full animate-spin"></span>
            <span className="text-sm font-semibold">Verifying reset link...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!hasValidSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-xl border border-gray-100 text-center space-y-6">
          <div className="relative h-20 w-20 mx-auto rounded-full overflow-hidden border-4 border-upsa-gold/20 shadow-lg mb-2">
            <Image src="/logo.jpg" alt="Voice of UPSA" fill sizes="80px" className="object-cover" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-upsa-navy">Reset Link Expired</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              {errorMessage || "This password reset link has expired or has already been used."}
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-3">
            <Link
              href="/auth/forgot-password"
              className="w-full bg-upsa-navy text-white hover:bg-upsa-navy/90 py-3.5 rounded-xl font-semibold text-sm transition-all shadow-sm flex items-center justify-center space-x-2"
            >
              <span>Request a New Reset Link</span>
            </Link>
            <Link
              href="/auth/login"
              className="text-xs font-semibold text-gray-500 hover:text-upsa-navy transition-colors py-2"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <Link href="/" className="flex flex-col items-center group">
            <div className="relative h-20 w-20 rounded-full overflow-hidden border-4 border-upsa-gold/20 shadow-lg transition-transform group-hover:scale-105 mb-3">
              <Image
                src="/logo.jpg"
                alt="Voice of UPSA"
                fill
                sizes="120px"
                className="object-cover"
              />
            </div>
          </Link>
          <h2 className="mt-6 text-3xl font-black text-upsa-navy tracking-tight">
            Update Password
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Enter your new password below to update your account.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  className={errors.password ? "border-red-500" : ""}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-upsa-navy"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("confirmPassword")}
                  className={errors.confirmPassword ? "border-red-500" : ""}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 font-medium">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-upsa-navy text-white hover:bg-upsa-gold hover:text-upsa-navy py-6 text-lg font-bold transition-all"
            disabled={isLoading}
          >
            {isLoading ? "Updating..." : (
              <>
                Update Password
                <Lock className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
