import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Simple test API to debug ad submission issues
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('=== AD SUBMISSION DEBUG TEST ===');
    
    // Test Supabase connection
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('1. Testing Supabase connection...');
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Service Role Key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Check if table exists
    console.log('2. Checking if ad_submissions table exists...');
    const { data: tableExists, error: tableError } = await supabase
      .rpc('table_exists', { table_name: 'ad_submissions' })
      .single();

    if (tableError) {
      console.log('Table check failed, trying alternative method...');
      // Alternative method to check table
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'ad_submissions');
      
      if (tablesError) {
        console.error('Could not check table existence:', tablesError);
      } else {
        console.log('Table exists check:', tables);
      }
    } else {
      console.log('Table exists:', tableExists);
    }

    // Test simple insert with minimal data
    console.log('3. Testing minimal insert...');
    const testData = {
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      phone: '1234567890',
      business_type: 'individual',
      ad_type: 'banner',
      ad_title: 'Test Ad',
      ad_description: 'Test Description with enough characters',
      target_audience: 'Test Audience description',
      budget: '100',
      duration: '1-week',
      start_date: '2024-12-07',
      terms_accepted: true,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Test data:', JSON.stringify(testData, null, 2));

    const { data: insertResult, error: insertError } = await supabase
      .from('ad_submissions')
      .insert([testData])
      .select()
      .single();

    if (insertError) {
      console.error('Insert error details:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
      
      return res.status(500).json({ 
        message: 'Database insert failed',
        error: insertError.message,
        details: insertError.details,
        code: insertError.code
      });
    }

    console.log('Insert successful:', insertResult);

    // Clean up the test record
    if (insertResult?.id) {
      console.log('4. Cleaning up test record...');
      const { error: deleteError } = await supabase
        .from('ad_submissions')
        .delete()
        .eq('id', insertResult.id);
      
      if (deleteError) {
        console.error('Cleanup failed:', deleteError);
      } else {
        console.log('Test record cleaned up successfully');
      }
    }

    console.log('=== DEBUG TEST COMPLETED SUCCESSFULLY ===');

    res.status(200).json({ 
      message: 'Debug test completed successfully',
      testResult: insertResult
    });

  } catch (error) {
    console.error('=== DEBUG TEST FAILED ===');
    console.error('Error:', error);
    
    res.status(500).json({ 
      message: 'Debug test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
