/**
 * Data Migration Script for VOU Rework
 * 
 * Instructions:
 * 1. Install dotenv if you haven't: `npm install dotenv`
 * 2. Create a `.env.migration` file in the root of your project with the following variables:
 *    OLD_SUPABASE_URL=your_old_project_url
 *    OLD_SUPABASE_SERVICE_ROLE_KEY=your_old_project_service_key
 *    NEW_SUPABASE_URL=your_new_project_url
 *    NEW_SUPABASE_SERVICE_ROLE_KEY=your_new_project_service_key
 * 3. Run this script: `node scripts/migrate-data.js`
 */

require('dotenv').config({ path: '.env.migration' });
const { createClient } = require('@supabase/supabase-js');

if (!process.env.OLD_SUPABASE_URL || !process.env.NEW_SUPABASE_URL) {
  console.error("Missing Environment Variables. Please set OLD_SUPABASE_URL and NEW_SUPABASE_URL in .env.migration");
  process.exit(1);
}

// We use the service_role key to bypass Row Level Security (RLS) during migration
const oldSupabase = createClient(
  process.env.OLD_SUPABASE_URL,
  process.env.OLD_SUPABASE_SERVICE_ROLE_KEY
);

const newSupabase = createClient(
  process.env.NEW_SUPABASE_URL,
  process.env.NEW_SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Helper to normalize strings for matching
const clean = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Map to keep track of Old User ID -> New User ID
const userIdMap = {};
// Map to keep track of Normalized User Name -> New User ID
const userNameMap = {};
// Map to keep track of Old Category ID -> New Category ID
const categoryIdMap = {};

const TEMP_PASSWORD = 'TemporaryPassword123!';

async function migrateUsers() {
  console.log('Migrating users via auth.admin.createUser and syncing profiles...');
  const { data: oldUsers, error: oldErr } = await oldSupabase.from('users').select('*');
  if (oldErr) throw oldErr;
  
  if (!oldUsers || oldUsers.length === 0) return;

  // Pre-fetch ALL existing users in the new DB using pagination
  const existingEmailMap = {};
  let page = 1;
  while (true) {
    const { data: listData, error: listErr } = await newSupabase.auth.admin.listUsers({ page, perPage: 100 });
    if (listErr) throw listErr;
    if (!listData || !listData.users || listData.users.length === 0) break;
    
    listData.users.forEach(u => {
      if (u.email) {
        existingEmailMap[u.email.toLowerCase().trim()] = u.id;
      }
    });

    if (listData.users.length < 100) break;
    page++;
  }
  console.log(`Fetched ${Object.keys(existingEmailMap).length} existing auth accounts from new database.`);

  for (const user of oldUsers) {
    if (!user.email) continue;
    const normalizedEmail = user.email.toLowerCase().trim();
    
    let newUserId;

    if (existingEmailMap[normalizedEmail]) {
      // User already exists in the new DB
      newUserId = existingEmailMap[normalizedEmail];
    } else {
      const { data: authData, error: authErr } = await newSupabase.auth.admin.createUser({
        email: user.email,
        password: TEMP_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: user.name,
          username: user.email.split('@')[0] + Math.floor(Math.random() * 1000),
          avatar_url: user.avatar_url
        }
      });

      if (authErr) {
        // If already registered, fetch user by email
        if (existingEmailMap[normalizedEmail]) {
          newUserId = existingEmailMap[normalizedEmail];
        } else {
          console.error(`❌ Failed to create ${user.email}:`, authErr.message);
          continue;
        }
      } else {
        newUserId = authData.user.id;
        existingEmailMap[normalizedEmail] = newUserId;
      }
    }

    userIdMap[user.id] = newUserId;

    // Index by user name and split parts
    if (user.name) {
      userNameMap[clean(user.name)] = newUserId;
      const parts = user.name.toLowerCase().trim().split(/\s+/);
      if (parts.length >= 2) {
        userNameMap[clean(parts.slice().reverse().join(' '))] = newUserId;
      }
    }

    // Update profile in new database
    const { error: profileErr } = await newSupabase.from('profiles').update({
      full_name: user.name,
      role: user.role === 'admin' || user.role === 'editor' ? user.role : 'public',
      bio: user.bio,
      avatar_url: user.avatar_url || null,
      is_active: user.is_active !== undefined ? user.is_active : true,
      updated_at: user.updated_at
    }).eq('id', newUserId);

    if (profileErr) {
      console.error(`❌ Failed to update profile for ${user.email}:`, profileErr.message);
    }
  }

  // Add specific aliases for known contributors
  const prempehId = existingEmailMap['prempehquinsker1@gmail.com'];
  if (prempehId) {
    userNameMap[clean('Quinsker Prempeh')] = prempehId;
    userNameMap[clean('Prempeh Quinsker')] = prempehId;
    userNameMap[clean('Quinsker')] = prempehId;
  }

  const jerryId = existingEmailMap['jerryfreeman233@gmail.com'];
  if (jerryId) {
    userNameMap[clean('Opoku Jerry Freeman')] = jerryId;
    userNameMap[clean('Jerry Freeman')] = jerryId;
  }

  const priscillaId = existingEmailMap['adjeipriscilla068@gmail.com'];
  if (priscillaId) {
    userNameMap[clean('Priscilla Adjei')] = priscillaId;
    userNameMap[clean('Priscilla Emmanuella Adjei')] = priscillaId;
  }

  const noelId = existingEmailMap['noelmawuedemcoffie@gmail.com'];
  if (noelId) {
    userNameMap[clean('Coffie Noel Mawuedem')] = noelId;
    userNameMap[clean('Coffie Mawuedem Noel')] = noelId;
  }

  const vouId = existingEmailMap['voice.of.upsa.mail@gmail.com'];
  if (vouId) {
    userNameMap[clean('VOU')] = vouId;
    userNameMap[clean('VOUNews')] = vouId;
    userNameMap[clean('VOU News')] = vouId;
    userNameMap[clean('VoU News')] = vouId;
    userNameMap[clean('VOU NEWS')] = vouId;
  }

  console.log(`✅ Successfully mapped ${Object.keys(userIdMap).length} users and ${Object.keys(userNameMap).length} author name aliases.`);
}

