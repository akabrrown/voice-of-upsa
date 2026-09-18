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
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      // 1. If code query param is present on direct landing, exchange it
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        if (code) {
          try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (!error && data.session) {
              if (isMounted) setIsVerifying(false);
              return;
            }
          } catch (e) {
            console.warn("Client exchange code check:", e);
          }
        }
      }

      // 2. Check if a valid session already exists
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        if (isMounted) setIsVerifying(false);
        return;
      }

      // 3. Listen for auth state change
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session || event === "PASSWORD_RECOVERY") {
          if (isMounted) setIsVerifying(false);
        }
      });

      // 4. Grace period before concluding the link is invalid
      const timer = setTimeout(async () => {
        if (isMounted) {
          const { data: { session: finalCheck } } = await supabase.auth.getSession();
          if (!finalCheck) {
            toast.error("Invalid or expired password reset link. Please request a new one.");
            router.push("/auth/forgot-password");
          } else {
            setIsVerifying(false);
          }
        }
      }, 2000);

      return () => {
        subscription.unsubscribe();
        clearTimeout(timer);
      };
    };

    const cleanupPromise = verifySession();
    return () => {
      isMounted = false;
      cleanupPromise.then((cleanup) => cleanup && cleanup());
    };
  }, [router, supabase]);

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

      toast.success("Password updated successfully!");
      router.push("/dashboard");
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
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
