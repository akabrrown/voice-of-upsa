
import { getSupabaseAdmin } from '../lib/database-server.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function fixArticles() {
  try {
    const admin = await getSupabaseAdmin();
    
    console.log('Fetching "News" category...');
    const { data: newsCat, error: catError } = await admin
      .from('categories')
      .select('id')
      .eq('slug', 'news')
      .single();
      
    if (catError || !newsCat) {
      console.error('Could not find "News" category:', catError);
      return;
    }
    
    const newsId = newsCat.id;
    console.log(`Found "News" category ID: ${newsId}`);
    
    console.log('Updating articles with null category...');
    const { data: updatedArticles, error: updateError } = await admin
      .from('articles')
      .update({ category_id: newsId })
      .is('category_id', null);
      
    if (updateError) {
      console.error('Error updating null categories:', updateError);
    } else {
      console.log('Successfully updated articles with null categories.');
    }
    
    console.log('Updating articles with display_location = "none"...');
    // We want these to at least show up on the category page if they are published
    const { data: updatedDisplay, error: displayError } = await admin
      .from('articles')
      .update({ display_location: 'category_page' })
      .eq('display_location', 'none')
      .eq('status', 'published');
      
    if (displayError) {
      console.error('Error updating display locations:', displayError);
    } else {
      console.log('Successfully updated published articles with "none" display location.');
    }

    console.log('Verification: Fetching recent articles...');
    const { data: recent, error: verifyError } = await admin
      .from('articles')
      .select('title, category_id, display_location')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (!verifyError) {
      console.table(recent);
    }

  } catch (err) {
    console.error('Catch error:', err);
  }
}

fixArticles();
