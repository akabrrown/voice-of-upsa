# Supabase Auth Migration Guide

## 🔄 **Authentication Architecture Change**

This guide explains the migration from **Clerk as primary auth** to **Supabase Auth as primary** with **Clerk as alternative**.

---

## 📋 **Current Status**

### ✅ **Completed**
- Supabase Auth configuration and helper functions
- Authentication middleware updated for Supabase
- Supabase Auth pages (sign-in, sign-up, reset-password)
- _app.tsx updated with dual-provider support
- Layout component for Supabase Auth
- User profile API updated for Supabase tokens

### 🔄 **In Progress**
- API endpoints migration
- User profile system updates
- Testing and validation

---

## 🏗️ **Architecture Overview**

### **Primary Authentication: Supabase Auth**
- **Default auth provider** for all new users
- **Session management** via Supabase cookies
- **User profiles** stored in Supabase database
- **Role-based access** managed through database

### **Alternative Authentication: Clerk**
- **Legacy support** for existing Clerk users
- **Fallback option** for users who prefer Clerk
- **Gradual migration** path from Clerk to Supabase

---

## 🔧 **Setup Instructions**

### **Step 1: Install Dependencies**

```bash
npm install @supabase/auth-helpers-nextjs
```

### **Step 2: Update Environment Variables**

Add to your `.env.local`:
```env
# Supabase Auth (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Clerk (kept for legacy support)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-key
CLERK_SECRET_KEY=your-clerk-secret
```

### **Step 3: Configure Supabase Auth**

In your Supabase Dashboard:
1. Go to **Authentication** → **Settings**
2. Configure **Site URL**: `http://localhost:3000`
3. Configure **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/auth/reset-password`

### **Step 4: Update Database Schema**

Ensure your `users` table supports Supabase Auth:
```sql
-- Update users table for Supabase Auth
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

---

## 🚀 **New Authentication Flow**

### **Supabase Auth Flow**
1. **Sign Up**: `/auth/sign-up` → Create account with email/password
2. **Sign In**: `/auth/sign-in` → Authenticate with Supabase
3. **Profile**: Auto-create user profile in database
4. **Session**: Managed via Supabase cookies

### **Clerk Auth Flow (Legacy)**
1. **Sign Up**: `/sign-up` → Create account with Clerk
2. **Sign In**: `/sign-in` → Authenticate with Clerk
3. **Profile**: Sync with database (existing system)
4. **Session**: Managed via Clerk tokens

---

## 📁 **New File Structure**

```
lib/
├── supabase-auth.ts          # Supabase Auth helpers
└── auth.ts                   # Legacy Clerk helpers (kept)

components/
├── SupabaseProvider.tsx      # Supabase Auth context
├── LayoutSupabase.tsx        # Layout for Supabase Auth
└── Layout.tsx                # Layout for Clerk Auth (legacy)

pages/
├── auth/                     # Supabase Auth pages
│   ├── sign-in.tsx
│   ├── sign-up.tsx
│   └── reset-password.tsx
├── sign-in/                  # Clerk Auth pages (legacy)
├── sign-up/
└── _app.tsx                  # Dual provider support

middleware/
└── auth.ts                   # Updated for Supabase Auth
```

---

## 🔐 **Authentication Features**

### **Supabase Auth Features**
- ✅ Email/Password authentication
- ✅ Password reset via email
- ✅ Session persistence
- ✅ Automatic profile creation
- ✅ Role-based access control
- ✅ Email verification
- ✅ User metadata support

### **Clerk Auth Features (Legacy)**
- ✅ Email/Password authentication
- ✅ Social login options
- ✅ Multi-factor authentication
- ✅ User management dashboard
- ✅ Role-based access control

---

## 🛠️ **API Changes**

### **Updated Endpoints**
- `GET /api/user/profile` - Now uses Supabase session
- `PUT /api/user/profile` - Updated for Supabase user IDs
- `GET /api/admin/*` - Updated middleware auth checks

### **Authentication Headers**
- **Supabase**: Uses session cookies (no headers needed)
- **Clerk**: Uses `Authorization: Bearer <token>` (legacy)

---

## 🧪 **Testing the Migration**

### **Test Supabase Auth**
```bash
# Navigate to Supabase auth pages
http://localhost:3000/auth/sign-up
http://localhost:3000/auth/sign-in

# Test profile creation
http://localhost:3000/profile

# Test admin access (if admin role set)
http://localhost:3000/admin
```

### **Test Clerk Auth (Legacy)**
```bash
# Navigate to Clerk auth pages
http://localhost:3000/sign-up
http://localhost:3000/sign-in

# Test existing functionality
http://localhost:3000/profile
```

---

## 🔄 **Migration Strategy**

### **Phase 1: Dual Provider Support** ✅
- Both Supabase and Clerk available
- Users can choose auth method
- Existing Clerk users unaffected

### **Phase 2: Gradual Migration**
- Encourage users to migrate to Supabase
- Provide migration tools
- Maintain Clerk for legacy users

### **Phase 3: Supabase Only (Future)**
- Deprecate Clerk auth
- Migrate all remaining users
- Remove Clerk dependencies

---

## 🚨 **Important Notes**

### **Database Changes**
- User IDs now use Supabase UUIDs instead of Clerk IDs
- Existing Clerk users remain in database with `clerk_id`
- New users get `id` field with Supabase UUID

### **Session Management**
- Supabase uses HTTP-only cookies
- Clerk uses JWT tokens
- Middleware handles both authentication methods

### **Role Management**
- Supabase: Roles stored in database
- Clerk: Roles stored in metadata (legacy)
- Both systems respect role-based access

---

## 🆘 **Troubleshooting**

### **Common Issues**

#### **Supabase Auth Not Working**
```bash
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL

# Verify Supabase project settings
# Go to Supabase Dashboard → Authentication → Settings
```

#### **Middleware Errors**
```bash
# Check if middleware is using correct auth
# Look for createMiddlewareClient usage
```

#### **Profile Creation Issues**
```bash
# Check database schema
# Verify users table has id column
# Check RLS policies
```

---

## 📞 **Support**

For issues with this migration:

1. **Check logs** in both Supabase and Clerk dashboards
2. **Verify environment variables** are correctly set
3. **Test both authentication methods** separately
4. **Check database schema** matches requirements

---

## 🎯 **Next Steps**

1. **Test Supabase Auth** thoroughly
2. **Update remaining API endpoints**
3. **Create user migration tools**
4. **Update documentation**
5. **Monitor authentication metrics**

**🎉 Your application now supports dual authentication providers!**
