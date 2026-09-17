"use client";

import React from "react";
import Link from "next/link";
import { Facebook, Twitter, InstagramSolid, Linkedin, Youtube, Tiktok } from "@/components/shared/icons";
import styles from "./SocialMediaButtons.module.css";

export interface SocialLink {
  name: string;
  url: string;
  platform: "instagram" | "youtube" | "twitter" | "facebook" | "tiktok" | "linkedin";
  icon: React.ReactNode;
}

export const VOU_SOCIAL_HANDLES: SocialLink[] = [
  {
    name: "Facebook",
    url: "https://facebook.com/voiceofupsa",
    platform: "facebook",
    icon: <Facebook size={20} className="w-5 h-5 text-white" />,
  },
  {
    name: "Twitter",
    url: "https://twitter.com/voiceofupsa",
    platform: "twitter",
    icon: <Twitter size={20} className="w-5 h-5 text-white" />,
  },
  {
    name: "Instagram",
    url: "https://instagram.com/voiceofupsa",
    platform: "instagram",
    icon: <InstagramSolid size={20} className="w-5 h-5 text-white" />,
  },
  {
    name: "YouTube",
    url: "https://youtube.com/@voiceofupsa",
    platform: "youtube",
    icon: <Youtube size={20} className="w-5 h-5 text-white" />,
  },
  {
    name: "TikTok",
    url: "https://tiktok.com/@voice_of_upsa",
    platform: "tiktok",
    icon: <Tiktok size={20} className="w-5 h-5 text-white" />,
  },
  {
    name: "LinkedIn",
    url: "https://linkedin.com/company/voiceofupsa",
    platform: "linkedin",
    icon: <Linkedin size={20} className="w-5 h-5 text-white" />,
  },
];

interface SocialMediaButtonsProps {
  handles?: SocialLink[];
  className?: string;
}

export function SocialMediaButtons({
  handles = VOU_SOCIAL_HANDLES,
  className = "",
}: SocialMediaButtonsProps) {
  return (
    <div className={`${styles.container} ${className}`}>
      {handles.map((item) => (
        <Link
          key={item.platform}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Follow Voice of UPSA on ${item.name}`}
          className={`${styles.btn} ${styles[item.platform]}`}
        >
          <span className={styles.svgIcon}>{item.icon}</span>
          <span className={styles.text}>{item.name}</span>
        </Link>
      ))}
    </div>
  );
}

export default SocialMediaButtons;
