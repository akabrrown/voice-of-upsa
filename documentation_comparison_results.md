# DOCUMENTATION COMPARISON RESULTS
## Voice of UPSA — Feature & Component Gap Analysis

This document identifies the features, technical components, and specifications present in the **System Design Documentation (.md)** that are absent or less detailed in the **MVP Documentation (.docx)**.

---

### 1. TECHNICAL STACK & DEPENDENCIES
The System Design document specifies exact versions and a wider array of specialized libraries:
- **Core Versions:** Next.js 15 (App Router), React 19 (Beta features), TypeScript 5.7, Tailwind CSS 4.0.
- **UI Components:** Full Radix UI suite (23+ packages), `shadcn/ui` primitives, `framer-motion` for animations, and `lucide-react` for iconography.
- **State Management:** TanStack Query v5 (Server State) and Zustand v5 (Client State).
- **Rich Text Editor:** Detailed TipTap integration with 11+ specific extensions (Tables, Images, Underline, etc.).
- **Utilities:** `jose` (JWT), `date-fns` v4, `isomorphic-dompurify` (XSS), `zxcvbn` (Password strength).
- **Monitoring:** Sentry Next.js integration for error tracking.

### 2. DATABASE SCHEMA (TECHNICAL BLUEPRINT)
While the .docx file lists high-level tables, the .md file provides a complete SQL blueprint:
- **SQL Implementation:** Complete `CREATE TABLE` scripts with specific data types (UUID, JSONB, TIMESTAMPTZ).
- **Row Level Security (RLS):** Specific PostgreSQL policies defined for every table to ensure data isolation.
- **Indexing Strategy:** Defined indexes for performance (`idx_articles_status`, `idx_activity_user`, etc.).
- **Detailed Tables:** Detailed specifications for:
    - `profiles`: Extended user data.
    - `user_roles`: Mapping users to permissions.
    - `activity_log`: Detailed audit trail including IP and User Agent.
    - `notifications`: Real-time user alert system.
    - `article_images`: Cloudinary metadata storage.

### 3. API ARCHITECTURE & DESIGN
The System Design document defines a complete RESTful API structure that is entirely missing from the .docx:
- **REST Endpoints:** Defined routes for Articles, Categories, Comments, Auth, Users, Media, Ads, and Search.
- **Role Requirements:** Specific mapping of roles (Admin, Editor, Public) to each HTTP method (GET, POST, PATCH, DELETE).
- **Response Standards:** Standardized JSON structures for Success and Error responses.
- **Rate Limiting:** Specific request limits and windows defined per endpoint (e.g., Auth: 5 requests/min).

### 4. ROLE-BASED ACCESS CONTROL (RBAC)
The .md file provides a much deeper granular control system:
- **Permission Matrix:** A 17-point matrix mapping specific features to each user role.
- **JSON Permissions:** Roles defined with JSONB permission objects (e.g., `{"articles": ["create", "publish"]}`).
- **Special Actions:** specific roles for "Pinning", "Featuring", and "Approving Advertisements".

### 5. SECURITY ARCHITECTURE
The System Design includes a massive section on security not found in the .docx:
- **OWASP Top 10 Matrix:** A comprehensive table mapping OWASP risks to specific platform prevention strategies.
- **Security Headers:** Exact `middleware.ts` configuration for CSP (Content Security Policy), HSTS, X-Frame-Options, etc.
- **Input Sanitization:** Multi-layer strategy using Zod for validation and DOMPurify for HTML sanitization.
- **CSRF & Clickjacking:** Specific implementations like Double-submit cookie patterns.

### 6. INFRASTRUCTURE & INTEGRATIONS
- **Supabase Integration:** Detailed configuration for `createBrowserClient` and `createServerSupabaseClient`.
- **Cloudinary Strategy:** Specific "Upload Preset" JSON configuration and Image Transformation tables (Article thumbnails vs. Ad banners).
- **Edge Functions:** Logic for auto-assigning roles to new users and processing background tasks.
- **Realtime Channels:** Defined WebSocket channels for live comments and admin alerts.

### 7. PERFORMANCE & ACCESSIBILITY
- **Core Web Vitals:** Specific targets (LCP < 2.5s, FID < 100ms, CLS < 0.1).
- **A11Y Checklist:** 8-point accessibility plan including WCAG 2.1 AA compliance, Keyboard Navigation, and Skip Links.
- **Optimization Strategy:** Detailed ISR (Incremental Static Regeneration) revalidation timers (60s).

### 8. DEVELOPMENT WORKFLOW (DEVOPS)
- **Testing Suite:** Defined setup for Vitest (Unit), Playwright (E2E), and MSW (API Mocking).
- **Git Hooks:** Implementation of Husky, lint-staged, and Commitlint for code quality.
- **Build Tools:** Support for Turbopack for faster development cycles.
