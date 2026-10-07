import 'server-only';
import webpush from 'web-push';
import { getAdminClient } from '../supabase/admin';

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:support@voiceofupsa.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  imageUrl?: string;
}

interface SubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * Core delivery function. Attempts delivery to all provided subscriptions,
 * catching 404/410 errors and deleting the dead subscriptions automatically.
 */
async function deliver(subscriptions: SubscriptionRow[], payload: PushPayload) {
  const supabase = getAdminClient();
  const deadSubscriptionIds: string[] = [];

  const stringifiedPayload = JSON.stringify(payload);

  const deliveryPromises = subscriptions.map(async (sub) => {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        stringifiedPayload
      );
    } catch (error: any) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        deadSubscriptionIds.push(sub.id);
      } else {
        console.error('Push delivery failed for subscription:', sub.id, error);
      }
    }
  });

  await Promise.allSettled(deliveryPromises);

  if (deadSubscriptionIds.length > 0) {
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .in('id', deadSubscriptionIds);
    if (error) {
      console.error('Failed to cleanup dead subscriptions:', error);
    }
  }
}

/**
 * Sends a push notification to every subscriber of a given topic.
 */
export async function sendPushToTopic(topic: string, payload: PushPayload) {
  const supabase = getAdminClient();
  const { data: topics, error } = await supabase
    .from('push_subscription_topics')
    .select('subscription_id')
    .eq('topic', topic);

  if (error || !topics || topics.length === 0) return;

  const subIds = topics.map((t: any) => t.subscription_id);

  const { data: subs, error: subsError } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .in('id', subIds);

  if (subsError || !subs || subs.length === 0) return;

  await deliver(subs, payload);
}

/**
 * Sends a push notification to all devices a specific user has subscribed from.
 */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  const supabase = getAdminClient();
  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId);

  if (error || !subs || subs.length === 0) return;

  await deliver(subs, payload);
}