async function migrateCategories() {
  console.log('Migrating categories...');
  const { data: oldCats, error: oldErr } = await oldSupabase.from('categories').select('*');
  if (oldErr) throw oldErr;
  
  if (!oldCats || oldCats.length === 0) return;

  const { data: existingCats, error: existingErr } = await newSupabase.from('categories').select('*');
  if (existingErr) throw existingErr;

  const existingNameMap = {};
  const existingSlugMap = {};
  if (existingCats) {
    existingCats.forEach(c => {
      existingNameMap[c.name.toLowerCase()] = c.id;
      existingSlugMap[c.slug.toLowerCase()] = c.id;
    });
  }

  const newCatsToInsert = [];

  for (const cat of oldCats) {
    const slugLower = (cat.slug || "").toLowerCase();
    const nameLower = (cat.name || "").toLowerCase();

    // STRICT RULE: Exclude any anonymous categories
    if (slugLower.includes("anon") || nameLower.includes("anon") || nameLower.includes("confession")) {
      console.log(`🛡️ Excluding anonymous category: "${cat.name}" (${cat.slug})`);
      continue;
    }

    const matchedId = existingNameMap[nameLower] || existingSlugMap[slugLower];
    if (matchedId) {
      categoryIdMap[cat.id] = matchedId;
    } else {
      categoryIdMap[cat.id] = cat.id;
      newCatsToInsert.push({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        created_at: cat.created_at
      });
    }
  }

  if (newCatsToInsert.length > 0) {
    const { error: newErr } = await newSupabase.from('categories').upsert(newCatsToInsert, { onConflict: 'id' });
    if (newErr) throw newErr;
    console.log(`✅ Inserted ${newCatsToInsert.length} new categories.`);
  } else {
    console.log(`✅ All categories already existed in the new database and were mapped successfully.`);
  }
}

