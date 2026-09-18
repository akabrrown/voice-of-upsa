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
import { ArrowLeft, Mail } from "lucide-react";
import { toast } from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { getAuthRedirectUrl } from "@/lib/auth/urls";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [hasExpiredNotice, setHasExpiredNotice] = useState(false);
  const router = useRouter();
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
      toast.success("Reset link and verification code sent to your email!");
    } catch (error: any) {
      toast.error(error?.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      toast.error("Please enter the 6-digit verification code.");
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: submittedEmail,
        token: otpCode.trim(),
        type: "recovery",
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.session) {
        toast.success("Code verified! Set your new password.");
        router.push("/auth/update-password");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to verify code.");
    } finally {
      setIsVerifyingOtp(false);
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
                fill sizes="120px"
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
              ? "Check your email for a password reset link." 
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
          <div className="mt-8 space-y-6 animate-in fade-in duration-300">
            <div className="bg-blue-50 border border-blue-200 text-blue-900 p-4 rounded-xl text-xs space-y-1">
              <p className="font-bold">Email sent to {submittedEmail}</p>
              <p className="text-gray-600">
                You can tap the link in the email, or enter the <strong>6-digit verification code</strong> from the email below:
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="otpCode">6-Digit Verification Code</Label>
                <Input
                  id="otpCode"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  className="text-center font-mono text-2xl tracking-widest py-3 font-bold"
                  autoFocus
                />
                <p className="text-[11px] text-gray-500 text-center mt-1">
                  Entering the code directly avoids link expiration issues from email scanners
                </p>
              </div>

              <Button
                type="submit"
                disabled={isVerifyingOtp || otpCode.length < 6}
                className="w-full bg-upsa-navy text-white hover:bg-upsa-gold hover:text-upsa-navy py-6 text-base font-bold transition-all"
              >
                {isVerifyingOtp ? "Verifying Code..." : "Verify Code & Update Password"}
              </Button>
            </form>

            <div className="pt-2 flex flex-col gap-2">
              <Button
                type="button"
                onClick={() => {
                  setIsSubmitted(false);
                  setOtpCode("");
                }}
                variant="outline"
                className="w-full py-4 text-xs font-semibold text-gray-600"
              >
                Try another email or resend
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
