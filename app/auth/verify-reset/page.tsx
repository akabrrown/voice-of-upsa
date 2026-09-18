"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

function VerifyResetContent() {
  const [isVerifying, setIsVerifying] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as "recovery" | "email" | "signup";
  const next = searchParams.get("next") || "/auth/update-password";

  const handleVerify = async () => {
    if (!tokenHash) {
      toast.error("Invalid reset link. Missing token.");
      return;
    }

    setIsVerifying(true);
    
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type || "recovery",
      });

      if (error) {
        toast.error(error.message);
        router.push(`/auth/forgot-password?error=expired`);
        return;
      }

      toast.success("Identity verified securely.");
      router.push(next);
    } catch (err: any) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 border border-blue-100 mb-6">
          <ShieldCheck className="h-10 w-10 text-upsa-navy" />
        </div>
        
        <h2 className="text-3xl font-black text-upsa-navy tracking-tight">
          Secure Reset
        </h2>
        
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          To protect your account from automated email scanners, please click the button below to securely verify your password reset request.
        </p>

        <Button
          onClick={handleVerify}
          disabled={isVerifying || !tokenHash}
          className="w-full bg-upsa-navy text-white hover:bg-upsa-gold hover:text-upsa-navy py-6 text-lg font-bold transition-all shadow-md hover:shadow-lg"
        >
          {isVerifying ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Verifying...
            </>
          ) : (
            "Confirm Password Reset"
          )}
        </Button>
      </div>
    </div>
  );
}

export default function VerifyResetPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="h-8 w-8 animate-spin text-upsa-navy" /></div>}>
      <VerifyResetContent />
    </Suspense>
  );
}
