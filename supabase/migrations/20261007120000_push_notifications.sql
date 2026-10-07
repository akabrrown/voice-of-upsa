CREATE TABLE public.push_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    endpoint text UNIQUE NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    user_agent text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE public.push_subscription_topics (
    subscription_id uuid REFERENCES public.push_subscriptions(id) ON DELETE CASCADE,
    topic text NOT NULL,
    PRIMARY KEY (subscription_id, topic)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscription_topics ENABLE ROW LEVEL SECURITY;

-- Policies for push_subscriptions
CREATE POLICY "Users can manage their own subscriptions" ON public.push_subscriptions
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policies for push_subscription_topics
CREATE POLICY "Users can manage their own subscription topics" ON public.push_subscription_topics
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.push_subscriptions
            WHERE id = push_subscription_topics.subscription_id
            AND user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.push_subscriptions
            WHERE id = push_subscription_topics.subscription_id
            AND user_id = auth.uid()
        )
    );
