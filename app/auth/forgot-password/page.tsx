"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, ForgotPasswordFormValues } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { getAuthRedirectUrl } from "@/lib/auth/urls";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [hasExpiredNotice, setHasExpiredNotice] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("error") === "expired") {
        setHasExpiredNotice(true);
      }
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);

    try {
      const redirectUrl = getAuthRedirectUrl("/auth/callback?next=/auth/update-password");
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setSubmittedEmail(data.email);
      setIsSubmitted(true);
      toast.success("Password reset link sent to your email!");
    } catch (error: any) {
      toast.error(error?.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black tracking-widest text-upsa-gold uppercase leading-none">Voice of</span>
              <span className="text-2xl font-black tracking-tight text-upsa-navy uppercase leading-tight">UPSA</span>
            </div>
          </Link>
          <h2 className="mt-6 text-3xl font-black text-upsa-navy tracking-tight">
            Reset Password
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {isSubmitted
              ? "We've sent a password reset link to your email."
              : "Enter your email address and we'll send you a link to reset your password."}
          </p>
        </div>

        {hasExpiredNotice && !isSubmitted && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-xl text-xs flex items-start space-x-2 animate-in fade-in duration-200">
            <span className="font-bold shrink-0">Note:</span>
            <span>Your previous reset link has expired or has already been used. Enter your email below to receive a fresh link.</span>
          </div>
        )}

        {!isSubmitted ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  {...register("email")}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-upsa-navy text-white hover:bg-upsa-gold hover:text-upsa-navy py-6 text-lg font-bold transition-all"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : (
                <>
                  Send Reset Link
                  <Mail className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>
        ) : (
          <div className="mt-8 space-y-6 text-center animate-in fade-in duration-300">
            <div className="h-16 w-16 mx-auto rounded-full bg-green-50 text-green-600 flex items-center justify-center border border-green-200">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-upsa-navy">Check your inbox</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                We sent a password reset link to <strong className="text-gray-700">{submittedEmail}</strong>. Click the link in the email to set your new password.
              </p>
            </div>
            <div className="pt-2">
              <Button
                type="button"
                onClick={() => setIsSubmitted(false)}
                variant="outline"
                className="w-full py-5 text-sm font-semibold text-gray-700"
              >
                Send to another email
              </Button>
            </div>
          </div>
        )}

        <div className="text-center pt-4">
          <p className="text-sm text-gray-500">
            Remember your password?{" "}
            <Link href="/auth/login" className="font-bold text-upsa-gold hover:underline">
              <ArrowLeft className="inline-block mr-1 h-4 w-4" />
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
