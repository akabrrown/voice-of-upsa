# Fix for Admin Anonymous Messages Permission Error

## Problem
The admin panel shows "permission denied for table anonymous_messages" because:
1. The RLS policies are restricting access
2. The admin API needs the service role key to bypass RLS

## Solution Options

### Option 1: Run the comprehensive RLS fix (Recommended)
Run this SQL in your Supabase SQL editor:
```sql
-- Copy contents from: fix-anonymous-rls-comprehensive.sql
```

### Option 2: Add Service Role Key to Environment
Make sure your `.env` file contains:
```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

You can get this from:
1. Go to Supabase Dashboard → Settings → API
2. Copy the "service_role" key (NOT the "anon" key)
3. Add it to your `.env` file

### Option 3: Quick Test - Disable RLS Temporarily
If you need to test immediately, run this in Supabase SQL:
```sql
ALTER TABLE anonymous_messages DISABLE ROW LEVEL SECURITY;
```
Then run the comprehensive fix later.

## Steps to Fix

1. **Get your service role key** from Supabase Dashboard
2. **Add it to your .env file** as `SUPABASE_SERVICE_ROLE_KEY`
3. **Restart your development server**
4. **Run the comprehensive RLS fix** SQL script

## Verification
After fixing:
- Admin panel should load pending messages
- Admin should be able to approve/decline messages
- Admin should be able to post questions
