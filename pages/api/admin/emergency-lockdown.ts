import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity } from '@/lib/security/cms-security';
import { withStrictRateLimit } from '@/lib/security/strict-rate-limits';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Apply ultra-strict rate limiting for emergency operations
    const rateLimitMiddleware = withStrictRateLimit('admin-emergency');
    rateLimitMiddleware(req);
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Emergency: Hide all articles immediately
    const { data, error } = await (await supabaseAdmin as any)
      .from('articles')
      .update({ published: false })
      .neq('id', ''); // Update all rows

    if (error) {
      console.error('Emergency lockdown error:', error);
      return res.status(500).json({ error: 'Failed to execute emergency lockdown' });
    }

    console.log('Emergency lockdown executed - all articles hidden');
    return res.status(200).json({ 
      message: 'Emergency lockdown successful - all articles hidden',
      updatedCount: data ? 'All articles updated' : 'No articles found'
    });

  } catch (error) {
    console.error('Emergency lockdown error:', error);
    return res.status(500).json({ error: 'Emergency lockdown failed' });
  }
}

// Apply enhanced CMS security middleware and error handler
export default withErrorHandler(withCMSSecurity(handler, {
  requirePermission: 'admin:emergency',
  auditAction: 'emergency_lockdown_activated'
}));
