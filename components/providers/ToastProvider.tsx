"use client";

import { useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "next-themes";

export function ToastProvider() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash;
    const search = window.location.search;

    if (
      hash.includes("otp_expired") ||
      search.includes("otp_expired") ||
      hash.includes("error_code=otp_expired")
    ) {
      // Clear error hash/search immediately to prevent persistent popup loops on refresh
      try {
        window.history.replaceState(null, "", window.location.pathname);
      } catch {
        // ignore
      }

      toast.error(
        "Your password reset link has expired or was already used. Please request a new one.",
        { duration: 6000 }
      );

      if (
        !window.location.pathname.startsWith("/auth/forgot-password") &&
        !window.location.pathname.startsWith("/auth/update-password")
      ) {
        window.location.replace("/auth/forgot-password?error=expired");
      }
    }
  }, []);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#0C1729",
            color: "#fff",
            borderRadius: "12px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            fontWeight: "bold",
          },
          success: {
            iconTheme: {
              primary: "#D4AF37",
              secondary: "#0C1729",
            },
          },
        }}
      />
      <SonnerToaster richColors position="top-right" theme={resolvedTheme === "dark" ? "dark" : "light"} />
    </>
  );
}
