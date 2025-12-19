# Cloudinary Configuration Fix

## Problem
The error "A Cloudinary API Key is required for signed requests" indicates that Cloudinary environment variables are missing.

## Required Environment Variables

Add these to your `.env.local` file:

```bash
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name_here
CLOUDINARY_API_KEY=your_cloudinary_api_key_here
CLOUDINARY_API_SECRET=your_cloudinary_api_secret_here
CLOUDINARY_UPLOAD_PRESET=voice_of_upsa
```

## How to Get Cloudinary Credentials

1. Go to [Cloudinary Dashboard](https://cloudinary.com/console)
2. Sign in or create an account
3. Navigate to Settings → API Security
4. Copy these values:
   - **Cloud name**: From the dashboard URL or settings
   - **API Key**: From API Security page
   - **API Secret**: From API Security page

## Quick Fix Steps

1. Create `.env.local` file in your project root
2. Add the Cloudinary variables above
3. Replace placeholder values with your actual credentials
4. Restart your development server

## Alternative: Disable Cloudinary

If you don't need image uploads right now, you can temporarily disable Cloudinary by modifying the upload functions to return placeholder images.

## Verification

After setting up, test with:
```bash
npm run dev
```

The error should disappear and image uploads should work.
