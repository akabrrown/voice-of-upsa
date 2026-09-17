export interface ArticlePushPayload {
  title: string;
  excerpt?: string | null;
  slug: string;
  cover_image_url?: string | null;
}

export interface PushResult {
  success: boolean;
  id?: string;
  recipients?: number;
  error?: string;
  skipped?: boolean;
}

/**
 * Dispatches a Web Push Notification to all subscribed users via OneSignal REST API.
 */
export async function sendArticlePushNotification(
  article: ArticlePushPayload
): Promise<PushResult> {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const restApiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!appId || !restApiKey || appId === "your-onesignal-app-id" || restApiKey === "your-onesignal-rest-api-key") {
    console.warn(
      "[OneSignal] Push notification skipped: NEXT_PUBLIC_ONESIGNAL_APP_ID or ONESIGNAL_REST_API_KEY is not configured."
    );
    return {
      success: false,
      skipped: true,
      error: "OneSignal credentials not configured in environment variables.",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const articleUrl = `${siteUrl.replace(/\/$/, "")}/articles/${article.slug}`;

  // Truncate excerpt if necessary to keep notification clean
  const cleanExcerpt = article.excerpt?.replace(/<[^>]*>/g, "").trim() || "Read the latest news update on Voice of UPSA.";
  const displayBody = cleanExcerpt.length > 150 ? cleanExcerpt.slice(0, 147) + "..." : cleanExcerpt;

  const payload: Record<string, any> = {
    app_id: appId,
    included_segments: ["Total Subscriptions"],
    headings: { en: article.title },
    contents: { en: displayBody },
    url: articleUrl,
  };

  if (article.cover_image_url) {
    payload.chrome_web_image = article.cover_image_url;
    payload.big_picture = article.cover_image_url;
    payload.firefox_icon = article.cover_image_url;
  }

  try {
    const response = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Basic ${restApiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[OneSignal] Push error response:", data);
      return {
        success: false,
        error: data.errors?.[0] || data.message || "Failed to dispatch push notification",
      };
    }

    console.log(`[OneSignal] Push sent successfully! ID: ${data.id}, Recipients: ${data.recipients || 0}`);
    return {
      success: true,
      id: data.id,
      recipients: data.recipients,
    };
  } catch (err: any) {
    console.error("[OneSignal] Network exception during push:", err);
    return {
      success: false,
      error: err.message || "Network error while connecting to OneSignal API",
    };
  }
}
