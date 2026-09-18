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
  const [manualEmail, setManualEmail] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [isVerifyingManual, setIsVerifyingManual] = useState(false);
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

      // 1. Check if error or email was passed in URL query or hash
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));

      const emailParam = urlParams.get("email") || hashParams.get("email");
      if (emailParam) {
        setManualEmail(emailParam);
      }

      const errorDescription =
        urlParams.get("error_description") ||
        hashParams.get("error_description") ||
        urlParams.get("error");
        urlParams.get("error_description") ||
        hashParams.get("error_description") ||
        urlParams.get("error");

      // 2. Direct PKCE code exchange if landed directly with ?code=
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

      // 3. Hash parameters (implicit recovery tokens)
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
        toast.error(decoded, { duration: 6000 });
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
      }, 2000);

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

      toast.success("Password updated successfully! Redirecting to login...");

      // Clear the temporary recovery session so user logs in fresh with new password
      await supabase.auth.signOut();

      setTimeout(() => {
        router.push("/auth/login?reset=success");
      }, 1200);
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
            <span className="text-sm font-semibold">Verifying recovery link...</span>
          </div>
        </div>
      </div>
    );
  }

  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmail.trim() || !manualCode.trim()) {
      toast.error("Please enter both your email address and 6-digit code.");
      return;
    }

    setIsVerifyingManual(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: manualEmail.trim(),
        token: manualCode.trim(),
        type: "recovery",
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data?.session) {
        toast.success("Code verified! Set your new password below.");
        setHasValidSession(true);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to verify code.");
    } finally {
      setIsVerifyingManual(false);
    }
  };

  if (!hasValidSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-gray-100 space-y-6">
          <div className="text-center space-y-3">
            <div className="relative h-16 w-16 mx-auto rounded-full overflow-hidden border-4 border-upsa-gold/20 shadow-lg">
              <Image src="/logo.jpg" alt="Voice of UPSA" fill sizes="64px" className="object-cover" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-upsa-navy">Email Link Expired</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Email security scanners (in Gmail or mobile mail) often open links to scan for safety, which automatically expires single-use links.
              </p>
            </div>
          </div>

          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 text-xs text-amber-900 space-y-1">
            <p className="font-bold">No need to restart!</p>
            <p className="text-gray-600">
              Enter your email and the <strong>6-digit verification code</strong> from your email to reset your password immediately:
            </p>
          </div>

          <form onSubmit={handleManualVerify} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="manualEmail" className="text-xs">Account Email</Label>
              <Input
                id="manualEmail"
                type="email"
                placeholder="name@example.com"
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                className="py-2.5 text-sm"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="manualCode" className="text-xs">6-Digit Code</Label>
              <Input
                id="manualCode"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="123456"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.replace(/\D/g, ""))}
                className="text-center font-mono text-xl tracking-widest font-bold py-2.5"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isVerifyingManual || manualCode.length < 6 || !manualEmail}
              className="w-full bg-upsa-navy text-white hover:bg-upsa-gold hover:text-upsa-navy py-5 font-bold text-sm transition-all"
            >
              {isVerifyingManual ? "Verifying Code..." : "Verify Code & Set Password"}
            </Button>
          </form>

          <div className="pt-2 border-t border-gray-100 flex flex-col gap-2 text-center">
            <Link
              href="/auth/forgot-password"
              className="text-xs font-semibold text-upsa-navy hover:underline py-1"
            >
              Request a Fresh Email Link Instead
            </Link>
            <Link
              href="/auth/login"
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Return to Login
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
                fill sizes="120px"
                className="object-cover"
              />
            </div>
          </Link>
          <h2 className="mt-6 text-3xl font-black text-upsa-navy tracking-tight">
            Update Password
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Enter your new password below.
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
