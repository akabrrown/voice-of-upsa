"use client";

import { ShieldCheck, ShieldAlert, Sparkles, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SellerStatus } from "@/lib/marketplace/types";
import { cn } from "@/lib/utils";

interface SellerBadgeProps {
  status: SellerStatus;
  className?: string;
  showText?: boolean;
}

export function SellerBadge({ status, className, showText = true }: SellerBadgeProps) {
  if (status === 'none' || status === 'rejected' || status === 'suspended') {
    return null;
  }

  const config = {
    pending_verification: {
      icon: ShieldAlert,
      text: "Verification Pending",
      classes: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:text-yellow-400",
    },
    verified: {
      icon: UserCheck,
      text: "Verified Seller",
      classes: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
    },
    trusted: {
      icon: Sparkles,
      text: "Trusted Partner",
      classes: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400",
    },
  };

  const current = config[status];
  const Icon = current.icon;

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 backdrop-blur-sm transition-colors", 
        current.classes,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {showText && <span className="font-medium">{current.text}</span>}
    </Badge>
  );
}
