import { getSiteUrl } from "@/lib/auth/urls";

export interface OgImageResult {
  url: string;
  secureUrl: string;
  width: number;
  height: number;
  alt: string;
  type: string;
}

export function getOptimizedOgImage(
  rawUrl?: string | null,
  altText: string = "Voice of UPSA",
  customSiteUrl?: string
): OgImageResult {
  const siteUrl = customSiteUrl?.replace(/\/$/, "") || getSiteUrl();
  const defaultFallbackUrl = `${siteUrl}/og-image.jpg`;

  if (!rawUrl || typeof rawUrl !== "string" || rawUrl.trim() === "") {
    return {
      url: defaultFallbackUrl,
      secureUrl: defaultFallbackUrl,
      width: 1200,
      height: 630,
      alt: altText,
      type: "image/jpeg",
    };
  }

  let finalUrl = rawUrl.trim();

  if (finalUrl.startsWith("/")) {
    finalUrl = `${siteUrl}${finalUrl}`;
  }

  if (finalUrl.startsWith("http://")) {
    finalUrl = finalUrl.replace("http://", "https://");
  }

  if (finalUrl.includes("res.cloudinary.com") && finalUrl.includes("/image/upload/")) {
    try {
      const uploadToken = "/image/upload/";
      const uploadIdx = finalUrl.indexOf(uploadToken);
      const prefix = finalUrl.substring(0, uploadIdx + uploadToken.length);
      let rest = finalUrl.substring(uploadIdx + uploadToken.length);

      const hasTransformRegex = /^(?:(?:[a-z]_[a-zA-Z0-9_:,.-]+,?)+\/)/;
      rest = rest.replace(hasTransformRegex, "");

      finalUrl = `${prefix}c_fill,g_auto,w_1200,h_630,q_auto:good,f_jpg/${rest}`;
      return {
        url: finalUrl,
        secureUrl: finalUrl,
        width: 1200,
        height: 630,
        alt: altText,
        type: "image/jpeg",
      };
    } catch {
      // ignore
    }
  }

  if (finalUrl.includes("images.unsplash.com")) {
    try {
      const parsed = new URL(finalUrl);
      parsed.searchParams.set("w", "1200");
      parsed.searchParams.set("h", "630");
      parsed.searchParams.set("fit", "crop");
      parsed.searchParams.set("q", "80");
      parsed.searchParams.set("fm", "jpg");
      parsed.searchParams.set("auto", "format");
      finalUrl = parsed.toString();
      return {
        url: finalUrl,
        secureUrl: finalUrl,
        width: 1200,
        height: 630,
        alt: altText,
        type: "image/jpeg",
      };
    } catch {
      // ignore
    }
  }

  if (finalUrl.includes("supabase.co/storage/v1/object/public/")) {
    const renderUrl = finalUrl.replace(
      "/storage/v1/object/public/",
      "/storage/v1/render/image/public/"
    );
    finalUrl = `${renderUrl}?width=1200&height=630&resize=contain&quality=80`;
    return {
      url: finalUrl,
      secureUrl: finalUrl,
      width: 1200,
      height: 630,
      alt: altText,
      type: "image/jpeg",
    };
  }

  const lower = finalUrl.toLowerCase().split("?")[0];
  let mimeType = "image/jpeg";
  if (lower.endsWith(".png")) {
    mimeType = "image/png";
  } else if (lower.endsWith(".webp")) {
    mimeType = "image/webp";
  } else if (lower.endsWith(".gif")) {
    mimeType = "image/gif";
  }

  return {
    url: finalUrl,
    secureUrl: finalUrl,
    width: 1200,
    height: 630,
    alt: altText,
    type: mimeType,
  };
}
