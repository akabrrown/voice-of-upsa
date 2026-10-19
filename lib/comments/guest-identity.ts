/**
 * Guest Identity & Security Utility for Voice of UPSA Commenting System
 *
 * Implements:
 * 1. Device-locked persistent identity for non-registered readers
 * 2. Deterministic discriminators (#XXXX) to uniquely distinguish users with identical names
 * 3. Security guards against staff/admin impersonation
 * 4. Structured metadata envelope for robust storage and backward compatibility
 */

export interface GuestProfile {
  guestId: string;
  guestName: string;
  guestBadge: string;
  avatarColor: string;
  createdAt: number;
}

export interface ParsedComment {
  isGuest: boolean;
  authorName: string;
  guestId?: string | null;
  guestBadge?: string | null;
  avatarColor?: string;
  cleanContent: string;
}

const STORAGE_KEY_GUEST_ID = "vou_guest_author_id";
const STORAGE_KEY_GUEST_NAME = "vou_guest_author_name";
const STORAGE_KEY_GUEST_BADGE = "vou_guest_author_badge";
const STORAGE_KEY_GUEST_COLOR = "vou_guest_author_color";

export const RESERVED_STAFF_NAMES = [
  "admin",
  "administrator",
  "moderator",
  "editor",
  "upsa staff",
  "voice of upsa",
  "upsa official",
  "editorial team",
  "system",
  "verified staff",
  "head of content",
];

// Curated WCAG-compliant distinctive avatar gradient/color pairings
export const GUEST_AVATAR_PALETTE = [
  { bg: "bg-emerald-600 dark:bg-emerald-500", text: "text-white", border: "border-emerald-700/30", name: "Emerald" },
  { bg: "bg-blue-600 dark:bg-blue-500", text: "text-white", border: "border-blue-700/30", name: "Sapphire" },
  { bg: "bg-amber-600 dark:bg-amber-500", text: "text-white", border: "border-amber-700/30", name: "Amber" },
  { bg: "bg-violet-600 dark:bg-violet-500", text: "text-white", border: "border-violet-700/30", name: "Violet" },
  { bg: "bg-rose-600 dark:bg-rose-500", text: "text-white", border: "border-rose-700/30", name: "Rose" },
  { bg: "bg-teal-600 dark:bg-teal-500", text: "text-white", border: "border-teal-700/30", name: "Teal" },
  { bg: "bg-indigo-600 dark:bg-indigo-500", text: "text-white", border: "border-indigo-700/30", name: "Indigo" },
  { bg: "bg-cyan-600 dark:bg-cyan-500", text: "text-white", border: "border-cyan-700/30", name: "Cyan" },
];

/**
 * Checks if a provided display name violates staff impersonation rules
 */
export function isReservedName(name: string): boolean {
  if (!name) return false;
  const normalized = name.trim().toLowerCase();
  return RESERVED_STAFF_NAMES.some(
    (reserved) => normalized === reserved || normalized.startsWith(reserved + " ") || normalized.endsWith(" " + reserved)
  );
}

/**
 * Generates a deterministic 4-character discriminator (#XXXX) from a guestId
 * so that two guests named "Kofi" are uniquely identifiable (e.g. Kofi #4921 vs Kofi #8142)
 */
export function generateGuestDiscriminator(guestId: string): string {
  if (!guestId) return "#0001";
  let hash = 0;
  for (let i = 0; i < guestId.length; i++) {
    hash = (hash << 5) - hash + guestId.charCodeAt(i);
    hash |= 0;
  }
  const positive = Math.abs(hash);
  const num = (positive % 9000) + 1000; // 1000 - 9999
  return `#${num}`;
}

/**
 * Selects a deterministic color preset from the avatar palette based on guestId
 */
export function getGuestAvatarColor(guestId: string) {
  if (!guestId) return GUEST_AVATAR_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < guestId.length; i++) {
    hash = (hash << 5) - hash + guestId.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % GUEST_AVATAR_PALETTE.length;
  return GUEST_AVATAR_PALETTE[index];
}

function safeUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch {
      // Fall through to fallback
    }
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Reads or initializes the persistent device identity from localStorage (browser-only)
 */
