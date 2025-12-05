# Logo Change Feature Implementation

## Overview
Successfully implemented a feature allowing admins to change the site logo through the website settings page.

## Database Changes
- **File**: `add-logo-field.sql`
- **Action**: Added `site_logo` VARCHAR(500) field to `site_settings` table
- **Default**: `/logo.jpg`

## Backend Implementation

### API Endpoints
1. **Settings API** (`/pages/api/admin/settings/index.ts`)
   - Updated validation schema to include `site_logo` field
   - Added `site_logo` to default settings response

2. **Logo Upload API** (`/pages/api/admin/upload-logo.ts`)
   - Handles file uploads with validation
   - Supports JPG, PNG, GIF, WebP formats
   - 2MB file size limit
   - Rate limiting: 5 uploads per minute per admin
   - Automatic file naming with timestamp

### Frontend Implementation

### Components Updated
1. **Admin Settings Page** (`/pages/admin/settings.tsx`)
   - Added logo upload section with preview
   - File validation and error handling
   - Loading states during upload
   - Uses Next.js Image component for optimization

2. **Header Component** (`/components/Header.tsx`)
   - Updated to use dynamic logo from site settings
   - Fallback to default logo on error
   - Uses `useSiteSettings` hook for real-time updates

### Custom Hook
- **useSiteSettings** (`/hooks/useSiteSettings.ts`)
   - Fetches site name and logo from database
   - Provides real-time updates to components
   - Handles loading states and errors

## Dependencies Added
- `formidable`: File upload handling
- `@types/formidable`: TypeScript definitions

## Features
- **File Validation**: Type and size validation before upload
- **Progress Feedback**: Loading states during upload
- **Error Handling**: Comprehensive error messages
- **Security**: Admin-only access, rate limiting
- **Performance**: Optimized image loading with Next.js Image
- **Fallback**: Graceful fallback to default logo

## Usage
1. Navigate to `/admin/settings` (admin access required)
2. Scroll to "Logo Settings" section
3. Click "Choose Logo" button
4. Select image file (JPG, PNG, GIF, WebP, max 2MB)
5. Logo automatically updates across the site

## Security Considerations
- Admin authentication required
- File type validation
- File size limits
- Rate limiting on uploads
- Automatic cleanup on failed uploads

## Future Enhancements
- Image cropping/resizing before upload
- Multiple logo variants (light/dark mode)
- Logo history/rollback
- CDN integration for better performance
