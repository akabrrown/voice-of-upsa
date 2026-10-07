import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const { subscription, topics = [], userId = null } = await req.json();

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: 'Invalid subscription payload' }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Upsert subscription
    const { data: subData, error: subError } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id: userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          user_agent: req.headers.get('user-agent'),
        },
        { onConflict: 'endpoint' }
      )
      .select('id')
      .single();

    if (subError || !subData) {
      console.error('Failed to save subscription:', subError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Insert topics
    if (topics.length > 0) {
      const topicRows = topics.map((t: string) => ({
        subscription_id: subData.id,
        topic: t,
      }));

      // Delete old topics to cleanly apply new ones, or just upsert
      await supabase
        .from('push_subscription_topics')
        .delete()
        .eq('subscription_id', subData.id);

      const { error: topicError } = await supabase
        .from('push_subscription_topics')
        .insert(topicRows);

      if (topicError) {
        console.error('Failed to save topics:', topicError);
        return NextResponse.json({ error: 'Database error on topics' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, subscriptionId: subData.id });
  } catch (err: any) {
    console.error('Subscribe error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
