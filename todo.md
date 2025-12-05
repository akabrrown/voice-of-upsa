# Voice of UPSA - Full Stack Website Todo List

## Project Overview
A news website for UPSA with user roles (Users, Admin, Editor), built with Next.js, Express.js, Supabase, Supabase Auth, Cloudinary, and TailwindCSS.

**Tech Stack:** Next.js (TypeScript), Express.js, Supabase, Supabase Auth, Cloudinary, TailwindCSS, Material UI, Framer Motion
**Color Scheme:** Navy Blue (#001F3F), Golden Yellow (#FFD700), Black (#000000), White (#FFFFFF)
**Deployment:** Netlify | **Database:** Supabase | **Authentication:** Supabase| **Storage:** Cloudinary

---

## Phase 1: Project Setup & Configuration

### 1.1 Directory Structure
- [x] Create single root directory (no separate frontend/backend folders)
- [x] Create `/pages` (Next.js frontend)
- [x] Create `/api` (Express.js backend routes)
- [x] Create `/lib` (shared utilities, types, API calls)
- [x] Create `/components` (React components)
- [x] Create `/styles` (TailwindCSS configurations)
  - [x] `globals.css` - Global styles with Tailwind directives and custom CSS variables
  - [x] `components/` folder for component-specific CSS files
  - [x] `pages/` folder for page-specific CSS files
- [x] Create `/public` (static assets, icons)
- [x] Create `/middleware` (authentication, logging)
- [x] Create `.env` for environment variables
- [x] Create `next.config.js` and `tsconfig.json`

### 1.4 CSS Files Structure

#### 1.4.1 Global Styles
- [x] `styles/globals.css` - Main global stylesheet
  - [x] Tailwind CSS base directives (@tailwind base, components, utilities)
  - [x] Custom CSS variables for UPSA theme colors
  - [x] Global typography styles
  - [x] Dark mode CSS variables
  - [x] Base HTML and body styles

#### 1.4.2 Component-Specific CSS
- [x] `styles/components/Layout.css` - Layout component styles
  - [x] Header and navigation styles
  - [x] Footer styles
  - [x] Sidebar styles
  - [x] Responsive breakpoints
- [x] `styles/components/ArticleCard.css` - Article card component styles
  - [x] Card layout and hover effects
  - [x] Image aspect ratios
  - [x] Typography hierarchy
- [x] `styles/components/Buttons.css` - Button component styles
  - [x] Primary, secondary, tertiary button variants
  - [x] Hover and active states
  - [x] Loading states
- [x] `styles/components/Forms.css` - Form component styles
  - [x] Input, textarea, select styling
  - [x] Form validation states
  - [x] Label and helper text styles
- [x] `styles/components/Modal.css` - Modal component styles
  - [x] Overlay and backdrop
  - [x] Modal positioning and animations
  - [x] Close button styling

#### 1.4.3 Page-Specific CSS
- [x] `styles/pages/Home.css` - Homepage specific styles
  - [x] Hero section styling
  - [x] Featured article grid
  - [x] Article card animations
- [x] `styles/pages/Articles.css` - Articles listing page styles
  - [x] Article grid layout
  - [x] Filter and search styling
  - [x] Pagination styles
- [x] `styles/pages/ArticleDetail.css` - Individual article page styles
  - [x] Article typography and readability
  - [x] Comment section styling
  - [x] Social sharing buttons
- [x] `styles/pages/Admin.css` - Admin dashboard styles
  - [x] Dashboard grid layout
  - [x] Table styling for data management
  - [x] Chart and stats card styling
- [x] `styles/pages/Profile.css` - User profile page styles
  - [x] Profile header and avatar
  - [x] User stats display
  - [x] Profile form styling
- [x] `styles/pages/Search.css` - Search results page styles
  - [x] Search input and filters
  - [x] Results highlighting
  - [x] Tab navigation styling
- [x] `styles/pages/Privacy.css` - Privacy policy page styles
- [x] `styles/pages/Terms.css` - Terms of service page styles
- [x] `styles/pages/Newsletter.css` - Newsletter subscription page styles
- [x] `styles/pages/Social.css` - Social media connections page styles
- [x] `styles/pages/Rss.css` - RSS feed information page styles

#### 1.4.4 Utility and Helper CSS
- [x] `styles/utilities/Animations.css` - Custom animation classes
  - [x] Fade in/out animations
  - [x] Slide animations
  - [x] Loading spinners
- [x] `styles/utilities/Typography.css` - Typography utilities
  - [x] Text size and weight utilities
  - [x] Line height and spacing utilities
  - [x] Text color utilities
- [x] `styles/utilities/Spacing.css` - Custom spacing utilities
  - [x] Margin and padding utilities
  - [x] Gap utilities for flexbox/grid
- [x] `styles/utilities/Responsive.css` - Responsive utilities
  - [x] Show/hide utilities for breakpoints
  - [x] Custom responsive grid systems

### 1.2 Dependencies Installation
- [x] Install Next.js with TypeScript
- [x] Install Express.js and necessary middleware (cors, body-parser, dotenv)
- [x] Install Supabase client (`@supabase/supabase-js`, `@supabase/ssr`)
- [x] Install Cloudinary SDK (`next-cloudinary`, `cloudinary`)
- [x] Install TailwindCSS and PostCSS
- [x] Install Material UI (`@mui/material`, `@mui/icons-material`)
- [x] Install Framer Motion for animations
- [x] Install React Icons for additional icons
- [x] Install axios for API requests
- [x] Install react-hot-toast for notifications
- [x] Install next-themes for light/dark mode


---

## Phase 2: Database Design & Setup (Supabase)  COMPLETED

### 2.1 Database Tables
- [x] **users table:** id (UUID), email, name, role (enum: user/admin/editor), avatar_url, bio, created_at, updated_at
- [x] **articles table:** id (UUID), title, slug (unique), content, excerpt, featured_image, author_id (FK users), status (enum: draft/published/archived), views_count, created_at, updated_at, published_at
- [x] **comments table:** id (UUID), article_id (FK articles), user_id (FK users), content, likes_count, created_at, updated_at
- [x] **likes table:** id (UUID), article_id (FK articles), user_id (FK users), type (enum: like/unlike), created_at (unique constraint on article_id + user_id)
- [x] **reactions table:** id (UUID), article_id (FK articles), user_id (FK users), reaction_type (enum: thumbsup/heart/laugh/wow/sad), created_at
- [x] **cloudinary_uploads table:** id (UUID), user_id (FK users), cloudinary_public_id, cloudinary_url, resource_type, upload_date

### 2.2 Row Level Security (RLS)
- [x] Enable RLS on all tables
- [x] Set users can read public data
- [x] Set editors can create/edit/delete articles
- [x] Set admins have full access
- [x] Set users can create comments and reactions
- [x] Set users can only delete their own comments

### 2.3 Indexes & Constraints
- [x] Create index on articles(author_id)
- [x] Create index on comments(article_id)
- [x] Create index on likes(article_id)
- [x] Create index on reactions(article_id)

---

## Phase 3: Backend Setup (Express.js in /api)

### 3.1 Express Server Configuration
- [x] Create `/api/index.ts` as main server file
- [x] Configure CORS (allow Netlify domain)
- [x] Set up environment variable loading
- [x] Create middleware folder with auth, error handling
- [x] Configure body-parser middleware
- [x] Set up logging middleware

### 3.2 Authentication Endpoints
- [x] POST `/api/auth/sign-up` - Create new user with Supabase
- [x] POST `/api/auth/sign-in` - Authenticate user with Supabase
- [x] POST `/api/auth/sign-out` - Sign out user
- [x] GET `/api/auth/user` - Get current user profile
- [x] POST `/api/auth/reset-password` - Send password reset email
- [x] Middleware to verify Supabase token on protected routes

### 3.3 User Management Endpoints
- [x] GET `/api/users/:id` - Get user profile
- [x] PUT `/api/users/:id` - Update user profile (bio, avatar)
- [x] GET `/api/users/:id/articles` - Get user's articles
- [x] PATCH `/api/users/:id/role` - Update user role (admin only)

### 3.4 Article Endpoints
- [x] GET `/api/articles` - List all published articles (pagination, filters)
- [x] GET `/api/articles/:id` - Get single article with comments
- [x] POST `/api/articles` - Create new article (editor/admin only)
- [x] PUT `/api/articles/:id` - Update article (editor/admin only)
- [x] DELETE `/api/articles/:id` - Delete article (editor/admin only)
- [x] PATCH `/api/articles/:id/views` - Increment view count
- [x] GET `/api/articles/search/:query` - Search articles
- [x] GET `/api/articles/trending` - Get trending articles (most viewed/liked)

### 3.5 Comment Endpoints
- [x] GET `/api/articles/:id/comments` - Get comments for article
- [x] POST `/api/articles/:id/comments` - Create comment
- [x] DELETE `/api/comments/:id` - Delete comment (own or admin)
- [x] PUT `/api/comments/:id` - Edit comment (own or admin)

### 3.6 Likes & Reactions Endpoints
- [x] POST `/api/articles/:id/like` - Like article
- [x] DELETE `/api/articles/:id/like` - Unlike article
- [x] POST `/api/articles/:id/reactions` - Add reaction (emoji-based)
- [x] DELETE `/api/articles/:id/reactions/:type` - Remove reaction
- [x] GET `/api/articles/:id/reactions-count` - Get reaction counts

### 3.7 Cloudinary Integration Endpoints
- [x] POST `/api/upload/image` - Upload image to Cloudinary and save metadata to Supabase
- [x] DELETE `/api/upload/:publicId` - Delete image from Cloudinary
- [x] GET `/api/uploads` - List user uploads
- [x] GET `/api/uploads` - List user uploads

### 3.8 Error Handling
- [x] Create error handling middleware
- [x] Standardized error response format
- [x] Proper HTTP status codes
- [x] Detailed error logging

---

## Phase 4: Frontend Setup (Next.js Pages & Components)

### 4.1 Supabase Integration
- [x] Install and configure Supabase in `_app.tsx`
- [x] Create SupabaseProvider for authentication context
- [x] Set up authentication middleware for protected routes
- [x] Create `<SupabaseProvider>` wrapper
- [x] Implement user session management

### 4.2 Theme & Styling
- [x] Configure TailwindCSS with navy, golden, black, white colors
- [x] Set up CSS variables for consistent theming
- [x] Install and configure next-themes for light/dark mode
- [x] Create theme provider component
- [x] Create custom TailwindCSS utilities
- [x] Add Material UI theme configuration

### 4.3 Layouts
- [x] Create main layout component (`/components/Layout.tsx`)
- [x] Create header/navbar component with responsive design
- [x] Create footer component
- [x] Add logo and branding elements
- [x] Navigation links with role-based visibility (User, Editor, Admin)

### 4.4 Public Pages
- [x] `pages/index.tsx` - Homepage with featured articles, latest news
- [x] `pages/articles/index.tsx` - All articles page with filtering/pagination
- [x] `pages/articles/[slug].tsx` - Single article page with comments, likes, reactions
- [x] `pages/about.tsx` - About UPSA page
- [x] `pages/contact.tsx` - Contact page
- [x] `pages/search/[query].tsx` - Search results page
- [x] `pages/privacy.tsx` - Privacy policy page
- [x] `pages/terms.tsx` - Terms of service page
- [x] `pages/newsletter.tsx` - Newsletter subscription page
- [x] `pages/social.tsx` - Social media connections page
- [x] `pages/rss.tsx` - RSS feed information page

### 4.5 User Dashboard Pages
- [x] `pages/dashboard/index.tsx` - User dashboard (bookmark articles, reading history)
- [x] `pages/dashboard/profile.tsx` - User profile editing
- [x] `pages/dashboard/my-articles.tsx` - User's own articles (editors/admins)

### 4.6 Editor Pages
- [x] `pages/editor/create.tsx` - Create new article
- [x] `pages/editor/[id]/edit.tsx` - Edit existing article
- [x] `pages/editor/articles.tsx` - Manage articles (draft, published, archived)

### 4.7 Admin Pages
- [x] `pages/admin/dashboard.tsx` - Admin dashboard with stats
- [x] `pages/admin/users.tsx` - Manage users (role assignment)
- [x] `pages/admin/articles.tsx` - Moderate articles
- [x] `pages/admin/comments.tsx` - Moderate comments
- [x] `pages/admin/settings.tsx` - Website settings

### 4.8 Authentication Pages
- [x] `pages/auth/sign-in.tsx` - Supabase sign-in (custom styling)
- [x] `pages/auth/sign-up.tsx` - Supabase sign-up (custom styling)
- [x] `pages/auth/reset-password.tsx` - Password reset page

---

## Phase 5: Component Development

### 5.1 Reusable Components
- [x] `<Button>` - Styled button with variants (primary, secondary, danger)
- [x] `<Card>` - Article card component with hover animation
- [x] `<Badge>` - Category/status badge
- [x] `<Avatar>` - User avatar with fallback
- [x] `<Loading>` - Loading spinner with animation
- [x] `<Modal>` - Reusable modal component
- [x] `<Toast>` - Toast notification (using react-hot-toast)
- [x] `<Icon>` - Icon wrapper with theme support
- [x] `<Pagination>` - Pagination component

### 5.2 Article Components
- [x] `<ArticleCard>` - Display article preview with image, title, excerpt
- [x] `<ArticleHero>` - Hero section with featured image and title
- [x] `<ArticleContent>` - Article body with rich formatting
- [x] `<ArticleMetadata>` - Author, date, reading time info
- [x] `<ArticleActions>` - Like, reaction, share buttons
- [x] `<FeaturedArticles>` - Carousel of featured articles
- [x] `<TrendingArticles>` - Trending articles sidebar

### 5.3 Comment Components
- [x] `<CommentSection>` - Comments list with threading
- [x] `<CommentForm>` - Create/edit comment form
- [x] `<CommentCard>` - Individual comment display
- [x] `<CommentActions>` - Edit, delete, like buttons

### 5.4 Reaction Components
- [x] `<ReactionBar>` - Emoji reaction buttons
- [x] `<ReactionCount>` - Display reaction counts

### 5.5 Navigation & Layout Components
- [x] `<Header>` - Navigation bar with logo, menu, auth
- [x] `<Sidebar>` - Navigation sidebar (for admin/editor)
- [x] `<Footer>` - Footer with links, copyright
- [x] `<BreadcrumbNavigation>` - Breadcrumb trail
- [x] `<MobileMenu>` - Mobile navigation drawer

### 5.6 Form Components
- [x] `<ArticleForm>` - Create/edit article form with rich text editor
- [x] `<ImageUpload>` - Image upload with Cloudinary preview
- [x] `<UserProfileForm>` - Edit profile form
- [x] `<SearchBar>` - Search input with suggestions

### 5.7 Admin Components
- [x] `<UserTable>` - User management table
- [x] `<ArticleTable>` - Article management table
- [x] `<StatsCard>` - Dashboard stats card
- [x] `<DashboardChart>` - Simple analytics chart (article count, views)

---

## Phase 6: Features Implementation

### 6.1 Light/Dark Mode
- [x] Install next-themes
- [x] Create theme provider with local storage
- [x] Add theme toggle button in header
- [x] Apply theme colors to all components
- [x] Ensure smooth transitions between themes
- [x] Test on all pages and components

### 6.2 Animations
- [x] Install Framer Motion
- [x] Add fade-in animations to page loads
- [x] Add hover animations to cards and buttons
- [x] Add stagger animation to article lists
- [x] Add smooth transitions to modals and drawers
- [x] Add scroll animations (reveal on scroll)
- [x] Add loading animations to spinners
- [x] Ensure animations respect prefers-reduced-motion

### 6.3 Icons Integration
- [x] Install React Icons
- [x] Create icon components for: heart, comment, share, search, menu, close, etc.
- [x] Use Material UI icons for admin/editor functions
- [x] Add navbar icons with tooltips
- [x] Create icon sprite/system for consistency

### 6.4 Article Management
- [x] Implement rich text editor (consider using EditorJS or Slate)
- [x] Article status management (draft, published, archived)
- [x] Article slug generation
- [x] Featured image upload via Cloudinary
- [x] Article metadata (author, date, reading time)
- [x] Article search and filtering

### 6.5 Comments System
- [x] Display comments in chronological order
- [x] Create comment form with validation
- [x] Edit own comments
- [x] Delete own comments (admins can delete any)
- [x] Comment notifications to article author
- [x] Profanity filter for comments

### 6.6 Like & React System
- [x] Like/unlike article functionality
- [x] Emoji reactions (thumbsup, heart, laugh, wow, sad)
- [x] Display reaction counts
- [x] Prevent duplicate likes/reactions
- [x] Real-time update of counts

### 6.7 Cloudinary Integration
- [x] Set up Cloudinary account and API credentials
- [x] Create image upload endpoint in Express
- [x] Save upload metadata to Supabase cloudinary_uploads table
- [x] Image transformation for different sizes (thumbnail, full-size)
- [x] Add image optimization (lazy loading, responsive images)
- [x] Implement image deletion from Cloudinary
- [x] Add drag-and-drop image upload

### 6.8 Supabase User Management
- [x] Create user authentication flow with Supabase Auth
- [x] Handle user creation in users table on signup
- [x] Handle user profile updates
- [x] Handle user deletion and cleanup
- [x] Implement proper session management
- [x] Error handling and retry logic for auth operations
- [x] User role management through metadata

---

## Phase 7: Responsiveness & Cross-Browser Testing

### 7.1 Responsive Design
- [x] Mobile-first approach (320px and up)
- [x] Tablet breakpoints (768px)
- [x] Desktop breakpoints (1024px, 1440px)
- [x] Test on iPhone, iPad, Android devices
- [x] Test on Chrome, Firefox, Safari, Edge
- [x] Ensure touch-friendly buttons and links
- [x] Test form inputs on mobile
- [x] Test navigation on small screens

### 7.2 Performance Optimization
- [x] Image optimization (next/image component)
- [x] Code splitting and lazy loading
- [x] Minify CSS and JavaScript
- [x] Compress images with Cloudinary
- [x] Implement caching strategies

### 7.3 Browser Compatibility
- [x] Test on Chrome (latest)
- [x] Test on Firefox (latest)
- [x] Test on Safari (latest)
- [x] Test on Edge (latest)
- [x] Test on mobile browsers
- [x] Check CSS compatibility
- [x] Verify JavaScript compatibility

---

## Phase 8: API Integration & Testing

### 8.1 API Calls & Hooks
- [x] Create custom hooks for data fetching (`useArticles`, `useComments`, etc.)
- [x] Implement error handling and loading states
- [x] Create API client utilities with axios
- [x] Implement request/response interceptors
- [x] Token management for authenticated requests

### 8.2 Data Fetching
- [x] Use Server-Side Rendering (SSR) for article pages
- [x] Use Static Generation (SSG) for homepage
- [x] Implement Incremental Static Regeneration (ISR)
- [x] Fetch real data from Express backend (no mock data)
- [x] Handle loading and error states

### 8.3 Testing
- [x] Test all API endpoints with Postman/Insomnia
- [x] Test user authentication flow
- [x] Test article CRUD operations
- [x] Test comment creation and deletion
- [x] Test like and reaction functionality
- [x] Test image upload and storage
- [x] Test role-based access control

---

## Phase 9: Deployment & Optimization

### 9.1 Netlify Deployment Setup
- [x] Create Netlify account
- [x] Connect GitHub repository
- [x] Configure build command: `npm run build`
- [x] Configure publish directory: `.next`
- [x] Set environment variables in Netlify
- [x] Configure serverless functions for Express routes
- [x] Set up domain and DNS records
- [x] Configure SSL/TLS certificate (automatic with Netlify)

### 9.2 Backend Deployment
- [x] Deploy Express backend to Netlify Functions or Vercel
- [x] Configure CORS for frontend domain
- [x] Set up environment variables
- [x] Test API routes after deployment

### 9.3 Database Security
- [x] Verify Supabase RLS policies are correctly set
- [x] Ensure API keys are not exposed in frontend code
- [x] Rotate API keys regularly
- [x] Monitor Supabase logs for suspicious activity

### 9.4 Optimization Pre-Deployment
- [x] Build optimization and tree-shaking
- [x] Remove unused dependencies
- [x] Optimize bundle size
- [x] Test performance metrics (Lighthouse)
- [x] Fix accessibility issues (a11y)

---

## Phase 10: Documentation & Final Checks

### 10.1 Code Documentation
- [x] Add JSDoc comments to functions
- [x] Document API endpoints
- [x] Create README with setup instructions
- [x] Document environment variables
- [x] Add deployment instructions

### 10.2 Final Testing Checklist
- [x] Test all user roles (User, Editor, Admin)
- [x] Test all CRUD operations
- [x] Test authentication flow
- [x] Test light/dark mode toggle
- [x] Test animations on all pages
- [x] Test responsiveness on all breakpoints
- [x] Test on multiple browsers
- [x] Test comment, like, and reaction functionality
- [x] Test image upload and display
- [x] Test search functionality
- [x] Test error handling and validation
- [x] Verify no console errors or warnings

### 10.3 SEO & Analytics
- [x] Add meta tags to pages
- [x] Implement Open Graph tags for articles
- [x] Create sitemap
- [x] Add robots.txt
- [x] Implement Google Analytics (optional)

### 10.4 Security Final Check
- [x] No sensitive data in code
- [x] No API keys exposed
- [x] Validate all user inputs
- [x] Implement CSRF protection if needed
- [x] Test XSS vulnerabilities
- [x] Check for SQL injection vulnerabilities

---

## Color Palette Reference
```
Navy Blue: #001F3F (primary)
Golden Yellow: #FFD700 (accent)
Black: #000000 (dark text/background)
White: #FFFFFF (light background/text)
```

## Key Technologies
- **Frontend:** Next.js 14+, React 18+, TypeScript
- **Backend:** Express.js
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Storage:** Cloudinary
- **Styling:** TailwindCSS + Material UI
- **Animations:** Framer Motion
- **Icons:** React Icons + Material UI Icons
- **Deployment:** Netlify

## Notes
- No mock data - use real API calls only
- No Sentry integration
- Combined frontend/backend in single directory
- All endpoints must return real data from Supabase
- Use Supabase authentication for all protected routes
- Implement proper error handling and user feedback throughout 
