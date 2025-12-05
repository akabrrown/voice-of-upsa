# Vercel Deployment Fix Guide

## Problem: Articles fail to load on Vercel but work on localhost

### Root Causes:
1. **Environment Variables Missing** - Vercel needs the same environment variables as localhost
2. **Database Client Issues** - Using wrong Supabase client in API routes
3. **Database Schema Differences** - Production database might not match development

### Step 1: Check Vercel Environment Variables

Go to your Vercel dashboard → Project → Settings → Environment Variables and ensure these are set:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
```

### Step 2: Test Debug Endpoint

After deployment, visit:
`https://voiceofupsa.vercel.app/api/debug/auth`

This will show:
- ✅ Environment variables status
- ✅ Supabase connection test
- ✅ Authentication test results

### Step 3: Check Database Schema

Run this SQL in your Supabase SQL editor to ensure the articles table exists:

```sql
-- Check if articles table exists
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'articles';

-- Check articles structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'articles' 
ORDER BY ordinal_position;
```

### Step 4: Verify Articles API

Test the articles API directly:
`https://your-vercel-app.vercel.app/api/articles`

It should return JSON with articles data, not an error.

### Step 5: Common Issues & Fixes

#### Issue: "fetch failed" errors
**Fix**: Ensure SUPABASE_SERVICE_ROLE_KEY is set in Vercel environment variables

#### Issue: 401 Unauthorized errors  
**Fix**: Check that authentication middleware is using supabaseAdmin client

#### Issue: 500 Internal Server Error
**Fix**: Database connection issues - verify Supabase URL and keys are correct

#### Issue: Empty articles array
**Fix**: Check if articles exist in production database

### Step 6: Redeploy After Fixes

1. Push changes to GitHub
2. Vercel will automatically redeploy
3. Test the debug endpoint first
4. Then test the articles API
5. Finally test the full application

### Step 7: Monitor Logs

Check Vercel function logs for detailed error information:
- Go to Vercel dashboard → Project → Functions → View Logs
- Look for specific error messages in the API endpoints

### Emergency Fallback

If articles still don't load, the API will return empty arrays gracefully instead of crashing, so your site will still be functional.

## Quick Test Commands

```bash
# Test debug endpoint
curl https://your-vercel-app.vercel.app/api/debug/auth

# Test articles API
curl https://your-vercel-app.vercel.app/api/articles

# Test with authentication (replace TOKEN with actual JWT)
curl -H "Authorization: Bearer YOUR_TOKEN" https://your-vercel-app.vercel.app/api/articles
```

## Next Steps

1. Deploy the fixes
2. Test the debug endpoint
3. Check environment variables in Vercel dashboard
4. Monitor function logs for any remaining issues
5. Verify articles load correctly in the deployed application
