import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity, CMSUser } from '@/lib/security/cms-security';
import { z } from 'zod';

// Enhanced validation schema for ad location updates
const updateLocationSchema = z.object({
  locationId: z.string().uuid('Invalid location ID format'),
  base_price: z.number().min(0, 'Base price must be non-negative').max(999999, 'Base price too high').optional(),
  is_active: z.boolean().optional()
});

async function handler(req: NextApiRequest, res: NextApiResponse, user: CMSUser) {
  console.log('=== AD-LOCATIONS API HANDLER START ===');
  console.log('AD-LOCATIONS API: Request received', {
    method: req.method,
    url: req.url
  });
  
  try {
    // Log admin ad locations access
    console.log(`Admin ad locations accessed`, {
      adminId: user.id,
      adminEmail: user.email,
      method: req.method,
      timestamp: new Date().toISOString()
    });

    // GET - Fetch ad locations
    if (req.method === 'GET') {
      const { data: locations, error } = await supabaseAdmin
        .from('ad_locations')
        .select('id, display_name, description, location_type, base_price, is_active, sort_order')
        .order('sort_order', { ascending: true })
        .order('display_name', { ascending: true });

      if (error) {
        console.error('Admin ad locations fetch error:', error);
        return res.status(500).json({
          success: false,
          error: {
            code: 'FETCH_FAILED',
            message: 'Failed to fetch ad locations',
            details: process.env.NODE_ENV === 'development' ? error.message : null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Log successful access
      console.log(`Admin ad locations fetched successfully`, {
        adminId: user.id,
        locationCount: locations?.length || 0,
        timestamp: new Date().toISOString()
      });

      return res.status(200).json({
        success: true,
        data: { locations: locations || [] },
        timestamp: new Date().toISOString()
      });
    }

    // PUT - Update ad location
    if (req.method === 'PUT') {
      // Validate input with enhanced schema
      const validatedData = updateLocationSchema.parse(req.body);
      const { locationId, base_price, is_active } = validatedData;

      // Log admin location update action
      console.log(`Admin ad location update initiated`, {
        adminId: user.id,
        adminEmail: user.email,
        locationId,
        updates: { base_price, is_active },
        timestamp: new Date().toISOString()
      });

      // Check if location exists
      const { data: existingLocation, error: fetchError } = await supabaseAdmin
        .from('ad_locations')
        .select('id, display_name, base_price, is_active')
        .eq('id', locationId)
        .single();

      if (fetchError) {
        console.error('Admin ad location fetch error:', fetchError);
        return res.status(404).json({
          success: false,
          error: {
            code: 'LOCATION_NOT_FOUND',
            message: 'Ad location not found',
            details: process.env.NODE_ENV === 'development' ? fetchError.message : null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Build update data
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      };
      
      if (base_price !== undefined) updateData.base_price = base_price;
      if (is_active !== undefined) updateData.is_active = is_active;

      const { data, error } = await supabaseAdmin
        .from('ad_locations')
        .update(updateData)
        .eq('id', locationId)
        .select('id, display_name, base_price, is_active, updated_at')
        .single();

      if (error) {
        console.error('Admin ad location update error:', error);
        return res.status(500).json({
          success: false,
          error: {
            code: 'UPDATE_FAILED',
            message: 'Failed to update ad location',
            details: process.env.NODE_ENV === 'development' ? error.message : null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Log successful update
      console.log(`Admin ad location updated successfully`, {
        adminId: user.id,
        locationId,
        locationName: data.display_name,
        oldValues: {
          base_price: existingLocation.base_price,
          is_active: existingLocation.is_active
        },
        newValues: {
          base_price: data.base_price,
          is_active: data.is_active
        },
        timestamp: new Date().toISOString()
      });

      return res.status(200).json({
        success: true,
        message: 'Ad location updated successfully',
        data: { 
          location: data,
          updated_by: user.id
        },
        timestamp: new Date().toISOString()
      });
    }

    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET and PUT methods are allowed',
        details: null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin ad locations API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while processing ad locations',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Apply CMS security middleware and enhanced error handler
export default withErrorHandler(withCMSSecurity(handler, {
  requirePermission: 'manage:ads',
  auditAction: 'ad_locations_accessed'
}));
