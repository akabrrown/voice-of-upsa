/**
 * Image optimization utilities for Voice of UPSA.
 * Injects Cloudinary auto-format (f_auto) and auto-quality (q_auto) parameters
 * to reduce bandwidth consumption and server CPU re-encoding overhead.
 */

interface CloudinaryTransformOptions {
  width?: number;
  height?: number;
  crop?: "fill" | "fit" | "limit" | "thumb" | "scale";
  quality?: "auto" | "auto:good" | "auto:eco" | "auto:low" | number;
}

export function getOptimizedImageUrl(
  url?: string | null,
  options: CloudinaryTransformOptions = {}
): string {
  if (!url || typeof url !== "string") {
    return "";
  }

  const trimmed = url.trim();
  if (!trimmed.includes("res.cloudinary.com") || !trimmed.includes("/image/upload/")) {
    return trimmed;
  }

  try {
    const uploadToken = "/image/upload/";
    const uploadIndex = trimmed.indexOf(uploadToken);
    const prefix = trimmed.substring(0, uploadIndex + uploadToken.length);
    let rest = trimmed.substring(uploadIndex + uploadToken.length);

    // Strip existing transformation segment if present
    const transformRegex = /^(?:(?:[a-z]_[a-zA-Z0-9_:,.-]+,?)+\/)/;
    rest = rest.replace(transformRegex, "");

    const transforms: string[] = ["f_auto"];
    transforms.push(`q_${options.quality || "auto"}`);

    if (options.width) transforms.push(`w_${options.width}`);
    if (options.height) transforms.push(`h_${options.height}`);
    if (options.crop) transforms.push(`c_${options.crop}`);

    return `${prefix}${transforms.join(",")}/${rest}`;
  } catch {
    return trimmed;
  }
}
