"use client";

import React, { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InstallPWA() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if the app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === "accepted") {
      setInstallPrompt(null);
    }
  };

  // Only show the button if the prompt is available and the app isn't already installed
  if (!installPrompt || isInstalled) {
    return null;
  }

  return (
    <Button
      onClick={handleInstallClick}
      variant="outline"
      size="sm"
      className="hidden sm:flex items-center gap-1.5 text-xs font-bold border-upsa-gold/40 text-upsa-gold hover:bg-upsa-gold hover:text-upsa-navy transition-all px-3"
    >
      <Download className="h-3.5 w-3.5" />
      Install App
    </Button>
  );
}
