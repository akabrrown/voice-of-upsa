# Supabase Webhooks Setup Guide

## Problem
New users who sign up through Supabase Auth are not appearing in the admin users frontend because they exist in `auth.users` but not in the custom `users` table.

## Solution Options

### Option 1: Manual Sync (Implemented ✅)
Use the "Sync Users" button in the admin dashboard to manually sync all users from Supabase auth to the users table.

### Option 2: Automatic Webhooks (Recommended for Production)
Set up Supabase webhooks to automatically sync users when they sign up or update their profile.

## Setting Up Webhooks

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Go to Settings → Webhooks

2. **Create Webhook for User Events**
   - Click "Add Webhook"
   - **Name**: User Sync Webhook
   - **URL**: `https://your-domain.com/api/auth/sync-user`
   - **Events**: Select `user.created`, `user.updated`, `signup`
   - **Secret**: Generate a secure secret key
   - **Active**: Enable the webhook

3. **Update Environment Variables**
   Add to your `.env.local`:
   ```
   SUPABASE_WEBHOOK_SECRET=your_webhook_secret_here
   ```

4. **Test the Webhook**
   - Create a test user through your signup form
   - Check if the user appears in the admin dashboard
   - Check the webhook logs in Supabase Dashboard

## Webhook Security

The sync-user API endpoint includes basic validation, but for production you should:
1. Add webhook signature verification
2. Rate limit the endpoint
3. Monitor webhook delivery logs

## Manual Sync API

If webhooks fail or for manual syncing:
- **Endpoint**: `POST /api/admin/users/sync-all`
- **Access**: Admin only
- **Function**: Syncs all users from `auth.users` to `users` table
- **Features**:
  - Creates missing user records
  - Updates existing user data
  - Preserves role assignments
  - Provides sync statistics

## Troubleshooting

### Users not appearing after sync:
1. Check browser console for errors
2. Check Supabase logs for webhook failures
3. Verify admin permissions
4. Check network tab for API responses

### Webhook not triggering:
1. Verify webhook URL is accessible
2. Check webhook secret configuration
3. Review Supabase webhook logs
4. Test webhook with manual trigger

### Sync button not working:
1. Check admin role permissions
2. Verify API endpoint exists
3. Check browser console for JavaScript errors
4. Verify network connectivity to Supabase

## Current Status

✅ Manual sync implemented
✅ Sync button added to admin dashboard
✅ Sync API endpoint created
🔄 Webhook setup (manual configuration required)
