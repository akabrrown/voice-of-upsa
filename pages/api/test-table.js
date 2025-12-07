// Test if ad_submissions table exists and create if needed
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  try {
    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Test if table exists by trying to select from it
    let tableExists = false;
    try {
      const { data, error } = await supabaseService
        .from('ad_submissions')
        .select('*')
        .limit(1);
      
      tableExists = !error;
      console.log('Table test result:', { data, error });
    } catch (e) {
      console.log('Table test error:', e);
      tableExists = false;
    }

    if (!tableExists) {
      // Create the table
      const createTableSQL = `
        CREATE TABLE ad_submissions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(20) NOT NULL,
          company VARCHAR(255),
          business_type VARCHAR(50) NOT NULL,
          ad_type VARCHAR(50) NOT NULL,
          ad_title VARCHAR(255) NOT NULL,
          ad_description TEXT NOT NULL,
          target_audience TEXT NOT NULL,
          budget VARCHAR(100) NOT NULL,
          duration VARCHAR(50) NOT NULL,
          start_date DATE NOT NULL,
          website VARCHAR(500),
          additional_info TEXT,
          terms_accepted BOOLEAN NOT NULL DEFAULT false,
          attachment_urls TEXT[] DEFAULT '{}',
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        ALTER TABLE ad_submissions DISABLE ROW LEVEL SECURITY;
      `;

      try {
        const { error: execError } = await supabaseService.rpc('exec_sql', { sql: createTableSQL });
        
        if (execError) {
          console.log('SQL exec error:', execError);
          return res.status(500).json({ 
            error: 'Failed to create table', 
            details: execError,
            suggestion: 'Please run the SQL manually in Supabase dashboard'
          });
        }
      } catch (e) {
        return res.status(500).json({ 
          error: 'Failed to execute SQL', 
          details: e.message,
          suggestion: 'Run create-complete-ads-table.sql manually'
        });
      }
    }

    // Test the table again
    try {
      const { data } = await supabaseService
        .from('ad_submissions')
        .select('*')
        .limit(5);

      return res.status(200).json({
        tableExists: true,
        adsFound: (data || []).length,
        sampleAds: data || [],
        message: tableExists ? 'Table already existed' : 'Table created successfully'
      });
    } catch (e) {
      return res.status(500).json({ 
        error: 'Table creation failed', 
        details: e.message,
        suggestion: 'Please run create-complete-ads-table.sql manually in Supabase dashboard'
      });
    }

  } catch (error) {
    return res.status(500).json({ error: 'Test failed', details: error.message });
  }
}