async function migrateArticles() {
  console.log('Migrating articles with precise author resolution...');
  const { data: oldArts, error: oldErr } = await oldSupabase.from('articles').select('*');
  if (oldErr) throw oldErr;
  
  if (!oldArts || oldArts.length === 0) return;

  let resolvedAuthorCount = 0;
  let fallbackAuthorCount = 0;
  let skippedAnonCount = 0;

  // STRICT RULE: Exclude any anonymous stories or posts
  const filteredArts = oldArts.filter(art => {
    const titleLower = (art.title || '').toLowerCase();
    const slugLower = (art.slug || '').toLowerCase();
    const contribLower = (art.contributor_name || '').toLowerCase();
    
    const isAnon = 
      titleLower.includes('anonymous story') || 
      titleLower.includes('anonymous post') || 
      slugLower.includes('anonymous-stor') ||
      contribLower === 'anonymous' ||
      contribLower.includes('anonymous contributor') ||
      art.is_anonymous === true;

    if (isAnon) {
      skippedAnonCount++;
      return false;
    }
    return true;
  });

  if (skippedAnonCount > 0) {
    console.log(`🛡️ Filtered out ${skippedAnonCount} anonymous posts from migration.`);
  }

  const newArts = filteredArts.map(art => {
    let newStatus = art.status;
    if (newStatus === 'pending_review') newStatus = 'review';
    if (newStatus === 'scheduled') newStatus = 'draft';

    // 1. Resolve author: check contributor_name first if valid
    let authorId = null;
    const contribName = art.contributor_name?.trim();
    if (contribName && !['VOU', 'VOUNews', 'VOU News', 'VOU NEWS'].includes(contribName)) {
      authorId = userNameMap[clean(contribName)];
    }

    // 2. Fallback to old author_id mapping
    if (!authorId && art.author_id) {
      authorId = userIdMap[art.author_id];
    }

    // 3. Fallback to VOU if generic VOU name
    if (!authorId && contribName && ['VOU', 'VOUNews', 'VOU News', 'VOU NEWS'].includes(contribName)) {
      authorId = userNameMap[clean('VOU')];
    }

    if (authorId) {
      resolvedAuthorCount++;
    } else {
      fallbackAuthorCount++;
    }

    return {
      id: art.id,
      title: art.title,
      slug: art.slug,
      excerpt: art.excerpt,
      content: art.content,
      cover_image_url: art.featured_image,
      author_id: authorId || null,
      category_id: categoryIdMap[art.category_id] || art.category_id,
      status: newStatus,
      is_featured: art.featured,
      view_count: art.views_count || art.view_count || 0,
      reading_time_minutes: art.reading_time,
      meta_title: art.seo_title || art.meta_title,
      meta_description: art.seo_description || art.meta_description,
      published_at: art.published_at,
      created_at: art.created_at,
      updated_at: art.updated_at
    };
  });

  const { error: newErr } = await newSupabase.from('articles').upsert(newArts, { onConflict: 'id' });
  if (newErr) throw newErr;
  console.log(`✅ Migrated ${newArts.length} articles (${resolvedAuthorCount} with verified authors, ${fallbackAuthorCount} unmapped).`);
}

async function migrateComments() {
  console.log('Migrating comments...');
  const { data: oldComms, error: oldErr } = await oldSupabase.from('comments').select('*');
  if (oldErr) throw oldErr;
  
  if (!oldComms || oldComms.length === 0) return;

  const newComms = oldComms.map(comm => {
    const is_approved = comm.status === 'published' || comm.status === 'approved';
    const is_deleted = comm.status === 'spam' || comm.status === 'rejected';

    return {
      id: comm.id,
      article_id: comm.article_id,
      user_id: userIdMap[comm.user_id] || null,
      parent_id: comm.parent_id,
      content: comm.content,
      is_approved: is_approved,
      is_deleted: is_deleted,
      created_at: comm.created_at,
      updated_at: comm.updated_at
    };
  });

  const { error: newErr } = await newSupabase.from('comments').upsert(newComms, { onConflict: 'id' });
  if (newErr) throw newErr;
  console.log(`✅ Migrated ${newComms.length} comments.`);
}

async function purgeAnonymousPosts() {
  console.log('🧹 Ensuring zero anonymous stories or categories exist in the target database...');
  // 1. Delete category if any
  const { data: catData } = await newSupabase
    .from('categories')
    .select('id, name')
    .or('slug.ilike.%anon%,name.ilike.%anon%');

  if (catData && catData.length > 0) {
    for (const c of catData) {
      console.log(`Removing leftover anonymous category: "${c.name}" (${c.id})...`);
      await newSupabase.from('articles').delete().eq('category_id', c.id);
      await newSupabase.from('categories').delete().eq('id', c.id);
    }
  }

  // 2. Delete any articles with anon in slug or title
  const { data: anonArticles } = await newSupabase
    .from('articles')
    .select('id, title')
    .or('slug.ilike.%anonymous-stor%,title.ilike.%anonymous story%');

  if (anonArticles && anonArticles.length > 0) {
    for (const a of anonArticles) {
      console.log(`Removing leftover anon article: "${a.title}" (${a.id})...`);
      await newSupabase.from('articles').delete().eq('id', a.id);
    }
  }
  console.log('✅ Anonymous content purge verification complete.');
}

async function runMigration() {
  try {
    console.log('🚀 Starting Data Migration...');
    await migrateUsers();
    await migrateCategories();
    await migrateArticles();
    await migrateComments();
    await purgeAnonymousPosts();
    console.log('🎉 Migration completed successfully with zero anonymous posts!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

runMigration();
