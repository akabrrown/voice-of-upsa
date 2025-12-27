
const { getSupabaseAdmin } = require('./lib/database-server');

async function inspectArticles() {
  const admin = await getSupabaseAdmin();
  
  console.log('Fetching recent articles...');
  const { data, error } = await admin
    .from('articles')
    .select('id, title, status, published_at, created_at, category_id, display_location')
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Recent 10 articles:');
  console.table(data);
  
  console.log('\nFetching categories...');
  const { data: categories, error: catError } = await admin
    .from('categories')
    .select('id, name, slug');
    
  if (catError) {
    console.error('Cat Error:', catError);
    return;
  }
  
  console.log('Categories:');
  console.table(categories);
}

inspectArticles();
