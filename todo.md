# Voice of UPSA - Development Todo List

## 1. Project Initialization & Infrastructure
- [x] Initialize Next.js 14 project with TypeScript, Tailwind CSS, and App Router.
- [x] Configure `tailwind.config.ts` with UPSA brand colors and typography.
- [x] Set up project folder structure (Section 11).
- [x] Install core dependencies (Supabase, Cloudinary, shadcn/ui, etc.).

## 2. Branding & Foundation
- [x] Implement `index.css` with UPSA color tokens and base styles.
- [x] Create persistent Navigation Bar (Navy Blue #003366, Gold #C9A84C accents).
- [x] Create persistent Footer with UPSA branding.
- [x] Implement Breaking News Ticker component.

## 3. Database & Authentication
- [x] Set up Supabase project and database schema (profiles, articles, categories, ads).
- [ ] Configure Row-Level Security (RLS) policies for each role.
- [x] Implement Authentication (Email/Password, Google OAuth) UI and validation.
- [x] Set up Middleware for route protection and RBAC.

## 4. Public Pages
- [x] **Homepage**: Hero banner, Category grid, Latest Articles, Trending Sidebar.
- [x] **Article Detail**: Rich text rendering, metadata, social share, related articles.
- [x] **Category Pages**: Paginated lists, sorting, category headers.
- [x] **Search**: Full-text search results with filtering.
- [x] **Static Pages**: About Us (team bios), Contact Us (with form), Advertise (pricing).

## 5. Editor Dashboard
- [x] Article management table (Drafts, Published, Reviews) UI.
- [x] WYSIWYG Editor (Tiptap) with toolbar.
- [x] SEO field configuration UI.
- [ ] Scheduled publishing logic.

## 6. Admin Dashboard
- [x] Overview dashboard with basic analytics.
- [x] User management (Role assignment, account suspension) UI.
- [x] Article moderation and global management UI.
- [x] Advertisement review and approval workflow UI.
- [ ] Audit logs and site settings.

## 7. Advertising & Media
- [x] Ad submission form.
- [x] Ad display components for Leaderboard, Sidebar, and In-feed.
- [ ] Impression tracking logic.
- [x] Cloudinary server-side upload handler integration.

## 8. SEO, Security & Performance
- [ ] Configure Next.js Metadata API and Sitemap.
- [ ] Implement security headers and input sanitization (DOMPurify).
- [ ] Set up Sentry error tracking and Vercel Analytics.
- [ ] Final performance audit (WebP, Lazy loading, Core Web Vitals).

## 9. Launch Preparation
- [ ] Run Pre-Launch Security Checklist (Section 16).
- [ ] Verify responsive design across Desktop, Tablet, and Mobile.
- [ ] Final content population and testing.
