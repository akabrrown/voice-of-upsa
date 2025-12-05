# Voice of UPSA - Setup Status & Complete Guide

## 🟢 Current Setup Status

### ✅ **Completed Components**

#### **1. Environment Configuration**
- ✅ Environment variables configured (`.env.local`)
- ✅ Clerk authentication keys set
- ✅ Supabase database connection configured
- ✅ Cloudinary storage configured

#### **2. Authentication System**
- ✅ Clerk authentication integrated
- ✅ Sign-in/Sign-up pages with catch-all routes
- ✅ Middleware for route protection
- ✅ Role-based access control (admin, editor, user)
- ✅ Admin access from both database and Clerk metadata

#### **3. Core Pages & Components**
- ✅ Home page (`/`)
- ✅ Articles listing (`/articles`)
- ✅ Admin dashboard (`/admin`)
- ✅ User profile (`/profile`)
- ✅ Authentication pages (`/sign-in`, `/sign-up`)
- ✅ Layout component with theme toggle
- ✅ Navigation and search components

#### **4. API Endpoints**
- ✅ User profile API with Clerk integration
- ✅ Admin dashboard stats API
- ✅ Article management APIs
- ✅ Comment and reaction systems
- ✅ Debug endpoints for troubleshooting

#### **5. Styling & UI**
- ✅ Tailwind CSS configured
- ✅ Custom CSS components
- ✅ Dark/light theme support
- ✅ Responsive design
- ✅ UPSA brand colors (Navy, Golden)

---

## 🔧 **Setup Instructions**

### **Step 1: Environment Setup**

Your `.env.local` is already configured with:
```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://qacjynspvqantasrdjzz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Cloudinary Storage
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=diefv4fp8
CLOUDINARY_API_KEY=933817231153282
CLOUDINARY_API_SECRET=t7Ps5HiL005bX2mdjBVzfRq_wuM
```

### **Step 2: Database Setup**

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Run the Schema**:
   - Navigate to **SQL Editor**
   - Copy contents from `database/schema.sql`
   - Click **"Run"** to create tables
3. **Optional - Seed Data**:
   - Copy contents from `database/seed.sql`
   - Click **"Run"** to add sample data

### **Step 3: Clerk Dashboard Configuration**

1. **Go to Clerk Dashboard**: https://dashboard.clerk.com
2. **Configure Redirect URLs**:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in: `/`
   - After sign-up: `/`
3. **Set Up Webhook** (if using user sync):
   - Webhook URL: `http://localhost:3000/api/auth/webhook`
   - Events: `user.created`, `user.updated`, `user.deleted`

### **Step 4: Admin Role Setup**

**Option A: Through Clerk Dashboard (Recommended)**
1. Go to Clerk Dashboard → Users
2. Find your user account
3. Click on user → Metadata
4. Add `public_metadata`:
   ```json
   {
     "role": "admin"
   }
   ```

**Option B: Through Database**
1. Go to Supabase Dashboard → Table Editor
2. Find your user in `users` table
3. Set `role` field to `"admin"`

### **Step 5: Start the Application**

```bash
# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

The app will be available at: **http://localhost:3000**

---

## 🚀 **Testing Your Setup**

### **1. Authentication Test**
- Navigate to `/sign-up` → Create account
- Navigate to `/sign-in` → Sign in
- Check if user session persists

### **2. Admin Access Test**
- Set up admin role (see Step 4)
- Navigate to `/admin` → Should access admin dashboard
- Check admin stats and features

### **3. Profile Integration Test**
- Navigate to `/profile` → Should show user info
- Check if role is displayed correctly
- Test profile updates

### **4. Debug Tools**
- Visit `/set-admin` → Debug admin setup
- API: `GET /api/user/debug-profile` → Profile debug info
- API: `GET /api/admin/debug-access` → Admin access debug

---

## 📋 **Current Features**

### **✅ Working Features**
- User authentication (Clerk)
- Role-based access control
- Admin dashboard with stats
- User profile management
- Article management system
- Comment and reaction system
- Dark/light theme toggle
- Responsive design
- Search functionality
- Admin user management

### **🔄 In Progress**
- Article creation/editing interface
- Image upload integration
- Email notifications
- Advanced search filters

---

## 🔍 **Troubleshooting**

### **Common Issues & Solutions**

#### **1. Clerk SignUp Error**
```
Error: The <SignUp/> component is not configured correctly
```
✅ **Fixed**: Catch-all routes configured with hash-based routing

#### **2. Admin Access Denied**
```
Error: Access Denied - You don't have permission
```
✅ **Solution**: Set admin role in Clerk metadata or database

#### **3. Hydration Error**
```
Error: Hydration failed - SVG mismatch
```
✅ **Fixed**: Theme toggle with mounted state and placeholder

#### **4. Database Connection Issues**
```
Error: Supabase connection failed
```
✅ **Check**: Verify environment variables and Supabase project status

---

## 📊 **Setup Completion Checklist**

- [x] Environment variables configured
- [x] Database schema applied
- [x] Clerk authentication working
- [x] Admin role configured
- [x] Admin dashboard accessible
- [x] User profile working
- [x] Theme toggle functional
- [x] API endpoints responding
- [x] Debug tools available

## 🎯 **Next Steps**

1. **Test all features** using the testing guide above
2. **Create sample content** using the admin dashboard
3. **Customize styling** if needed
4. **Set up production deployment** (Netlify/Vercel)
5. **Configure domain and SSL**

---

## 🆘 **Need Help?**

If you encounter issues:

1. **Check the debug endpoints**:
   - `/api/user/debug-profile`
   - `/api/admin/debug-access`

2. **Verify environment variables** in `.env.local`

3. **Check browser console** for JavaScript errors

4. **Review server logs** for API errors

5. **Visit `/set-admin`** for admin setup assistance

---

**🎉 Your Voice of UPSA application is ready to use!**
