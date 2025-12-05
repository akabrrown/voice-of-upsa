const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnv(filePath) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    lines.forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["'](.*)["']$/, '$1');
        if (!process.env[key]) process.env[key] = value;
      }
    });
  }
}

loadEnv(path.join(__dirname, '../.env'));
loadEnv(path.join(__dirname, '../.env.local'));

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('--- Checking Database Schema ---');

  // 1. Check site_settings
  console.log('\nChecking site_settings table...');
  const { data: settings, error: settingsError } = await supabase
    .from('site_settings')
    .select('*')
    .limit(1);

  if (settingsError) {
    console.error('❌ Error accessing site_settings:', settingsError.message);
  } else {
    console.log('✅ site_settings table exists');
    if (settings.length === 0) console.log('⚠️ site_settings table is empty');
    else console.log('✅ site_settings has data');
  }

  // 2a. Check comments simple fetch
  console.log('\nChecking comments simple fetch...');
  const { data: simpleComments, error: simpleError } = await supabase
    .from('comments')
    .select('*')
    .limit(1);

  if (simpleError) {
    console.error('❌ Error fetching simple comments:', simpleError.message);
  } else {
    console.log('✅ Simple comments fetch successful');
  }

  // 2b. Check comments relationships
  console.log('\nChecking comments relationships...');
  // Try to fetch one comment with related user and article
  const { data: comments, error: commentsError } = await supabase
    .from('comments')
    .select(`
      *,
      user:users(name, email),
      article:articles(title, slug)
    `)
    .limit(1);

  if (commentsError) {
    console.error('❌ Error fetching comments with relations:', commentsError.message);
    console.error('   This suggests missing foreign keys or incorrect relation names.');
  } else {
    console.log('✅ Comments relationships are valid');
  }

  // 3. Check article_bookmarks
  console.log('\nChecking article_bookmarks table...');
  const { data: bookmarks, error: bookmarksError } = await supabase
    .from('article_bookmarks')
    .select('count', { count: 'exact', head: true });

  if (bookmarksError) {
    console.error('❌ Error accessing article_bookmarks:', bookmarksError.message);
    console.error('   Details:', bookmarksError);
  } else {
    console.log('✅ article_bookmarks table is accessible');
    if (bookmarks && bookmarks.length > 0) {
      console.log(`   Found ${bookmarks[0].count} bookmarks in total.`);
    }
  }

  // 4. List actual bookmarks to verify content
  console.log('\nListing recent bookmarks...');
  const { data: recentBookmarks, error: listError } = await supabase
    .from('article_bookmarks')
    .select('*')
    .limit(5);

  if (listError) {
    console.error('❌ Error listing bookmarks:', listError.message);
  } else {
    console.log('Found bookmarks:', recentBookmarks);
  }

  // 5. Check articles table columns (by fetching one)
  console.log('\nChecking articles table structure...');
  const { data: article, error: articleError } = await supabase
    .from('articles')
    .select('*')
    .limit(1);

  if (articleError) {
    console.error('❌ Error fetching article:', articleError.message);
  } else if (article && article.length > 0) {
    console.log('Article columns:', Object.keys(article[0]));
  } else {
    console.log('⚠️ No articles found to check structure');
  }
}

checkSchema();
