"use client";

import React, { useState } from "react";
import Image from "next/image";
import { User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  variant?: "navy" | "subtle" | "gold";
  fallbackType?: "initials" | "icon" | "auto";
}

const sizeClasses: Record<NonNullable<UserAvatarProps["size"]>, { container: string; text: string; icon: string; imageSizes: string }> = {
  xs: {
    container: "h-6 w-6",
    text: "text-[10px]",
    icon: "h-3.5 w-3.5",
    imageSizes: "24px",
  },
  sm: {
    container: "h-8 w-8",
    text: "text-xs font-bold",
    icon: "h-4 w-4",
    imageSizes: "32px",
  },
  md: {
    container: "h-10 w-10",
    text: "text-sm font-bold",
    icon: "h-5 w-5",
    imageSizes: "40px",
  },
  lg: {
    container: "h-12 w-12",
    text: "text-base font-bold",
    icon: "h-6 w-6",
    imageSizes: "48px",
  },
  xl: {
    container: "h-16 w-16",
    text: "text-xl font-bold",
    icon: "h-8 w-8",
    imageSizes: "64px",
  },
  "2xl": {
    container: "h-20 w-20",
    text: "text-2xl font-bold",
    icon: "h-10 w-10",
    imageSizes: "80px",
  },
};

const variantClasses: Record<NonNullable<UserAvatarProps["variant"]>, string> = {
  navy: "bg-upsa-navy text-white",
  subtle: "bg-gray-100 text-upsa-navy border border-gray-200",
  gold: "bg-upsa-gold/15 text-upsa-navy border border-upsa-gold/30",
};

/**
 * Extracts clean 1-2 letter initials from a display name.
 */
function getInitials(name?: string | null): string {
  if (!name || !name.trim()) return "";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Pure, reliable user avatar component.
 * Renders real uploaded user image if valid, otherwise displays clean name initials or default icon.
 * Zero dependency on external fake avatar services.
 */
export function UserAvatar({
  src,
  name,
  size = "md",
  className,
  variant = "navy",
  fallbackType = "auto",
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);

  // Treat pravatar or empty strings as no image
  const cleanSrc = src && !src.includes("pravatar.cc") && src.trim() !== "" ? src : null;
  const hasValidImage = Boolean(cleanSrc) && !imageError;
  const initials = getInitials(name);

  const sizeCfg = sizeClasses[size];
  const colorCfg = variantClasses[variant];

  if (hasValidImage && cleanSrc) {
    return (
      <div
        className={cn(
          "relative rounded-full overflow-hidden shrink-0 border border-gray-200 bg-gray-50",
          sizeCfg.container,
          className
        )}
      >
        <Image
          src={cleanSrc}
          alt={name || "User Avatar"}
          fill
          sizes={sizeCfg.imageSizes}
          className="object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // Render initials or default user icon
  const showInitials = (fallbackType === "initials" || fallbackType === "auto") && initials.length > 0;

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center select-none shrink-0 tracking-wider",
        sizeCfg.container,
        sizeCfg.text,
        colorCfg,
        className
      )}
      aria-label={name || "User Avatar"}
    >
      {showInitials ? (
        <span>{initials}</span>
      ) : (
        <UserIcon className={cn(sizeCfg.icon, "opacity-80")} />
      )}
    </div>
  );
}
