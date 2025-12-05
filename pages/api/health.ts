import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check environment variables
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      NODE_ENV: process.env.NODE_ENV
    };
    
    // Test Supabase connection
    let supabaseTest = { success: false, error: null as string | null, count: 0 };
    try {
      const { count, error } = await supabaseAdmin.from('articles').select('*', { count: 'exact', head: true });
      if (error) {
        supabaseTest.error = error.message;
      } else {
        supabaseTest = { success: true, error: null, count: count || 0 };
      }
    } catch (e) {
      supabaseTest.error = (e as Error).message;
    }
    
    // Test articles API
    let articlesTest = { success: false, error: null as string | null, count: 0 };
    try {
      const { data, error } = await supabaseAdmin
        .from('articles')
        .select('id, title, status', { count: 'exact' })
        .eq('status', 'published')
        .limit(1);
      
      if (error) {
        articlesTest.error = error.message;
      } else {
        articlesTest = { success: true, error: null, count: data?.length || 0 };
      }
    } catch (e) {
      articlesTest.error = (e as Error).message;
    }
    
    const isHealthy = envCheck.NEXT_PUBLIC_SUPABASE_URL && 
                     envCheck.NEXT_PUBLIC_SUPABASE_ANON_KEY && 
                     envCheck.SUPABASE_SERVICE_ROLE_KEY &&
                     supabaseTest.success;
    
    return res.status(isHealthy ? 200 : 500).json({
      success: isHealthy,
      status: isHealthy ? 'healthy' : 'unhealthy',
      checks: {
        environment: envCheck,
        supabase: supabaseTest,
        articles: articlesTest
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    });
  }
}

