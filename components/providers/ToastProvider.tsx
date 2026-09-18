"use client";

import { useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";

export function ToastProvider() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash;
    const search = window.location.search;

    if (
      hash.includes("otp_expired") ||
      search.includes("otp_expired") ||
      hash.includes("error_code=otp_expired")
    ) {
      toast.error(
        "Your password reset link has expired or was already used. Please request a new one.",
        { duration: 6000 }
      );

      if (
        !window.location.pathname.startsWith("/auth/forgot-password") &&
        !window.location.pathname.startsWith("/auth/update-password")
      ) {
        window.location.href = "/auth/forgot-password?error=expired";
      }
    }
  }, []);

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "#003366",
          color: "#fff",
          borderRadius: "12px",
          fontWeight: "bold",
        },
        success: {
          iconTheme: {
            primary: "#C9A84C",
            secondary: "#003366",
          },
        },
      }}
    />
  );
}
