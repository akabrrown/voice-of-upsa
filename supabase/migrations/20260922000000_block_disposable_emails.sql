-- Migration: Block Disposable and Temporary Email Signups
-- Timestamp: 20260922000000
-- Target Project: Voice of UPSA (pilncldxyzijalbuvdlh)

SET search_path = public, auth;

-- 1. Create table for known disposable and temporary email domains
CREATE TABLE IF NOT EXISTS public.disposable_email_domains (
    domain TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast O(1) lookups
CREATE INDEX IF NOT EXISTS idx_disposable_email_domains_domain ON public.disposable_email_domains(domain);

-- 2. Populate base list of common temporary/throwaway email providers
INSERT INTO public.disposable_email_domains (domain)
VALUES
    ('mailinator.com'),
    ('10minutemail.com'),
    ('10minutemail.net'),
    ('10minutemail.co.uk'),
    ('10mail.org'),
    ('tempmail.com'),
    ('temp-mail.org'),
    ('temp-mail.io'),
    ('tempmail.net'),
    ('tempmail.ninja'),
    ('guerrillamail.com'),
    ('guerrillamail.biz'),
    ('guerrillamail.org'),
    ('guerrillamail.info'),
    ('guerrillamailblock.com'),
    ('sharklasers.com'),
    ('grr.la'),
    ('pokemail.net'),
    ('spam4.me'),
    ('yopmail.com'),
    ('yopmail.fr'),
    ('yopmail.net'),
    ('trashmail.com'),
    ('trashmail.net'),
    ('trashmail.org'),
    ('trashmail.me'),
    ('dispostable.com'),
    ('getairmail.com'),
    ('burnermail.io'),
    ('throwawaymail.com'),
    ('throwawaymail.net'),
    ('fakeinbox.com'),
    ('fakemail.net'),
    ('emailondeck.com'),
    ('generator.email'),
    ('mytemp.email'),
    ('mohmal.com'),
    ('inboxkitten.com'),
    ('crazymailing.com'),
    ('maildrop.cc'),
    ('mailcatch.com'),
    ('mailnull.com'),
    ('nada.ltd'),
    ('getnada.com'),
    ('harakirimail.com'),
    ('dropmail.me'),
    ('inboxbear.com'),
    ('chacuo.net'),
    ('disposablemail.com')
ON CONFLICT (domain) DO NOTHING;

-- Enable RLS on the table (readable by all, manageable by admins)
ALTER TABLE public.disposable_email_domains ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view disposable domains list" ON public.disposable_email_domains;
CREATE POLICY "Public can view disposable domains list" 
    ON public.disposable_email_domains FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Admins can manage disposable domains" ON public.disposable_email_domains;
CREATE POLICY "Admins can manage disposable domains" 
    ON public.disposable_email_domains FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 3. Database Function to check email on auth.users before signup
CREATE OR REPLACE FUNCTION public.check_disposable_email()
RETURNS TRIGGER AS $$
DECLARE
    user_email TEXT;
    email_domain TEXT;
    parent_domain TEXT;
BEGIN
    user_email := lower(trim(NEW.email));
    
    -- Extract domain part
    email_domain := split_part(user_email, '@', 2);
    
    IF email_domain IS NULL OR email_domain = '' THEN
        RAISE EXCEPTION 'A valid email address is required.';
    END IF;

    -- Check exact match in disposable domains table
    IF EXISTS (
        SELECT 1 FROM public.disposable_email_domains WHERE domain = email_domain
    ) THEN
        RAISE EXCEPTION 'Disposable and temporary email addresses are not permitted. Please use a permanent email address.';
    END IF;

    -- Check parent domain if subdomain is used (e.g., test.mailinator.com -> mailinator.com)
    parent_domain := substring(email_domain from '[^.]+\.[^.]+$');
    IF parent_domain IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.disposable_email_domains WHERE domain = parent_domain
    ) THEN
        RAISE EXCEPTION 'Disposable and temporary email addresses are not permitted. Please use a permanent email address.';
    END IF;

    -- Pattern matching on common temporary email service keywords
    IF email_domain ~* '(temp.*mail|dispos.*mail|throw.*away.*mail|fake.*inbox|trash.*mail|sharklasers|guerrilla.*mail|10.*minute.*mail|yopmail|mailinator|burnermail|inboxkitten|mohmal|generator.*email)' THEN
        RAISE EXCEPTION 'Disposable and temporary email addresses are not permitted. Please use a permanent email address.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Attach trigger on auth.users BEFORE INSERT
DROP TRIGGER IF EXISTS block_disposable_emails_trigger ON auth.users;
CREATE TRIGGER block_disposable_emails_trigger
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.check_disposable_email();
