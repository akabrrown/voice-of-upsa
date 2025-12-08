import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { data: locations, error } = await supabase
        .from('ad_locations')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('display_name', { ascending: true });

      if (error) {
        return res.status(500).json({ error: 'Failed to fetch locations' });
      }

      return res.status(200).json({ locations: locations || [] });
    }

    if (req.method === 'PUT') {
      const { locationId, base_price, is_active } = req.body;

      const updateData: Record<string, unknown> = {};
      if (base_price !== undefined) updateData.base_price = base_price;
      if (is_active !== undefined) updateData.is_active = is_active;

      const { data, error } = await supabase
        .from('ad_locations')
        .update(updateData)
        .eq('id', locationId)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: 'Failed to update location' });
      }

      return res.status(200).json({ location: data });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default handler;
