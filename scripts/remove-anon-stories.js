require('dotenv').config({ path: '.env.migration' });
const { createClient } = require('@supabase/supabase-js');

const newSupabase = createClient(
  process.env.NEW_SUPABASE_URL,
  process.env.NEW_SUPABASE_SERVICE_ROLE_KEY
);

async function cleanup() {
  console.log('Fetching Anonymous Stories category...');
  const { data: catData, error: catErr } = await newSupabase
    .from('categories')
    .select('id')
    .eq('slug', 'anonymous-stories')
    .single();
  
  if (catErr || !catData) {
    console.log('Category not found. Nothing to remove.');
    return;
  }
  
  const catId = catData.id;
  
  console.log('Deleting anonymous story articles...');
  const { error: delErr } = await newSupabase
    .from('articles')
    .delete()
    .eq('category_id', catId);
    
  if (delErr) {
    console.error('Failed to delete articles:', delErr);
    return;
  }
  
  console.log('Deleting "Anonymous Stories" category...');
  const { error: delCatErr } = await newSupabase
    .from('categories')
    .delete()
    .eq('id', catId);
    
  if (delCatErr) {
    console.error('Failed to delete category:', delCatErr);
    return;
  }
  
  console.log('✅ Successfully removed all anonymous stories and the category from the database.');
}

cleanup();
