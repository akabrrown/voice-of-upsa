import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { z } from 'zod';

interface AdLocationData {
  id: string;
  display_name: string;
  base_price?: number | null;
  is_active: boolean;
}

// Enhanced validation schema for ad location operations
const createLocationSchema = z.object({
  display_name: z.string().min(1, 'Display name is required').max(100, 'Display name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  base_price: z.number().min(0, 'Base price must be non-negative').max(999999, 'Base price too high').optional(),
  is_active: z.boolean().default(true),
  sort_order: z.number().min(0, 'Sort order must be non-negative').default(0)
});

const updateLocationSchema = z.object({
  locationId: z.string().uuid('Invalid location ID format'),
  display_name: z.string().min(1, 'Display name is required').max(100, 'Display name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  base_price: z.number().min(0, 'Base price must be non-negative').max(999999, 'Base price too high').optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().min(0, 'Sort order must be non-negative').optional()
});

const deleteLocationSchema = z.object({
  locationId: z.string().uuid('Invalid location ID format')
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('=== AD-LOCATIONS API HANDLER START (AUTH BYPASSED) ===');
  console.log('AD-LOCATIONS API: Request received', {
    method: req.method,
    url: req.url
  });
  
  try {
    // Get supabase admin client
    const supabaseAdmin = await getSupabaseAdmin();
    if (!supabaseAdmin) {
      console.error('AD-LOCATIONS API: Failed to get Supabase admin client');
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_CONNECTION_FAILED',
          message: 'Failed to connect to database',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    console.log('AD-LOCATIONS API: Authentication bypassed for testing');

    // GET - Fetch ad locations
    if (req.method === 'GET') {
      const { data: locations, error } = await supabaseAdmin
        .from('ad_locations')
        .select('id, display_name, description, base_price, is_active, sort_order')
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
        locationCount: locations?.length || 0,
        timestamp: new Date().toISOString()
      });

      return res.status(200).json({
        success: true,
        data: { locations: locations || [] },
        timestamp: new Date().toISOString()
      });
    }

    // POST - Create new ad location
    if (req.method === 'POST') {
      const validatedData = createLocationSchema.parse(req.body);
      const { display_name, description, base_price, is_active, sort_order } = validatedData;

      console.log(`Admin ad location creation initiated`, {
        display_name,
        base_price,
        is_active,
        sort_order,
        timestamp: new Date().toISOString()
      });

      // Check if display name already exists
      const { data: existingLocation } = await supabaseAdmin
        .from('ad_locations')
        .select('id, display_name')
        .eq('display_name', display_name)
        .single();

      if (existingLocation) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_NAME',
            message: 'Ad location with this display name already exists',
            details: null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Create new ad location
      const { data, error } = await supabaseAdmin
        .from('ad_locations')
        .insert({
          display_name,
          description: description || null,
          base_price: base_price || null,
          is_active: is_active ?? true,
          sort_order: sort_order ?? 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as unknown as never)
        .select('id, display_name, description, base_price, is_active, sort_order, created_at, updated_at')
        .single();

      if (error) {
        console.error('Admin ad location creation error:', error);
        return res.status(500).json({
          success: false,
          error: {
            code: 'CREATION_FAILED',
            message: 'Failed to create ad location',
            details: process.env.NODE_ENV === 'development' ? error.message : null
          },
          timestamp: new Date().toISOString()
        });
      }

      console.log(`Admin ad location created successfully`, {
        locationId: (data as { id: string; display_name: string }).id,
        locationName: (data as { id: string; display_name: string }).display_name,
        timestamp: new Date().toISOString()
      });

      return res.status(201).json({
        success: true,
        message: 'Ad location created successfully',
        data: { location: data },
        timestamp: new Date().toISOString()
      });
    }

    // DELETE - Remove ad location
    if (req.method === 'DELETE') {
      const validatedData = deleteLocationSchema.parse(req.body);
      const { locationId } = validatedData;

      console.log(`Admin ad location deletion initiated`, {
        locationId,
        timestamp: new Date().toISOString()
      });

      // Check if location exists and get details for logging
      const { data: existingLocation, error: fetchError } = await supabaseAdmin
        .from('ad_locations')
        .select('id, display_name, is_active')
        .eq('id', locationId)
        .single();

      if (fetchError) {
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

      // Check if location is being used by any active ads
      const { data: activeAds, error: adsCheckError } = await supabaseAdmin
        .from('ads')
        .select('id, title')
        .eq('location_id', locationId)
        .eq('is_active', true);

      if (adsCheckError) {
        console.error('Error checking active ads:', adsCheckError);
      }

      if (activeAds && activeAds.length > 0) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'LOCATION_IN_USE',
            message: 'Cannot delete ad location that is being used by active ads',
            details: `Found ${activeAds.length} active ads using this location`
          },
          timestamp: new Date().toISOString()
        });
      }

      // Delete the location
      const { error: deleteError } = await supabaseAdmin
        .from('ad_locations')
        .delete()
        .eq('id', locationId);

      if (deleteError) {
        console.error('Admin ad location deletion error:', deleteError);
        return res.status(500).json({
          success: false,
          error: {
            code: 'DELETION_FAILED',
            message: 'Failed to delete ad location',
            details: process.env.NODE_ENV === 'development' ? deleteError.message : null
          },
          timestamp: new Date().toISOString()
        });
      }

      console.log(`Admin ad location deleted successfully`, {
        locationId,
        locationName: (existingLocation as { display_name: string }).display_name,
        timestamp: new Date().toISOString()
      });

      return res.status(200).json({
        success: true,
        message: 'Ad location deleted successfully',
        timestamp: new Date().toISOString()
      });
    }
    if (req.method === 'PUT') {
      // Validate input with enhanced schema
      const validatedData = updateLocationSchema.parse(req.body);
      const { locationId, base_price, is_active } = validatedData;

      // Log admin location update action
      console.log(`Admin ad location update initiated`, {
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
        .update(updateData as never)
        .eq('id', locationId)
        .select('id, display_name, description, base_price, is_active, sort_order, created_at, updated_at')
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

      // Log successful update with proper typing
      const existing = existingLocation as AdLocationData;
      const updated = data as AdLocationData;
      console.log(`Admin ad location updated successfully`, {
        locationId,
        locationName: updated.display_name,
        oldValues: {
          base_price: existing.base_price,
          is_active: existing.is_active
        },
        newValues: {
          base_price: updated.base_price,
          is_active: updated.is_active
        },
        timestamp: new Date().toISOString()
      });

      return res.status(200).json({
        success: true,
        message: 'Ad location updated successfully',
        data: { 
          location: data
        },
        timestamp: new Date().toISOString()
      });
    }

    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET, POST, PUT, and DELETE methods are allowed',
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

// TEMPORARY: Export without authentication middleware
export default withErrorHandler(handler);