export function getStoredGuestProfile(): GuestProfile | null {
  if (typeof window === "undefined") return null;

  try {
    let guestId = localStorage.getItem(STORAGE_KEY_GUEST_ID);
    if (!guestId) {
      guestId = safeUUID();
      localStorage.setItem(STORAGE_KEY_GUEST_ID, guestId);
    }

    const guestName = localStorage.getItem(STORAGE_KEY_GUEST_NAME);
    if (!guestName) {
      return null; // Device initialized, but user hasn't typed a name yet
    }

    const guestBadge =
      localStorage.getItem(STORAGE_KEY_GUEST_BADGE) || generateGuestDiscriminator(guestId);
    const colorObj = getGuestAvatarColor(guestId);

    return {
      guestId,
      guestName,
      guestBadge,
      avatarColor: colorObj.bg,
      createdAt: Date.now(),
    };
  } catch (err) {
    console.error("Failed to read guest identity from storage:", err);
    return null;
  }
}

/**
 * Gets or creates the device's guest UUID without requiring a name yet
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "server-placeholder-id";
  try {
    let guestId = localStorage.getItem(STORAGE_KEY_GUEST_ID);
    if (!guestId) {
      guestId = safeUUID();
      localStorage.setItem(STORAGE_KEY_GUEST_ID, guestId);
    }
    return guestId;
  } catch {
    return "ephemeral-" + Math.random().toString(36).substring(2, 9);
  }
}

/**
 * Locks and persists the guest author's name on this device
 */
export function lockGuestProfile(name: string): GuestProfile {
  if (typeof window === "undefined") {
    throw new Error("Cannot lock guest profile outside browser context");
  }

  const cleanName = name.trim().slice(0, 50);
  if (!cleanName || cleanName.length < 2) {
    throw new Error("Display name must be at least 2 characters long.");
  }

  if (isReservedName(cleanName)) {
    throw new Error("This name is reserved for official staff and editors. Please choose another display name.");
  }

  const guestId = getOrCreateDeviceId();
  const guestBadge = generateGuestDiscriminator(guestId);
  const colorObj = getGuestAvatarColor(guestId);

  try {
    localStorage.setItem(STORAGE_KEY_GUEST_ID, guestId);
    localStorage.setItem(STORAGE_KEY_GUEST_NAME, cleanName);
    localStorage.setItem(STORAGE_KEY_GUEST_BADGE, guestBadge);
    localStorage.setItem(STORAGE_KEY_GUEST_COLOR, colorObj.bg);
  } catch (err) {
    console.error("Failed to persist guest profile to localStorage:", err);
  }

  return {
    guestId,
    guestName: cleanName,
    guestBadge,
    avatarColor: colorObj.bg,
    createdAt: Date.now(),
  };
}

/**
 * Formats a guest comment payload with a secure metadata envelope
 */
export const GUEST_ENVELOPE_PREFIX = "<!--vou-guest:";
export const GUEST_ENVELOPE_SUFFIX = "-->";

export function formatGuestCommentContent(
  text: string,
  guest: { name: string; guestId: string; badge: string }
): string {
  const metadata = {
    n: guest.name.trim().slice(0, 50),
    g: guest.guestId,
    b: guest.badge,
  };
  const jsonMeta = JSON.stringify(metadata);
  return `${GUEST_ENVELOPE_PREFIX}${jsonMeta}${GUEST_ENVELOPE_SUFFIX}\n${text.trim()}`;
}

/**
 * Parses raw comment content to extract guest identity metadata (if present)
 */
export function parseCommentContent(rawContent: string): ParsedComment {
  if (!rawContent || typeof rawContent !== "string") {
    return {
      isGuest: false,
      authorName: "Editorial Reader",
      cleanContent: "",
    };
  }

  if (rawContent.startsWith(GUEST_ENVELOPE_PREFIX)) {
    const endIdx = rawContent.indexOf(GUEST_ENVELOPE_SUFFIX);
    if (endIdx !== -1) {
      const jsonStr = rawContent.slice(GUEST_ENVELOPE_PREFIX.length, endIdx);
      const cleanContent = rawContent.slice(endIdx + GUEST_ENVELOPE_SUFFIX.length).trim();
      try {
        const meta = JSON.parse(jsonStr);
        const guestId = meta.g || "";
        const badge = meta.b || generateGuestDiscriminator(guestId);
        const color = getGuestAvatarColor(guestId).bg;

        return {
          isGuest: true,
          authorName: meta.n || "Guest Reader",
          guestId: guestId || null,
          guestBadge: badge,
          avatarColor: color,
          cleanContent,
        };
      } catch (e) {
        // Fallback to displaying content cleanly if parsing fails
        return {
          isGuest: true,
          authorName: "Guest Reader",
          cleanContent,
        };
      }
    }
  }

  // Regular comment posted by registered user
  return {
    isGuest: false,
    authorName: "Editorial Reader",
    cleanContent: rawContent,
  };
}
