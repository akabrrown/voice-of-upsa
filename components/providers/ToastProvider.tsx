"use client";

import { Toaster } from "react-hot-toast";

export function ToastProvider() {
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
