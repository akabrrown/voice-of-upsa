# VOICE OF UPSA — COMPLETE SYSTEM DESIGN DOCUMENTATION
## University News & Updates Platform

**Version:** 1.0 (MVP)  
**Date:** May 2026  
**Institution:** University of Professional Studies, Accra (UPSA)  
**Platform Name:** Voice of UPSA  
**Status:** Pre-Development / Planning Phase

---

# TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Brand Identity & Design System](#2-brand-identity--design-system)
3. [Architecture Overview](#3-architecture-overview)
4. [Technology Stack](#4-technology-stack)
5. [Database Schema Design](#5-database-schema-design)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Role-Based Access Control (RBAC)](#7-role-based-access-control-rbac)
8. [Feature Specifications](#8-feature-specifications)
9. [MVP Features List](#9-mvp-features-list)
10. [API Design](#10-api-design)
11. [Security Architecture](#11-security-architecture)
12. [Cloudinary Integration](#12-cloudinary-integration)
13. [Supabase Integration](#13-supabase-integration)
14. [Complete Dependencies & Libraries](#14-complete-dependencies--libraries)
15. [Vulnerability Prevention Matrix](#15-vulnerability-prevention-matrix)
16. [Deployment Architecture](#16-deployment-architecture)
17. [Performance & Optimization](#17-performance--optimization)
18. [Testing Strategy](#18-testing-strategy)
19. [SEO & Accessibility](#19-seo--accessibility)
20. [Analytics & Monitoring](#20-analytics--monitoring)
21. [Future Roadmap (Post-MVP)](#21-future-roadmap-post-mvp)
22. [Appendices](#22-appendices)

---

# 1. EXECUTIVE SUMMARY

### 1.1 Project Overview
**Voice of UPSA** is a modern, responsive university news and content platform designed to serve the University of Professional Studies, Accra (UPSA) community. The platform will function as the primary digital channel for disseminating news, academic updates, campus events, sports coverage, opinion pieces, and featured stories to students, faculty, staff, alumni, and the general public.

### 1.2 Target Audience
| Audience Segment | Description |
|-----------------|-------------|
| **Students** | Undergraduate and postgraduate students seeking campus news |
| **Faculty & Staff** | Academic and administrative personnel |
| **Alumni** | Former students staying connected with university developments |
| **Prospective Students** | Individuals considering admission to UPSA |
| **General Public** | Media, researchers, and community members |
| **Advertisers** | Businesses and organizations targeting the UPSA community |

### 1.3 Core Objectives
- Provide a centralized, reliable source of university news and information
- Enable multi-role content management (Admin, Editor, Public)
- Support both authenticated and anonymous readership
- Generate revenue through targeted advertising
- Maintain strict brand consistency with UPSA's official identity
- Ensure high security, performance, and accessibility standards

### 1.4 Platform Type
- **Frontend:** Next.js 15 (App Router) — Full-stack React framework
- **Backend:** Supabase (PostgreSQL + Auth + Realtime + Storage)
- **Media Storage:** Cloudinary (Images, Videos, Documents)
- **Hosting:** Vercel (Frontend) + Supabase Cloud (Backend)

---

# 2. BRAND IDENTITY & DESIGN SYSTEM

## 2.1 Official UPSA Colors

Based on the official UPSA brand guidelines, the following colors are extracted and verified:

### Primary Colors

| Color Name | Hex Code | RGB | CMYK | PANTONE | Usage |
|-----------|----------|-----|------|---------|-------|
| **UPSA Navy Blue** | `#00004E` | `rgb(0, 0, 78)` | C:100, M:100, Y:0, K:69 | PANTONE 281C | Primary brand color, headers, navigation, buttons |
| **UPSA Gold** | `#D4AF37` | `rgb(212, 175, 55)` | C:10, M:28, Y:100, K:23 | PANTONE 1245C | Accents, highlights, CTAs, badges, icons |
| **UPSA White** | `#FFFFFF` | `rgb(255, 255, 255)` | C:0, M:0, Y:0, K:0 | — | Backgrounds, text on dark, cards |

### Secondary / Derived Colors

| Color Name | Hex Code | Usage |
|-----------|----------|-------|
| **Navy Light** | `#1A1A6E` | Hover states, secondary backgrounds |
| **Navy Dark** | `#000033` | Deep backgrounds, footer |
| **Gold Light** | `#E8C96A` | Hover gold elements, gradients |
| **Gold Dark** | `#B8960C` | Active states, pressed buttons |
| **Gray 100** | `#F5F5F5` | Light backgrounds, card backgrounds |
| **Gray 200** | `#E5E5E5` | Borders, dividers |
| **Gray 300** | `#D4D4D4` | Disabled states |
| **Gray 500** | `#737373` | Secondary text, captions |
| **Gray 700** | `#404040` | Body text |
| **Gray 900** | `#171717` | Primary text, headings |
| **Error Red** | `#DC2626` | Error messages, validation |
| **Success Green** | `#16A34A` | Success states, confirmations |
| **Warning Amber** | `#F59E0B` | Warnings, alerts |
| **Info Blue** | `#2563EB` | Informational messages |

### 2.2 Typography System

| Element | Font Family | Weight | Size (Desktop) | Size (Mobile) | Line Height | Color |
|---------|-------------|--------|----------------|---------------|-------------|-------|
| **H1 (Hero)** | Inter / system-ui | 800 | 48px | 32px | 1.1 | Navy Blue |
| **H2 (Section)** | Inter / system-ui | 700 | 36px | 28px | 1.2 | Navy Blue |
| **H3 (Card Title)** | Inter / system-ui | 600 | 24px | 20px | 1.3 | Gray 900 |
| **H4 (Subsection)** | Inter / system-ui | 600 | 20px | 18px | 1.4 | Gray 900 |
| **Body** | Inter / system-ui | 400 | 16px | 15px | 1.6 | Gray 700 |
| **Body Small** | Inter / system-ui | 400 | 14px | 13px | 1.5 | Gray 500 |
| **Caption** | Inter / system-ui | 400 | 12px | 11px | 1.4 | Gray 500 |
| **Button** | Inter / system-ui | 600 | 14px | 14px | 1 | White / Navy |
| **Nav Link** | Inter / system-ui | 500 | 15px | 14px | 1 | White / Navy |
| **Label** | Inter / system-ui | 500 | 12px | 12px | 1.2 | Gray 500 |

### 2.3 Spacing System (8px Base)

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight spacing, icon gaps |
| `space-2` | 8px | Small gaps, inline elements |
| `space-3` | 12px | Component internal padding |
| `space-4` | 16px | Standard padding, card gaps |
| `space-5` | 20px | Medium spacing |
| `space-6` | 24px | Section internal padding |
| `space-8` | 32px | Section gaps |
| `space-10` | 40px | Large section gaps |
| `space-12` | 48px | Hero spacing |
| `space-16` | 64px | Major section dividers |
| `space-20` | 80px | Page-level spacing |

### 2.4 Component Design Tokens

```
Border Radius:
  - sm: 4px  (buttons, inputs)
  - md: 8px  (cards, modals)
  - lg: 12px (featured cards)
  - xl: 16px (hero sections)
  - full: 9999px (pills, avatars)

Shadows:
  - sm: 0 1px 2px rgba(0,0,0,0.05)
  - md: 0 4px 6px rgba(0,0,0,0.07)
  - lg: 0 10px 15px rgba(0,0,0,0.1)
  - xl: 0 20px 25px rgba(0,0,0,0.15)

Transitions:
  - fast: 150ms ease
  - normal: 250ms ease
  - slow: 350ms ease
```

### 2.5 Logo & Brand Assets
- **Primary Logo:** UPSA official logo in Navy Blue and Gold
- **Voice of UPSA Wordmark:** Custom typography in Navy Blue with Gold accent
- **Favicon:** UPSA shield/icon in 16x16, 32x32, 180x180 (Apple touch)
- **OG Image:** 1200x630 branded social sharing image
- **Loading Spinner:** Animated UPSA shield or gold pulse

---

# 3. ARCHITECTURE OVERVIEW

## 3.1 High-Level Architecture

```
+------------------------------------------------------------------------+
|                         CLIENT LAYER                                   |
|  +------------------+  +------------------+  +----------------------+  |
|  |   Browser        |  |   Mobile         |  |     Search Engines   |  |
|  |   (Next.js)      |  |   (PWA)          |  |     (SEO Crawlers)   |  |
|  +------------------+  +------------------+  +----------------------+  |
+------------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------------+
|                      APPLICATION LAYER (Next.js 15)                    |
|  +----------------+ +----------------+ +----------------+ +---------+  |
|  | App Router     | |  API Routes    | | Middleware     | | Edge    |  |
|  | (RSC/SSC)      | |  (Server)      | | (Auth/RBAC)    | | Func    |  |
|  +----------------+ +----------------+ +----------------+ +---------+  |
+------------------------------------------------------------------------+
                              |
              +---------------+---------------+
              v               v               v
+---------------+ +----------------+ +----------------+
|   SUPABASE    | |   CLOUDINARY   | |    VERCEL      |
|  +---------+  | |  +---------+   | |  +---------+   |
|  |PostgreSQL|  | |  | Images  |   | |  | Hosting |   |
|  | Auth    |  | |  | Videos  |   | |  | Edge Net|   |
|  | Realtime|  | |  | Raw Docs|   | |  |Analytics|   |
|  | Storage |  | |  | CDN     |   | |  +---------+   |
|  |Edge Func|  | |  +---------+   | +----------------+
|  +---------+  | +----------------+
+---------------+
```

## 3.2 Data Flow Architecture

```
User Request
    |
    v
+-----------------+
| Next.js Middleware | <- Auth check, role validation, rate limiting
|   (Edge Runtime)   |
+-----------------+
    |
    v
+-----------------+
|  App Router      | <- Server Component renders initial HTML
|  (Server-Side)   |
+-----------------+
    |
    |-> Supabase (PostgreSQL) <- Data fetch via Supabase Client
    |      |
    |      |-> Row Level Security (RLS) <- Data access control
    |      |
    |      |-> Data returned to Server Component
    |
    |-> Cloudinary CDN <- Media assets (images, videos)
    |
    |-> Client Hydration <- React hydrates interactive components
            |
            |-> Client-side Supabase <- Realtime updates, user actions
            |
            |-> React State Management <- UI state, caching
```

## 3.3 Server Component Strategy

| Component Type | Rendering | Use Case |
|---------------|-----------|----------|
| **Server Component (RSC)** | Server-side | Article lists, static pages, SEO-critical content |
| **Client Component** | Client-side | Forms, interactive UI, auth state, real-time features |
| **Streaming SSR** | Progressive | Large article feeds, search results |
| **Static Generation** | Build-time | About page, Contact page, static content |
| **ISR (Revalidation)** | On-demand | Homepage, category pages (revalidate every 60s) |

---

# 4. TECHNOLOGY STACK

## 4.1 Core Framework

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 15.x | Full-stack React framework with App Router |
| **React** | 19.x | UI library |
| **TypeScript** | 5.7.x | Type safety and developer experience |
| **Tailwind CSS** | 4.x | Utility-first CSS framework |
| **Node.js** | 20.x LTS | Runtime environment |

## 4.2 Backend & Database

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Supabase** | Latest | Backend-as-a-Service (PostgreSQL, Auth, Realtime, Storage) |
| **PostgreSQL** | 15.x (via Supabase) | Primary relational database |
| **Supabase Auth** | Latest | Authentication and user management |
| **Supabase Realtime** | Latest | Live subscriptions for comments, notifications |
| **Supabase Edge Functions** | Latest | Serverless functions for webhooks, processing |

## 4.3 Media & Storage

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Cloudinary** | Latest | Image/video upload, transformation, optimization, CDN |
| **Cloudinary React SDK** | Latest | React components for optimized image delivery |

## 4.4 UI & Styling

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Tailwind CSS** | 4.x | Utility-first styling |
| **shadcn/ui** | Latest | Accessible, customizable UI component primitives |
| **Radix UI** | Latest | Headless UI primitives (via shadcn/ui) |
| **Lucide React** | Latest | Icon library |
| **clsx + tailwind-merge** | Latest | Conditional class merging |
| **class-variance-authority** | Latest | Component variant management |

## 4.5 State Management & Data Fetching

| Technology | Version | Purpose |
|-----------|---------|---------|
| **TanStack Query (React Query)** | 5.x | Server state management, caching, synchronization |
| **Zustand** | 5.x | Client state management (auth, UI state) |
| **Supabase Client (SSR)** | Latest | Server-side data fetching with RLS |

## 4.6 Forms & Validation

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React Hook Form** | 7.x | Performant form handling |
| **Zod** | 3.x | Schema validation (TypeScript-first) |
| **@hookform/resolvers** | Latest | Zod resolver for React Hook Form |

## 4.7 Rich Text Editing

| Technology | Version | Purpose |
|-----------|---------|---------|
| **TipTap** | 3.x | Headless rich text editor for article composition |
| **ProseMirror** | Latest (via TipTap) | Underlying editor engine |

## 4.8 Security

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Helmet.js** | 8.x | HTTP security headers |
| **DOMPurify** | 3.x | XSS prevention for rich text content |
| **bcryptjs** | 2.x | Password hashing (fallback) |
| **zxcvbn** | Latest | Password strength estimation |
| **Rate Limiter Flexible** | Latest | Rate limiting for API routes |
| **Jose** | 5.x | JWT handling |

## 4.9 SEO & Meta

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js Metadata API** | Built-in | Dynamic metadata generation |
| **Schema.org JSON-LD** | Manual | Structured data for articles |
| **Open Graph** | Manual | Social media sharing optimization |

## 4.10 Testing

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Vitest** | 3.x | Unit and integration testing |
| **React Testing Library** | 16.x | Component testing |
| **Playwright** | 1.x | End-to-end testing |
| **MSW (Mock Service Worker)** | 2.x | API mocking |

## 4.11 Development Tools

| Technology | Version | Purpose |
|-----------|---------|---------|
| **ESLint** | 9.x | Code linting |
| **Prettier** | 3.x | Code formatting |
| **TypeScript** | 5.7.x | Type checking |
| **Turbopack** | Built-in | Fast development builds |
| **Husky** | 9.x | Git hooks |
| **lint-staged** | 15.x | Pre-commit linting |
| **Commitlint** | 19.x | Conventional commit enforcement |

## 4.12 Deployment & DevOps

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Vercel** | Latest | Frontend hosting, edge functions, CI/CD |
| **Supabase Cloud** | Latest | Database hosting, auth, storage |
| **GitHub Actions** | Latest | CI/CD pipelines |
| **Sentry** | Latest | Error tracking and performance monitoring |

---

# 5. DATABASE SCHEMA DESIGN

## 5.1 Entity Relationship Diagram (Textual)

```
+----------------+     +----------------+     +----------------+
|     users      |     |    profiles    |     |     roles      |
+----------------+     +----------------+     +----------------+
| id (PK, UUID)  |---->| id (PK, UUID)  |     | id (PK, UUID)  |
| email          |     | user_id (FK)   |     | name           |
| created_at     |     | full_name      |     | description    |
| updated_at     |     | avatar_url     |     | permissions    |
| email_confirmed|     | bio            |     | created_at     |
| last_sign_in   |     | department     |     +----------------+
+----------------+     | year_group     |              |
                       | social_links   |              v
                       | is_public      |     +----------------+
                       | created_at     |     |  user_roles    |
                       +----------------+     +----------------+
                                              | user_id (FK)   |
                                              | role_id (FK)   |
                                              | assigned_by    |
                                              | assigned_at    |
                                              +----------------+

+----------------+     +----------------+     +----------------+
|   categories   |     |    articles    |     |  article_tags  |
+----------------+     +----------------+     +----------------+
| id (PK, UUID)  |<----| category_id(FK)|     | article_id (FK)|
| name           |     | id (PK, UUID)  |---->| tag_id (FK)    |
| slug           |     | title          |     +----------------+
| description    |     | slug           |
| color          |     | excerpt        |     +----------------+
| icon           |     | content        |     |     tags       |
| sort_order     |     | featured_image |     +----------------+
| is_active      |     | author_id (FK) |     | id (PK, UUID)  |
| created_at     |     | status         |     | name           |
+----------------+     | published_at   |     | slug           |
                       | view_count     |     | created_at     |
                       | is_featured    |     +----------------+
                       | is_pinned      |
                       | meta_title     |     +----------------+
                       | meta_desc      |     |  comments      |
                       | created_at     |     +----------------+
                       | updated_at     |     | id (PK, UUID)  |
                       +----------------+     | article_id (FK)|
                               |              | user_id (FK)   |
                               |              | parent_id (FK) |
                               v              | content        |
                       +----------------+     | is_approved    |
                       | article_images |     | created_at     |
                       +----------------+     +----------------+
                       | id (PK, UUID)  |
                       | article_id (FK)|
                       | cloudinary_url |
                       | public_id      |
                       | caption        |
                       | sort_order     |
                       +----------------+

+----------------+     +----------------+     +----------------+
| advertisements |     |  ad_placements |     |   contacts     |
+----------------+     +----------------+     +----------------+
| id (PK, UUID)  |---->| ad_id (FK)     |     | id (PK, UUID)  |
| advertiser_name|     | placement_type |     | name           |
| advertiser_email|    | start_date     |     | email          |
| ad_type        |     | end_date       |     | subject        |
| image_url      |     | is_active      |     | message        |
| target_url     |     | impressions    |     | status         |
| status         |     | clicks         |     | created_at     |
| created_by     |     +----------------+     +----------------+
| created_at     |
+----------------+

+----------------+     +----------------+
|  notifications |     |  activity_log  |
+----------------+     +----------------+
| id (PK, UUID)  |     | id (PK, UUID)  |
| user_id (FK)   |     | user_id (FK)   |
| type           |     | action         |
| title          |     | entity_type    |
| message        |     | entity_id      |
| is_read        |     | old_data       |
| link           |     | new_data       |
| created_at     |     | ip_address     |
+----------------+     | user_agent     |
                       | created_at     |
                       +----------------+
```

## 5.2 Detailed Table Specifications

### 5.2.1 `users` (Managed by Supabase Auth)
```sql
-- This table is managed automatically by Supabase Auth
-- Extended via the profiles table
```

### 5.2.2 `profiles`
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  department VARCHAR(100),
  year_group VARCHAR(20),
  social_links JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public profiles are viewable by everyone" 
  ON profiles FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE USING (auth.uid() = id);
```

### 5.2.3 `roles`
```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL, -- 'admin', 'editor', 'public'
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed roles
INSERT INTO roles (name, description, permissions) VALUES
('admin', 'Full system access', 
  '{"articles": ["create", "read", "update", "delete", "publish", "unpublish"], 
    "categories": ["create", "read", "update", "delete"], 
    "users": ["create", "read", "update", "delete", "manage_roles"], 
    "ads": ["create", "read", "update", "delete", "approve"], 
    "comments": ["read", "delete", "moderate"], 
    "settings": ["read", "update"]}'),
('editor', 'Content creation and management', 
  '{"articles": ["create", "read", "update", "delete", "publish"], 
    "categories": ["read"], 
    "users": ["read"], 
    "ads": ["read"], 
    "comments": ["read", "moderate"], 
    "settings": ["read"]}'),
('public', 'Standard reader access', 
  '{"articles": ["read"], 
    "categories": ["read"], 
    "comments": ["create", "read", "delete_own"]}');
```

### 5.2.4 `user_roles`
```sql
CREATE TABLE user_roles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
```

### 5.2.5 `categories`
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#00004E',
  icon VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  article_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed categories
INSERT INTO categories (name, slug, description, color, sort_order) VALUES
('All Articles', 'all', 'All published articles', '#00004E', 0),
('Academics', 'academics', 'Academic news, research, and educational updates', '#00004E', 1),
('Events', 'events', 'Campus events, ceremonies, and activities', '#D4AF37', 2),
('News', 'news', 'General university news and announcements', '#00004E', 3),
('Opinions', 'opinions', 'Editorials, opinion pieces, and student voices', '#D4AF37', 4),
('Sports', 'sports', 'Sports news, match reports, and athletic updates', '#00004E', 5),
('Featured', 'featured', 'Highlighted and featured stories', '#D4AF37', 6);
```

### 5.2.6 `articles`
```sql
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image TEXT,
  featured_image_public_id TEXT,
  category_id UUID REFERENCES categories(id),
  author_id UUID REFERENCES auth.users(id),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords TEXT,
  reading_time INTEGER,
  allow_comments BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_category ON articles(category_id);
CREATE INDEX idx_articles_author ON articles(author_id);
CREATE INDEX idx_articles_published ON articles(published_at);
CREATE INDEX idx_articles_featured ON articles(is_featured) WHERE is_featured = true;
CREATE INDEX idx_articles_slug ON articles(slug);

-- Enable RLS
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Published articles are viewable by everyone" 
  ON articles FOR SELECT USING (status = 'published');

CREATE POLICY "Authors can manage their own articles" 
  ON articles FOR ALL USING (auth.uid() = author_id);

CREATE POLICY "Editors can manage all articles" 
  ON articles FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      JOIN roles r ON ur.role_id = r.id 
      WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'editor')
    )
  );
```

### 5.2.7 `article_images`
```sql
CREATE TABLE article_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  cloudinary_url TEXT NOT NULL,
  public_id TEXT NOT NULL,
  caption TEXT,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.2.8 `tags`
```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.2.9 `article_tags`
```sql
CREATE TABLE article_tags (
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);
```

### 5.2.10 `comments`
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_comments_article ON comments(article_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);
```

### 5.2.11 `advertisements`
```sql
CREATE TABLE advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_name VARCHAR(255) NOT NULL,
  advertiser_email VARCHAR(255) NOT NULL,
  advertiser_phone VARCHAR(50),
  ad_type VARCHAR(50) NOT NULL CHECK (ad_type IN ('banner', 'sidebar', 'inline', 'sponsored')),
  image_url TEXT,
  image_public_id TEXT,
  target_url TEXT,
  alt_text TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'expired')),
  start_date DATE,
  end_date DATE,
  budget DECIMAL(10,2),
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.2.12 `contacts`
```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'archived')),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.2.13 `notifications`
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
```

### 5.2.14 `activity_log`
```sql
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_user ON activity_log(user_id);
CREATE INDEX idx_activity_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_created ON activity_log(created_at);
```

---

# 6. AUTHENTICATION & AUTHORIZATION

## 6.1 Authentication Flow

### 6.1.1 Sign-Up Flow
```
User clicks "Sign Up"
    |
    v
+------------------------+
|  Registration Form     | <- React Hook Form + Zod validation
|  (Client Component)    |
+------------------------+
    |
    v
+------------------------+
|  Supabase Auth API     | <- Create user with email/password
|  (Server Action)       |
+------------------------+
    |
    |-> Email verification sent
    |
    v
+------------------------+
|  User clicks email link|
|  -> Email confirmed    |
+------------------------+
    |
    v
+------------------------+
|  Trigger: auth.users   |
|  AFTER INSERT          |
+------------------------+
    |
    v
+------------------------+
|  Auto-create profile   |
|  Assign 'public' role  |
+------------------------+
    |
    v
+------------------------+
|  Redirect to dashboard |
+------------------------+
```

### 6.1.2 Sign-In Flow
```
User clicks "Sign In"
    |
    v
+------------------------+
|  Login Form            |
|  (Client Component)    |
+------------------------+
    |
    v
+------------------------+
|  Supabase Auth         |
|  signInWithPassword()  |
+------------------------+
    |
    |-> Success: JWT token stored in httpOnly cookie
    |
    |-> 2FA check (if enabled)
    |
    v
+------------------------+
|  Middleware validates  |
|  session & role        |
+------------------------+
    |
    v
+------------------------+
|  Redirect based on role|
|  Admin -> /admin       |
|  Editor -> /editor     |
|  Public -> / (homepage)|
+------------------------+
```

### 6.1.3 Password Reset Flow
```
User clicks "Forgot Password"
    |
    v
+------------------------+
|  Enter email address   |
+------------------------+
    |
    v
+------------------------+
|  Supabase resetPassword|
|  -> Email with magic link|
+------------------------+
    |
    v
+------------------------+
|  User clicks link      |
|  -> /reset-password page|
+------------------------+
    |
    v
+------------------------+
|  New password form     |
|  (Zod: min 8, complexity)|
+------------------------+
    |
    v
+------------------------+
|  Update password       |
|  -> Invalidate sessions|
+------------------------+
```

### 6.1.4 Social Authentication (Optional MVP)
- Google OAuth
- Microsoft/Azure AD (for institutional accounts)

## 6.2 Session Management

| Aspect | Implementation |
|--------|---------------|
| **Session Storage** | httpOnly, Secure, SameSite=Strict cookies |
| **Token Type** | JWT (Supabase default) |
| **Token Refresh** | Automatic via Supabase client |
| **Session Duration** | 7 days (configurable) |
| **Concurrent Sessions** | Unlimited (track in activity_log) |
| **Session Revocation** | Immediate via Supabase Admin API |
| **Idle Timeout** | 30 minutes (client-side warning at 25min) |

## 6.3 Middleware Configuration

```
Middleware Execution Order:
1. Security Headers (Helmet)
2. Rate Limiting Check
3. Session Validation (Supabase)
4. Route Protection (Role-based)
5. CSRF Protection
6. Request Logging
```

---

# 7. ROLE-BASED ACCESS CONTROL (RBAC)

## 7.1 Role Definitions

### 7.1.1 Admin Role
**Description:** Full system administrator with unrestricted access.

| Permission | Create | Read | Update | Delete | Special |
|-----------|--------|------|--------|--------|---------|
| Articles | ✅ | ✅ | ✅ | ✅ | Publish/Unpublish any, Pin, Feature |
| Categories | ✅ | ✅ | ✅ | ✅ | — |
| Users | ✅ | ✅ | ✅ | ✅ | Manage roles, Ban, Verify |
| Comments | ✅ | ✅ | ✅ | ✅ | Moderate all |
| Ads | ✅ | ✅ | ✅ | ✅ | Approve/Reject |
| Contacts | ✅ | ✅ | ✅ | ✅ | Mark as read/replied |
| Settings | — | ✅ | ✅ | — | Site configuration |
| Analytics | — | ✅ | — | — | Full dashboard |

### 7.1.2 Editor Role
**Description:** Content creators and managers. Cannot manage users or system settings.

| Permission | Create | Read | Update | Delete | Special |
|-----------|--------|------|--------|--------|---------|
| Articles | ✅ | ✅ | ✅ | ✅ | Publish own, Edit any (with tracking) |
| Categories | — | ✅ | — | — | View only |
| Users | — | ✅ | — | — | View profiles only |
| Comments | — | ✅ | — | — | Moderate (approve/delete) |
| Ads | — | ✅ | — | — | View only |
| Contacts | — | — | — | — | No access |
| Settings | — | ✅ | — | — | Read-only |
| Analytics | — | ✅ | — | — | Content metrics only |

### 7.1.3 Public Role (Authenticated)
**Description:** Registered users with enhanced features.

| Permission | Create | Read | Update | Delete | Special |
|-----------|--------|------|--------|--------|---------|
| Articles | — | ✅ | — | — | Read published only |
| Categories | — | ✅ | — | — | View only |
| Users | — | ✅ | — | — | View public profiles |
| Comments | ✅ | ✅ | ✅ | ✅ | Create, edit/delete own |
| Ads | — | ✅ | — | — | View (impression counted) |
| Contacts | — | — | — | — | Submit contact form |
| Settings | — | — | — | — | Manage own profile |
| Bookmarks | ✅ | ✅ | ✅ | ✅ | Save articles |

### 7.1.4 Public Role (Anonymous/Guest)
**Description:** Unauthenticated visitors.

| Permission | Access |
|-----------|--------|
| Articles | Read published only |
| Categories | View only |
| Comments | Read only (approved) |
| Ads | View (impression counted) |
| Contacts | Submit contact form |
| Authentication | Sign up, Sign in only |

## 7.2 Permission Matrix Summary

| Feature | Admin | Editor | Public (Auth) | Public (Guest) |
|---------|-------|--------|---------------|----------------|
| Read Articles | ✅ | ✅ | ✅ | ✅ |
| Create Articles | ✅ | ✅ | ❌ | ❌ |
| Edit Any Article | ✅ | ✅ | ❌ | ❌ |
| Edit Own Article | ✅ | ✅ | ❌ | ❌ |
| Delete Articles | ✅ | ✅ | ❌ | ❌ |
| Publish Articles | ✅ | ✅ | ❌ | ❌ |
| Feature/Pin Articles | ✅ | ❌ | ❌ | ❌ |
| Manage Categories | ✅ | ❌ | ❌ | ❌ |
| Manage Users | ✅ | ❌ | ❌ | ❌ |
| Assign Roles | ✅ | ❌ | ❌ | ❌ |
| Post Comments | ✅ | ✅ | ✅ | ❌ |
| Moderate Comments | ✅ | ✅ | ❌ | ❌ |
| Manage Ads | ✅ | ❌ | ❌ | ❌ |
| View Analytics | ✅ | ✅ (limited) | ❌ | ❌ |
| Site Settings | ✅ | ❌ | ❌ | ❌ |
| Submit Contact | ✅ | ✅ | ✅ | ✅ |
| Manage Profile | ✅ | ✅ | ✅ | ❌ |

---

# 8. FEATURE SPECIFICATIONS

## 8.1 Navigation Structure

### 8.1.1 Main Navigation (Header)
```
+------------------------------------------------------------------------+
|  [LOGO: Voice of UPSA]    Home    Categories ▼    Advertise    About    Contact    [Search] [Sign In]  |
|                                      ├─ All Articles                |
|                                      ├─ Academics                   |
|                                      ├─ Events                      |
|                                      ├─ News                        |
|                                      ├─ Opinions                    |
|                                      ├─ Sports                      |
|                                      └─ Featured                    |
+------------------------------------------------------------------------+
```

### 8.1.2 Footer Navigation
```
+------------------------------------------------------------------------+
|  [LOGO]              Quick Links         Categories        Connect    |
|  About Voice of UPSA  Home               All Articles      Facebook  |
|  Contact Us           About              Academics         Twitter   |
|  Advertise            Contact            Events              Instagram |
|  Privacy Policy       Advertise          News                LinkedIn  |
|  Terms of Service     Terms              Opinions            YouTube   |
|                       Privacy            Sports              RSS Feed  |
|                                          Featured                     |
|  © 2026 Voice of UPSA. All rights reserved.                         |
|  University of Professional Studies, Accra                           |
+------------------------------------------------------------------------+
```

### 8.1.3 Admin Navigation (Sidebar)
```
Dashboard
├─ Overview
├─ Analytics
Content
├─ All Articles
├─ Create Article
├─ Categories
├─ Tags
├─ Comments (Moderation)
Media
├─ Image Library
├─ Upload Media
Users
├─ All Users
├─ Roles & Permissions
├─ Activity Log
Advertising
├─ All Ads
├─ Pending Approvals
├─ Ad Performance
Communications
├─ Contact Messages
├─ Newsletter
Settings
├─ Site Settings
├─ SEO Settings
├─ Brand Settings
```

### 8.1.4 Editor Navigation (Sidebar)
```
Dashboard
├─ My Articles
├─ Create Article
├─ My Drafts
├─ Published
Media
├─ My Uploads
├─ Upload Media
Comments
├─ Article Comments
Profile
├─ My Profile
├─ Settings
```

## 8.2 Page Specifications

### 8.2.1 Home Page (`/`)
**Layout:** Server Component with ISR (revalidate: 60s)

| Section | Content | Component Type |
|---------|---------|---------------|
| **Hero Section** | Featured/Pinned article (large card with image) | Server |
| **Breaking News** | Latest 3-5 articles in horizontal scroll | Server |
| **Category Grid** | 6 category cards with article counts | Server |
| **Latest Articles** | Paginated list (10 per page) | Server + Client |
| **Trending** | Most viewed articles (last 7 days) | Server |
| **Sports Spotlight** | Latest sports articles | Server |
| **Events Calendar** | Upcoming events preview | Server |
| **Newsletter CTA** | Email subscription form | Client |
| **Ad Slots** | 2 sidebar ad positions | Client |

### 8.2.2 Category Page (`/category/[slug]`)
**Layout:** Server Component

| Section | Content |
|---------|---------|
| **Category Header** | Name, description, article count, color theme |
| **Filter Bar** | Sort (newest, oldest, popular), Date range |
| **Article Grid** | Responsive grid (3 cols desktop, 1 col mobile) |
| **Pagination** | Page numbers + Load more |
| **Related Categories** | Suggested categories |

### 8.2.3 Article Page (`/article/[slug]`)
**Layout:** Server Component (article content) + Client Components (interactions)

| Section | Content | Type |
|---------|---------|------|
| **Article Header** | Title, author, date, category, reading time | Server |
| **Featured Image** | Hero image with caption | Server |
| **Article Body** | Rich text content (sanitized HTML) | Server |
| **Image Gallery** | Inline article images | Server |
| **Tags** | Related tags | Server |
| **Share Buttons** | Social sharing | Client |
| **Author Card** | Author bio, avatar, social links | Server |
| **Related Articles** | 3 related by category | Server |
| **Comments Section** | Threaded comments | Client |
| **Ad Slots** | Inline ad, sidebar ad | Client |

### 8.2.4 About Page (`/about`)
- Static content about Voice of UPSA
- Mission, vision, editorial team
- UPSA brand guidelines reference
- Static generation (no revalidation needed)

### 8.2.5 Contact Page (`/contact`)
- Contact form (name, email, phone, subject, message)
- UPSA address and map embed
- Social media links
- Client component for form handling

### 8.2.6 Advertise Page (`/advertise`)
- Advertising packages and pricing
- Audience demographics
- Ad specifications (sizes, formats)
- Contact form for advertisers
- Media kit download

### 8.2.7 Admin Dashboard (`/admin/*`)
- Protected routes (Admin role only)
- Analytics overview
- Content management
- User management
- Settings

### 8.2.8 Editor Dashboard (`/editor/*`)
- Protected routes (Editor/Admin)
- Article management
- Media upload
- Comment moderation

---

# 9. MVP FEATURES LIST

## 9.1 Core Platform Features (P0 - Must Have)

### 9.1.1 Content Management
| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| C-001 | Article Creation | Rich text editor for creating articles with formatting, images, embeds | P0 |
| C-002 | Article Editing | Edit existing articles with version tracking | P0 |
| C-003 | Article Publishing | Publish, unpublish, schedule articles | P0 |
| C-004 | Draft Management | Save drafts, auto-save every 30 seconds | P0 |
| C-005 | Category Assignment | Assign articles to categories (single or multiple) | P0 |
| C-006 | Featured Articles | Mark articles as featured for homepage display | P0 |
| C-007 | Pinned Articles | Pin articles to top of category/homepage | P0 |
| C-008 | Article Excerpts | Auto-generate or manual excerpt for previews | P0 |
| C-009 | SEO Metadata | Meta title, description, keywords per article | P0 |
| C-010 | Reading Time | Auto-calculate and display reading time | P0 |
| C-011 | Article Slugs | Auto-generate URL-friendly slugs from titles | P0 |
| C-012 | Content Sanitization | XSS prevention via DOMPurify on all user content | P0 |

### 9.1.2 Category System
| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| CAT-001 | Category Listing | Display all 7 categories with article counts | P0 |
| CAT-002 | Category Filtering | Filter articles by single category | P0 |
| CAT-003 | Category Pages | Dedicated page per category with unique styling | P0 |
| CAT-004 | Category Management | Admin can add/edit/disable categories | P0 |
| CAT-005 | Category Colors | Each category has assigned color (brand-aligned) | P0 |

### 9.1.3 User Authentication
| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| AUTH-001 | Email/Password Registration | Sign up with email verification | P0 |
| AUTH-002 | Email/Password Login | Secure login with session management | P0 |
| AUTH-003 | Password Reset | Self-service password reset via email | P0 |
| AUTH-004 | Session Management | Secure JWT sessions with refresh tokens | P0 |
| AUTH-005 | Profile Creation | Auto-create profile on registration | P0 |
| AUTH-006 | Profile Management | Users can update name, bio, avatar, department | P0 |
| AUTH-007 | Role Assignment | Auto-assign 'public' role on registration | P0 |
| AUTH-008 | Admin Assignment | Manual role elevation by existing admins | P0 |

### 9.1.4 Role-Based Access
| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| RBAC-001 | Admin Dashboard | Full admin panel with all management features | P0 |
| RBAC-002 | Editor Dashboard | Editor panel for content management | P0 |
| RBAC-003 | Public Access | Read-only access for authenticated public users | P0 |
| RBAC-004 | Guest Access | Read-only access without authentication | P0 |
| RBAC-005 | Route Protection | Middleware-based route guards by role | P0 |
| RBAC-006 | API Protection | RLS policies on all database tables | P0 |

### 9.1.5 Media Management
| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| MED-001 | Image Upload | Upload article images via Cloudinary | P0 |
| MED-002 | Image Optimization | Auto-optimize images (WebP, responsive sizes) | P0 |
| MED-003 | Image Transformation | Crop, resize, quality adjustment via Cloudinary | P0 |
| MED-004 | Featured Image | Set primary image for article previews | P0 |
| MED-005 | Image Gallery | Multiple images within article content | P0 |
| MED-006 | Avatar Upload | Profile picture upload and management | P0 |

### 9.1.6 Comment System
| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| COM-001 | Comment Creation | Authenticated users can post comments | P0 |
| COM-002 | Comment Display | Threaded/nested comment display | P0 |
| COM-003 | Comment Moderation | Editors/Admins approve comments before display | P0 |
| COM-004 | Comment Deletion | Users can delete own comments | P0 |
| COM-005 | Comment Reporting | Report inappropriate comments | P1 |

### 9.1.7 Advertising System
| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| ADV-001 | Ad Submission Form | Public form for advertisers to submit ads | P0 |
| ADV-002 | Ad Types | Support banner, sidebar, inline ad formats | P0 |
| ADV-003 | Ad Approval Workflow | Admin review and approve/reject ads | P0 |
| ADV-004 | Ad Display | Render approved ads in designated slots | P0 |
| ADV-005 | Impression Tracking | Track ad views | P0 |
| ADV-006 | Click Tracking | Track ad clicks | P0 |
| ADV-007 | Ad Scheduling | Set start/end dates for ad campaigns | P0 |

### 9.1.8 Contact System
| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| CON-001 | Contact Form | Public contact form (name, email, subject, message) | P0 |
| CON-002 | Spam Protection | Honeypot + rate limiting on contact form | P0 |
| CON-003 | Admin Inbox | Admin panel to view and manage contact messages | P0 |
| CON-004 | Message Status | Track message status (unread, read, replied, archived) | P0 |
| CON-005 | Auto-Response | Send confirmation email to sender | P1 |

### 9.1.9 Search Functionality
| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| SRC-001 | Full-Text Search | Search articles by title, content, excerpt | P0 |
| SRC-002 | Search Results Page | Display results with relevance ranking | P0 |
| SRC-003 | Search Suggestions | Auto-suggestions as user types | P1 |
| SRC-004 | Filtered Search | Filter by category, date range | P1 |

## 9.2 Enhanced User Experience Features (P1 - Should Have)

### 9.2.1 Personalization
| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| UX-001 | Article Bookmarks | Save articles for later reading | P1 |
| UX-002 | Reading History | Track recently viewed articles | P1 |
| UX-003 | Personalized Feed | Recommended articles based on reading history | P2 |
| UX-004 | Dark Mode | Toggle between light/dark themes | P1 |
| UX-005 | Font Size Adjustment | Accessibility: small, medium, large text | P1 |

### 9.2.2 Social Features
| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| SOC-001 | Social Sharing | Share articles to Facebook, Twitter, LinkedIn, WhatsApp | P1 |
| SOC-002 | Share Count | Display share counts per article | P2 |
| SOC-003 | Author Following | Follow favorite authors | P2 |
| SOC-004 | Article Reactions | Like/react to articles | P2 |

### 9.2.3 Notifications
| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| NOT-001 | New Article Alerts | Notify when new articles in followed categories | P1 |
| NOT-002 | Comment Notifications | Notify authors of new comments | P1 |
| NOT-003 | Admin Notifications | Notify admins of new ads, contacts, reports | P1 |
| NOT-004 | Real-time Updates | Live comment updates via Supabase Realtime | P1 |

### 9.2.4 Newsletter
| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| NWL-001 | Email Subscription | Subscribe to weekly digest | P1 |
| NWL-002 | Unsubscribe | One-click unsubscribe | P1 |
| NWL-003 | Newsletter Template | Branded email template | P1 |

## 9.3 Analytics & Monitoring Features (P1)

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| ANA-001 | Page Views | Track article views | P1 |
| ANA-002 | Popular Articles | Most viewed articles dashboard | P1 |
| ANA-003 | Traffic Sources | Referrer tracking | P2 |
| ANA-004 | User Analytics | Registered vs guest readership | P2 |
| ANA-005 | Content Performance | Per-article engagement metrics | P1 |

## 9.4 Administrative Features (P0-P1)

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| ADM-001 | User Management | View, search, edit, ban users | P0 |
| ADM-002 | Role Management | Assign/change user roles | P0 |
| ADM-003 | Content Moderation | Review and moderate all content | P0 |
| ADM-004 | Activity Logging | Log all admin actions | P0 |
| ADM-005 | Site Settings | Update site metadata, social links | P1 |
| ADM-006 | SEO Settings | Manage global SEO configuration | P1 |
| ADM-007 | Backup Management | Database backup triggers | P2 |
| ADM-008 | Bulk Operations | Bulk publish/unpublish/delete articles | P1 |

## 9.5 Accessibility Features (P0)

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| A11Y-001 | WCAG 2.1 AA Compliance | Meet all AA accessibility standards | P0 |
| A11Y-002 | Keyboard Navigation | Full keyboard operability | P0 |
| A11Y-003 | Screen Reader Support | ARIA labels, roles, live regions | P0 |
| A11Y-004 | Color Contrast | Minimum 4.5:1 contrast ratio | P0 |
| A11Y-005 | Focus Indicators | Visible focus states on all interactive elements | P0 |
| A11Y-006 | Alt Text | Descriptive alt text for all images | P0 |
| A11Y-007 | Skip Links | Skip to main content link | P0 |
| A11Y-008 | Reduced Motion | Respect prefers-reduced-motion | P1 |

## 9.6 Performance Features (P0-P1)

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| PERF-001 | Image Optimization | WebP format, lazy loading, responsive images | P0 |
| PERF-002 | Code Splitting | Route-based and component-based splitting | P0 |
| PERF-003 | Caching Strategy | SWR, ISR, browser caching | P0 |
| PERF-004 | CDN Delivery | Cloudinary CDN for media, Vercel Edge for static | P0 |
| PERF-005 | Core Web Vitals | Target: LCP < 2.5s, FID < 100ms, CLS < 0.1 | P0 |
| PERF-006 | Bundle Analysis | Regular bundle size monitoring | P1 |

---

# 10. API DESIGN

## 10.1 REST API Endpoints

### 10.1.1 Articles API

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/api/articles` | List articles (with pagination, filters) | No | All |
| GET | `/api/articles/[slug]` | Get single article by slug | No | All |
| POST | `/api/articles` | Create new article | Yes | Admin, Editor |
| PATCH | `/api/articles/[id]` | Update article | Yes | Admin, Editor (own), Admin (any) |
| DELETE | `/api/articles/[id]` | Delete article | Yes | Admin, Editor (own), Admin (any) |
| POST | `/api/articles/[id]/publish` | Publish article | Yes | Admin, Editor |
| POST | `/api/articles/[id]/unpublish` | Unpublish article | Yes | Admin |
| POST | `/api/articles/[id]/feature` | Feature/unfeature article | Yes | Admin |
| POST | `/api/articles/[id]/pin` | Pin/unpin article | Yes | Admin |

### 10.1.2 Categories API

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/api/categories` | List all categories | No | All |
| GET | `/api/categories/[slug]` | Get category with articles | No | All |
| POST | `/api/categories` | Create category | Yes | Admin |
| PATCH | `/api/categories/[id]` | Update category | Yes | Admin |
| DELETE | `/api/categories/[id]` | Delete category | Yes | Admin |

### 10.1.3 Comments API

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/api/articles/[id]/comments` | Get article comments | No | All |
| POST | `/api/articles/[id]/comments` | Post comment | Yes | Public+ |
| PATCH | `/api/comments/[id]` | Edit comment | Yes | Own |
| DELETE | `/api/comments/[id]` | Delete comment | Yes | Own, Admin, Editor |
| POST | `/api/comments/[id]/approve` | Approve comment | Yes | Admin, Editor |

### 10.1.4 Auth API

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/auth/signup` | Register new user | No | — |
| POST | `/api/auth/signin` | Sign in user | No | — |
| POST | `/api/auth/signout` | Sign out user | Yes | All |
| POST | `/api/auth/reset-password` | Request password reset | No | — |
| POST | `/api/auth/update-password` | Update password | Yes | — |
| GET | `/api/auth/session` | Get current session | Yes | — |
| GET | `/api/auth/user` | Get current user with roles | Yes | — |

### 10.1.5 Users API

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/api/users` | List users | Yes | Admin |
| GET | `/api/users/[id]` | Get user profile | Yes | Admin, Self |
| PATCH | `/api/users/[id]` | Update user | Yes | Admin, Self |
| DELETE | `/api/users/[id]` | Delete user | Yes | Admin |
| POST | `/api/users/[id]/role` | Assign role | Yes | Admin |

### 10.1.6 Media API

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/media/upload` | Upload image to Cloudinary | Yes | Admin, Editor |
| DELETE | `/api/media/[public_id]` | Delete image from Cloudinary | Yes | Admin, Editor (own) |
| GET | `/api/media` | List media | Yes | Admin, Editor |

### 10.1.7 Ads API

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/api/ads` | List active ads | No | All |
| POST | `/api/ads` | Submit ad request | No | All |
| GET | `/api/ads/admin` | List all ads (admin) | Yes | Admin |
| PATCH | `/api/ads/[id]` | Update ad status | Yes | Admin |
| DELETE | `/api/ads/[id]` | Delete ad | Yes | Admin |
| POST | `/api/ads/[id]/impression` | Track impression | No | All |
| POST | `/api/ads/[id]/click` | Track click | No | All |

### 10.1.8 Contact API

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/contact` | Submit contact form | No | All |
| GET | `/api/contact` | List messages | Yes | Admin |
| PATCH | `/api/contact/[id]` | Update message status | Yes | Admin |
| DELETE | `/api/contact/[id]` | Delete message | Yes | Admin |

### 10.1.9 Search API

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/api/search?q=query` | Search articles | No | All |

## 10.2 API Response Standards

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

## 10.3 Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/auth/*` | 5 requests | 1 minute |
| `/api/contact` | 3 requests | 1 hour |
| `/api/comments` | 10 requests | 1 minute |
| `/api/ads` (submit) | 2 requests | 1 hour |
| General API | 100 requests | 1 minute |

---

# 11. SECURITY ARCHITECTURE

## 11.1 Authentication Security

| Control | Implementation |
|---------|---------------|
| **Password Policy** | Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char |
| **Password Hashing** | bcrypt (via Supabase Auth) |
| **Brute Force Protection** | Rate limiting on auth endpoints |
| **Session Security** | httpOnly, Secure, SameSite=Strict cookies |
| **Token Refresh** | Automatic refresh before expiry |
| **Concurrent Sessions** | Track and allow session management |
| **Account Lockout** | 5 failed attempts = 15-minute lockout |
| **Email Verification** | Required before full account activation |

## 11.2 Authorization Security

| Control | Implementation |
|---------|---------------|
| **Row Level Security (RLS)** | Enabled on ALL database tables |
| **Role-Based Policies** | PostgreSQL policies per role |
| **API Route Guards** | Middleware checks role before handler execution |
| **Client-Side Guards** | UI components conditionally render based on role |
| **Principle of Least Privilege** | Each role has minimum necessary permissions |

## 11.3 Data Security

| Control | Implementation |
|---------|---------------|
| **Input Validation** | Zod schemas on all inputs |
| **Output Encoding** | React automatic XSS protection |
| **Rich Text Sanitization** | DOMPurify on all HTML content |
| **SQL Injection Prevention** | Parameterized queries (Supabase client) |
| **NoSQL Injection Prevention** | Schema validation on all JSONB fields |
| **File Upload Security** | Cloudinary validation (type, size, malware scan) |
| **File Type Restrictions** | Images: JPG, PNG, WebP, GIF (max 5MB) |
| **Data Encryption at Rest** | Supabase AES-256 encryption |
| **Data Encryption in Transit** | TLS 1.3 (HTTPS only) |

## 11.4 Application Security

| Control | Implementation |
|---------|---------------|
| **CSRF Protection** | Double-submit cookie pattern |
| **Clickjacking Protection** | X-Frame-Options: DENY |
| **XSS Protection** | Content-Security-Policy headers |
| **Content Security Policy** | Strict CSP with nonce |
| **HSTS** | max-age=31536000; includeSubDomains |
| **Referrer Policy** | strict-origin-when-cross-origin |
| **Permissions Policy** | Restrict browser features |
| **Security Headers** | Helmet.js configuration |
| **CORS** | Strict origin whitelist |

## 11.5 Infrastructure Security

| Control | Implementation |
|---------|---------------|
| **DDoS Protection** | Vercel Edge Network + Cloudflare |
| **WAF** | Cloudflare WAF rules |
| **Bot Detection** | reCAPTCHA v3 on forms |
| **IP Allowlisting** | Admin panel restricted to UPSA IPs (optional) |
| **Audit Logging** | All admin actions logged with IP and user agent |
| **Backup Encryption** | Encrypted database backups |
| **Secret Management** | Environment variables only, never commit secrets |

## 11.6 Security Headers Configuration

```javascript
// middleware.ts - Helmet.js equivalent for Next.js
export const securityHeaders = {
  'Content-Security-Policy': 
    "default-src 'self'; " +
    "script-src 'self' 'nonce-{nonce}' 'strict-dynamic'; " +
    "style-src 'self' 'nonce-{nonce}'; " +
    "img-src 'self' https://res.cloudinary.com data:; " +
    "font-src 'self'; " +
    "connect-src 'self' https://*.supabase.co; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-XSS-Protection': '0', // Disabled in favor of CSP
};
```

---

# 12. CLOUDINARY INTEGRATION

## 12.1 Cloudinary Configuration

### 12.1.1 Environment Variables
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_PRESET=voice_of_upsa_uploads
```

### 12.1.2 Upload Preset Configuration
```json
{
  "upload_preset": "voice_of_upsa_uploads",
  "folder": "voice_of_upsa",
  "allowed_formats": ["jpg", "jpeg", "png", "webp", "gif"],
  "max_file_size": 5242880,
  "transformation": [
    { "quality": "auto:good" },
    { "fetch_format": "auto" }
  ],
  "eager": [
    { "width": 400, "height": 300, "crop": "fill", "quality": "auto" },
    { "width": 800, "height": 600, "crop": "fill", "quality": "auto" },
    { "width": 1200, "height": 800, "crop": "fill", "quality": "auto" }
  ],
  "eager_async": true
}
```

## 12.2 Image Transformation Strategy

### 12.2.1 Article Images
| Transformation | Width | Height | Crop | Quality | Format |
|---------------|-------|--------|------|---------|--------|
| **Thumbnail** | 400 | 300 | fill | auto | auto (WebP) |
| **Medium** | 800 | 600 | fill | auto | auto (WebP) |
| **Large** | 1200 | 800 | fill | auto | auto (WebP) |
| **Hero** | 1920 | 1080 | fill | auto | auto (WebP) |
| **Avatar** | 200 | 200 | fill | auto | auto (WebP) |

### 12.2.2 Ad Images
| Ad Type | Dimensions | Max File Size |
|---------|-----------|---------------|
| **Banner** | 728x90 | 100KB |
| **Sidebar** | 300x250 | 150KB |
| **Inline** | 600x400 | 200KB |
| **Sponsored** | 1200x630 | 300KB |

## 12.3 Upload Implementation

### 12.3.1 Server-Side Upload (Secure)
```typescript
// lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(file: Buffer, folder: string = 'voice_of_upsa') {
  return cloudinary.uploader.upload_stream({
    folder,
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ]
  });
}

export async function deleteImage(publicId: string) {
  return cloudinary.uploader.destroy(publicId);
}

export function getOptimizedUrl(publicId: string, options: {
  width?: number;
  height?: number;
  crop?: string;
  quality?: string;
} = {}) {
  return cloudinary.url(publicId, {
    width: options.width,
    height: options.height,
    crop: options.crop || 'fill',
    quality: options.quality || 'auto',
    fetch_format: 'auto',
    secure: true,
  });
}
```

### 12.3.2 Client-Side Upload (Signed)
```typescript
// components/MediaUpload.tsx
import { CldUploadWidget } from 'next-cloudinary';

export function MediaUpload({ onUpload }: { onUpload: (result: any) => void }) {
  return (
    <CldUploadWidget
      uploadPreset="voice_of_upsa_uploads"
      options={{
        maxFiles: 5,
        maxFileSize: 5242880, // 5MB
        sources: ['local', 'url', 'camera'],
        resourceType: 'image',
      }}
      onSuccess={onUpload}
    >
      {({ open }) => (
        <button onClick={() => open()} className="btn-primary">
          Upload Images
        </button>
      )}
    </CldUploadWidget>
  );
}
```

## 12.4 CDN & Performance

| Aspect | Configuration |
|--------|--------------|
| **CDN** | Cloudinary global CDN |
| **Caching** | 1 year cache for transformed images |
| **HTTP/2** | Enabled |
| **Brotli Compression** | Enabled |
| **Responsive Images** | `srcSet` with multiple breakpoints |
| **Lazy Loading** | Native `loading="lazy"` + Intersection Observer |
| **Placeholder** | Blur-up LQIP (Low Quality Image Placeholder) |

---

# 13. SUPABASE INTEGRATION

## 13.1 Supabase Configuration

### 13.1.1 Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 13.1.2 Client Configuration
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createServerSupabaseClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}
```

## 13.2 Authentication Configuration

### 13.2.1 Auth Settings (Supabase Dashboard)
```
Authentication Settings:
- Site URL: https://voiceofupsa.vercel.app
- Redirect URLs: 
  - https://voiceofupsa.vercel.app/auth/callback
  - https://voiceofupsa.vercel.app/reset-password
- JWT Expiry: 3600 seconds (1 hour)
- Refresh Token Rotation: Enabled
- Secure Cookies: Enabled
- SameSite Cookie: Strict
```

### 13.2.2 Email Templates
```
Confirmation Email:
- Subject: "Verify your Voice of UPSA account"
- Branding: UPSA Navy Blue header, Gold accents
- Content: Verification link, UPSA branding

Password Reset Email:
- Subject: "Reset your Voice of UPSA password"
- Branding: UPSA Navy Blue header, Gold accents
- Content: Reset link, security notice

Magic Link Email:
- Subject: "Your Voice of UPSA login link"
- Branding: UPSA Navy Blue header, Gold accents
- Content: Login link, expiry notice
```

## 13.3 Realtime Configuration

### 13.3.1 Realtime Channels
```typescript
// Realtime subscriptions
const channels = {
  // New comments on article
  articleComments: (articleId: string) => 
    `article:${articleId}:comments`,

  // New articles in category
  categoryArticles: (categoryId: string) => 
    `category:${categoryId}:articles`,

  // User notifications
  userNotifications: (userId: string) => 
    `user:${userId}:notifications`,

  // Admin alerts
  adminAlerts: () => 'admin:alerts',
};
```

### 13.3.2 Realtime Policies
```sql
-- Enable realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE articles;

-- Row Level Security for realtime
CREATE POLICY "Users can receive their own notifications"
  ON realtime.messages FOR SELECT
  USING (auth.uid() = (payload->>'user_id')::uuid);
```

## 13.4 Storage Configuration

### 13.4.1 Storage Buckets
| Bucket Name | Purpose | Public | Max Size | Allowed Types |
|------------|---------|--------|----------|---------------|
| `avatars` | User profile pictures | Yes | 2MB | image/* |
| `article-images` | Article content images | Yes | 5MB | image/* |
| `ad-images` | Advertisement images | Yes | 2MB | image/* |
| `documents` | PDFs, media kits | Yes | 10MB | application/pdf |

### 13.4.2 Storage Policies
```sql
-- Avatars bucket policies
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid() = owner AND
    (storage.extension(name))::text IN ('jpg', 'jpeg', 'png', 'webp')
  );

-- Article images bucket policies
CREATE POLICY "Article images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'article-images');

CREATE POLICY "Editors and admins can upload article images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'article-images' AND
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'editor')
    )
  );
```

## 13.5 Edge Functions

### 13.5.1 Required Edge Functions
| Function | Trigger | Purpose |
|----------|---------|---------|
| `handle-new-user` | auth.users INSERT | Auto-create profile, assign role |
| `send-notification` | notifications INSERT | Push notifications via web push |
| `process-ad-click` | HTTP request | Track ad clicks, validate fraud |
| `generate-newsletter` | Cron (weekly) | Compile and send newsletter |
| `cleanup-old-data` | Cron (daily) | Archive old logs, clean temp files |

### 13.5.2 Edge Function Example
```typescript
// supabase/functions/handle-new-user/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { record } = await req.json();
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Create profile
  await supabase.from('profiles').insert({
    id: record.id,
    full_name: record.raw_user_meta_data?.full_name || 'New User',
    created_at: new Date().toISOString(),
  });

  // Assign public role
  const { data: publicRole } = await supabase
    .from('roles')
    .select('id')
    .eq('name', 'public')
    .single();

  if (publicRole) {
    await supabase.from('user_roles').insert({
      user_id: record.id,
      role_id: publicRole.id,
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

---

# 14. COMPLETE DEPENDENCIES & LIBRARIES

## 14.1 Package.json — Production Dependencies

```json
{
  "name": "voice-of-upsa",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:e2e": "playwright test",
    "test:ui": "vitest --ui",
    "db:generate": "supabase gen types typescript --project-id your-project-id --schema public > types/supabase.ts",
    "db:migrate": "supabase migration up",
    "db:reset": "supabase db reset",
    "db:seed": "tsx scripts/seed.ts",
    "prepare": "husky install"
  },
  "dependencies": {
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "typescript": "^5.7.0",
    "@types/node": "^22.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",

    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    "postcss": "^8.4.49",
    "autoprefixer": "^10.4.20",

    "@supabase/ssr": "^0.5.2",
    "@supabase/supabase-js": "^2.47.0",
    "@supabase/auth-helpers-nextjs": "^0.10.0",

    "cloudinary": "^2.5.1",
    "next-cloudinary": "^6.16.0",

    "@radix-ui/react-accordion": "^1.2.2",
    "@radix-ui/react-alert-dialog": "^1.1.4",
    "@radix-ui/react-avatar": "^1.1.2",
    "@radix-ui/react-checkbox": "^1.1.3",
    "@radix-ui/react-dialog": "^1.1.4",
    "@radix-ui/react-dropdown-menu": "^2.1.4",
    "@radix-ui/react-hover-card": "^1.1.4",
    "@radix-ui/react-label": "^2.1.1",
    "@radix-ui/react-navigation-menu": "^1.2.3",
    "@radix-ui/react-popover": "^1.1.4",
    "@radix-ui/react-progress": "^1.1.1",
    "@radix-ui/react-radio-group": "^1.2.2",
    "@radix-ui/react-scroll-area": "^1.2.2",
    "@radix-ui/react-select": "^2.1.4",
    "@radix-ui/react-separator": "^1.1.1",
    "@radix-ui/react-slider": "^1.2.2",
    "@radix-ui/react-slot": "^1.1.1",
    "@radix-ui/react-switch": "^1.1.2",
    "@radix-ui/react-tabs": "^1.1.2",
    "@radix-ui/react-toast": "^1.2.4",
    "@radix-ui/react-toggle": "^1.1.1",
    "@radix-ui/react-toggle-group": "^1.1.1",
    "@radix-ui/react-tooltip": "^1.1.6",

    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0",

    "lucide-react": "^0.468.0",

    "@tanstack/react-query": "^5.62.0",
    "@tanstack/react-query-devtools": "^5.62.0",

    "zustand": "^5.0.2",

    "react-hook-form": "^7.54.0",
    "@hookform/resolvers": "^3.9.1",
    "zod": "^3.24.0",

    "@tiptap/react": "^2.11.0",
    "@tiptap/starter-kit": "^2.11.0",
    "@tiptap/extension-image": "^2.11.0",
    "@tiptap/extension-link": "^2.11.0",
    "@tiptap/extension-placeholder": "^2.11.0",
    "@tiptap/extension-underline": "^2.11.0",
    "@tiptap/extension-text-align": "^2.11.0",
    "@tiptap/extension-table": "^2.11.0",
    "@tiptap/extension-table-row": "^2.11.0",
    "@tiptap/extension-table-cell": "^2.11.0",
    "@tiptap/extension-table-header": "^2.11.0",

    "isomorphic-dompurify": "^2.19.0",

    "jose": "^5.9.6",

    "rate-limiter-flexible": "^5.0.4",

    "sharp": "^0.33.5",

    "slugify": "^1.6.6",

    "reading-time": "^1.5.0",

    "date-fns": "^4.1.0",

    "react-share": "^5.1.1",

    "react-intersection-observer": "^9.14.0",

    "framer-motion": "^11.15.0",

    "next-themes": "^0.4.4",

    "sonner": "^1.7.1",

    "cmdk": "^1.0.4",

    "vaul": "^1.1.2",

    "embla-carousel-react": "^8.5.1",

    "react-day-picker": "^9.4.4",

    "react-resizable-panels": "^2.1.7",

    "recharts": "^2.15.0",

    "@sentry/nextjs": "^8.47.0"
  },
  "devDependencies": {
    "eslint": "^9.17.0",
    "eslint-config-next": "^15.1.0",
    "eslint-plugin-react": "^7.37.2",
    "eslint-plugin-react-hooks": "^5.1.0",
    "eslint-plugin-jsx-a11y": "^6.10.2",
    "eslint-plugin-import": "^2.31.0",
    "@eslint/js": "^9.17.0",

    "prettier": "^3.4.2",
    "prettier-plugin-tailwindcss": "^0.6.9",

    "vitest": "^2.1.8",
    "@vitest/ui": "^2.1.8",
    "@testing-library/react": "^16.1.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/user-event": "^14.5.2",
    "jsdom": "^25.0.1",

    "@playwright/test": "^1.49.0",

    "msw": "^2.7.0",

    "husky": "^9.1.7",
    "lint-staged": "^15.3.0",
    "@commitlint/cli": "^19.6.0",
    "@commitlint/config-conventional": "^19.6.0",

    "@types/dompurify": "^3.0.5",

    "tsx": "^4.19.2",

    "supabase": "^2.0.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  }
}
```

## 14.2 Dependency Categories & Purposes

### 14.2.1 Core Framework (7 packages)
| Package | Version | Purpose | Security Notes |
|---------|---------|---------|----------------|
| `next` | 15.1.0 | Full-stack React framework | Latest stable, patched for CVEs |
| `react` | 19.0.0 | UI library | Latest stable |
| `react-dom` | 19.0.0 | React DOM renderer | Latest stable |
| `typescript` | 5.7.0 | Type safety | Latest stable |
| `@types/node` | 22.10.0 | Node.js type definitions | Latest stable |
| `@types/react` | 19.0.0 | React type definitions | Latest stable |
| `@types/react-dom` | 19.0.0 | React DOM type definitions | Latest stable |

### 14.2.2 Styling & UI (8 packages)
| Package | Version | Purpose | Security Notes |
|---------|---------|---------|----------------|
| `tailwindcss` | 4.0.0 | Utility-first CSS | Latest stable |
| `@tailwindcss/postcss` | 4.0.0 | PostCSS integration | Latest stable |
| `postcss` | 8.4.49 | CSS processing | Latest stable |
| `autoprefixer` | 10.4.20 | CSS vendor prefixes | Latest stable |
| `class-variance-authority` | 0.7.1 | Component variants | Latest stable |
| `clsx` | 2.1.1 | Conditional classnames | Latest stable |
| `tailwind-merge` | 2.6.0 | Merge Tailwind classes | Latest stable |
| `lucide-react` | 0.468.0 | Icon library | Latest stable |

### 14.2.3 Backend & Database (4 packages)
| Package | Version | Purpose | Security Notes |
|---------|---------|---------|----------------|
| `@supabase/ssr` | 0.5.2 | Server-side Supabase client | Latest stable |
| `@supabase/supabase-js` | 2.47.0 | Supabase JavaScript client | Latest stable |
| `@supabase/auth-helpers-nextjs` | 0.10.0 | Next.js auth helpers | Latest stable |
| `supabase` (dev) | 2.0.0 | CLI for migrations/types | Latest stable |

### 14.2.4 Media & Storage (3 packages)
| Package | Version | Purpose | Security Notes |
|---------|---------|---------|----------------|
| `cloudinary` | 2.5.1 | Server-side Cloudinary SDK | Latest stable |
| `next-cloudinary` | 6.16.0 | React Cloudinary components | Latest stable |
| `sharp` | 0.33.5 | Image optimization | Latest stable |

### 14.2.5 UI Components (28 packages — Radix UI)
| Package | Version | Purpose | Security Notes |
|---------|---------|---------|----------------|
| `@radix-ui/react-accordion` | 1.2.2 | Collapsible content | Latest stable |
| `@radix-ui/react-alert-dialog` | 1.1.4 | Modal dialogs | Latest stable |
| `@radix-ui/react-avatar` | 1.1.2 | User avatars | Latest stable |
| `@radix-ui/react-checkbox` | 1.1.3 | Checkboxes | Latest stable |
| `@radix-ui/react-dialog` | 1.1.4 | Dialogs/modals | Latest stable |
| `@radix-ui/react-dropdown-menu` | 2.1.4 | Dropdown menus | Latest stable |
| `@radix-ui/react-hover-card` | 1.1.4 | Hover cards | Latest stable |
| `@radix-ui/react-label` | 2.1.1 | Form labels | Latest stable |
| `@radix-ui/react-navigation-menu` | 1.2.3 | Navigation | Latest stable |
| `@radix-ui/react-popover` | 1.1.4 | Popovers | Latest stable |
| `@radix-ui/react-progress` | 1.1.1 | Progress bars | Latest stable |
| `@radix-ui/react-radio-group` | 1.2.2 | Radio buttons | Latest stable |
| `@radix-ui/react-scroll-area` | 1.2.2 | Scrollable areas | Latest stable |
| `@radix-ui/react-select` | 2.1.4 | Select dropdowns | Latest stable |
| `@radix-ui/react-separator` | 1.1.1 | Dividers | Latest stable |
| `@radix-ui/react-slider` | 1.2.2 | Sliders | Latest stable |
| `@radix-ui/react-slot` | 1.1.1 | Slot composition | Latest stable |
| `@radix-ui/react-switch` | 1.1.2 | Toggles | Latest stable |
| `@radix-ui/react-tabs` | 1.1.2 | Tab panels | Latest stable |
| `@radix-ui/react-toast` | 1.2.4 | Toast notifications | Latest stable |
| `@radix-ui/react-toggle` | 1.1.1 | Toggle buttons | Latest stable |
| `@radix-ui/react-toggle-group` | 1.1.1 | Toggle groups | Latest stable |
| `@radix-ui/react-tooltip` | 1.1.6 | Tooltips | Latest stable |

### 14.2.6 State Management (3 packages)
| Package | Version | Purpose | Security Notes |
|---------|---------|---------|----------------|
| `@tanstack/react-query` | 5.62.0 | Server state management | Latest stable |
| `@tanstack/react-query-devtools` | 5.62.0 | Query devtools | Dev only |
| `zustand` | 5.0.2 | Client state management | Latest stable |

### 14.2.7 Forms & Validation (4 packages)
| Package | Version | Purpose | Security Notes |
|---------|---------|---------|----------------|
| `react-hook-form` | 7.54.0 | Form handling | Latest stable |
| `@hookform/resolvers` | 3.9.1 | Zod integration | Latest stable |
| `zod` | 3.24.0 | Schema validation | Latest stable |
| `cmdk` | 1.0.4 | Command palette | Latest stable |

### 14.2.8 Rich Text Editor (11 packages — TipTap)
| Package | Version | Purpose | Security Notes |
|---------|---------|---------|----------------|
| `@tiptap/react` | 2.11.0 | React integration | Latest stable |
| `@tiptap/starter-kit` | 2.11.0 | Core extensions | Latest stable |
| `@tiptap/extension-image` | 2.11.0 | Image support | Latest stable |
| `@tiptap/extension-link` | 2.11.0 | Links | Latest stable |
| `@tiptap/extension-placeholder` | 2.11.0 | Placeholder text | Latest stable |
| `@tiptap/extension-underline` | 2.11.0 | Underline | Latest stable |
| `@tiptap/extension-text-align` | 2.11.0 | Text alignment | Latest stable |
| `@tiptap/extension-table` | 2.11.0 | Tables | Latest stable |
| `@tiptap/extension-table-row` | 2.11.0 | Table rows | Latest stable |
| `@tiptap/extension-table-cell` | 2.11.0 | Table cells | Latest stable |
| `@tiptap/extension-table-header` | 2.11.0 | Table headers | Latest stable |

### 14.2.9 Security (4 packages)
| Package | Version | Purpose | Security Notes |
|---------|---------|---------|----------------|
| `isomorphic-dompurify` | 2.19.0 | XSS sanitization | Latest stable |
| `jose` | 5.9.6 | JWT handling | Latest stable |
| `rate-limiter-flexible` | 5.0.4 | Rate limiting | Latest stable |
| `bcryptjs` | 2.4.3 | Password hashing (fallback) | Latest stable |

### 14.2.10 Utilities (8 packages)
| Package | Version | Purpose | Security Notes |
|---------|---------|---------|----------------|
| `slugify` | 1.6.6 | URL slug generation | Latest stable |
| `reading-time` | 1.5.0 | Reading time calculation | Latest stable |
| `date-fns` | 4.1.0 | Date formatting | Latest stable |
| `react-share` | 5.1.1 | Social sharing buttons | Latest stable |
| `react-intersection-observer` | 9.14.0 | Lazy loading trigger | Latest stable |
| `framer-motion` | 11.15.0 | Animations | Latest stable |
| `next-themes` | 0.4.4 | Dark mode support | Latest stable |
| `sonner` | 1.7.1 | Toast notifications | Latest stable |

### 14.2.11 Additional UI Components (5 packages)
| Package | Version | Purpose | Security Notes |
|---------|---------|---------|----------------|
| `vaul` | 1.1.2 | Drawer component | Latest stable |
| `embla-carousel-react` | 8.5.1 | Carousel/slider | Latest stable |
| `react-day-picker` | 9.4.4 | Date picker | Latest stable |
| `react-resizable-panels` | 2.1.7 | Resizable panels | Latest stable |
| `recharts` | 2.15.0 | Charts/graphs | Latest stable |

### 14.2.12 Monitoring (1 package)
| Package | Version | Purpose | Security Notes |
|---------|---------|---------|----------------|
| `@sentry/nextjs` | 8.47.0 | Error tracking | Latest stable |

### 14.2.13 Development Tools (15 packages)
| Package | Version | Purpose | Security Notes |
|---------|---------|---------|----------------|
| `eslint` | 9.17.0 | Code linting | Latest stable |
| `eslint-config-next` | 15.1.0 | Next.js ESLint config | Latest stable |
| `eslint-plugin-react` | 7.37.2 | React linting rules | Latest stable |
| `eslint-plugin-react-hooks` | 5.1.0 | Hooks linting rules | Latest stable |
| `eslint-plugin-jsx-a11y` | 6.10.2 | Accessibility linting | Latest stable |
| `eslint-plugin-import` | 2.31.0 | Import linting | Latest stable |
| `@eslint/js` | 9.17.0 | ESLint core | Latest stable |
| `prettier` | 3.4.2 | Code formatting | Latest stable |
| `prettier-plugin-tailwindcss` | 0.6.9 | Tailwind Prettier | Latest stable |
| `vitest` | 2.1.8 | Unit testing | Latest stable |
| `@vitest/ui` | 2.1.8 | Vitest UI | Latest stable |
| `@testing-library/react` | 16.1.0 | React testing | Latest stable |
| `@testing-library/jest-dom` | 6.6.3 | DOM assertions | Latest stable |
| `@testing-library/user-event` | 14.5.2 | User event simulation | Latest stable |
| `jsdom` | 25.0.1 | DOM environment for tests | Latest stable |

### 14.2.14 E2E Testing (1 package)
| Package | Version | Purpose | Security Notes |
|---------|---------|---------|----------------|
| `@playwright/test` | 1.49.0 | End-to-end testing | Latest stable |

### 14.2.15 Mocking (1 package)
| Package | Version | Purpose | Security Notes |
|---------|---------|---------|----------------|
| `msw` | 2.7.0 | API mocking | Latest stable |

### 14.2.16 Git Hooks (3 packages)
| Package | Version | Purpose | Security Notes |
|---------|---------|---------|----------------|
| `husky` | 9.1.7 | Git hooks | Latest stable |
| `lint-staged` | 15.3.0 | Pre-commit linting | Latest stable |
| `@commitlint/cli` | 19.6.0 | Commit linting | Latest stable |
| `@commitlint/config-conventional` | 19.6.0 | Conventional commits | Latest stable |

### 14.2.17 Type Definitions (1 package)
| Package | Version | Purpose | Security Notes |
|---------|---------|---------|----------------|
| `@types/dompurify` | 3.0.5 | DOMPurify types | Latest stable |

### 14.2.18 Build Tools (1 package)
| Package | Version | Purpose | Security Notes |
|---------|---------|---------|----------------|
| `tsx` | 4.19.2 | TypeScript execution | Latest stable |

---

# 15. VULNERABILITY PREVENTION MATRIX

## 15.1 OWASP Top 10 Coverage

| OWASP Rank | Vulnerability | Prevention Strategy | Libraries/Tools | Implementation |
|-----------|---------------|----------------------|-----------------|----------------|
| **A01** | Broken Access Control | RBAC + RLS + Middleware | Supabase RLS, Jose, Zustand | Row-level policies, role middleware, route guards |
| **A02** | Cryptographic Failures | Strong hashing + TLS | Supabase Auth, TLS 1.3 | bcrypt, HTTPS-only, secure cookies |
| **A03** | Injection | Parameterized queries + Validation | Zod, Supabase client | Input sanitization, prepared statements |
| **A04** | Insecure Design | Defense in depth | Multiple layers | Validation at all layers, fail-safe defaults |
| **A05** | Security Misconfiguration | Secure defaults + Headers | Helmet.js, Next.js | Strict CSP, HSTS, X-Frame-Options |
| **A06** | Vulnerable Components | Dependency scanning | npm audit, Dependabot | Weekly audits, auto-update policy |
| **A07** | ID and Auth Failures | Strong auth + session mgmt | Supabase Auth, Jose | JWT, refresh tokens, session invalidation |
| **A08** | Software/Data Integrity | Input validation + checksums | Zod, Cloudinary | File type validation, size limits |
| **A09** | Security Logging | Comprehensive audit logs | Supabase, Sentry | Activity logging, error tracking |
| **A10** | SSRF | URL validation + allowlists | Zod, custom validators | Strict URL validation, internal IP blocking |

## 15.2 Specific Vulnerability Mitigations

### 15.2.1 Cross-Site Scripting (XSS)
| Layer | Prevention | Tool |
|-------|-----------|------|
| **Input** | Sanitize all user HTML | DOMPurify |
| **Output** | React auto-escaping | React 19 |
| **Storage** | Validate before DB insert | Zod schemas |
| **CSP** | Strict Content Security Policy | Helmet.js |
| **Headers** | X-Content-Type-Options: nosniff | Next.js middleware |

### 15.2.2 SQL Injection
| Layer | Prevention | Tool |
|-------|-----------|------|
| **Client** | No raw SQL in frontend | Supabase client |
| **API** | Parameterized queries only | Supabase PostgREST |
| **RLS** | Policies prevent unauthorized access | PostgreSQL RLS |
| **Validation** | Schema validation on all inputs | Zod |

### 15.2.3 Cross-Site Request Forgery (CSRF)
| Layer | Prevention | Tool |
|-------|-----------|------|
| **Token** | Double-submit cookie pattern | Next.js middleware |
| **Headers** | SameSite=Strict cookies | Supabase Auth |
| **Origin** | Strict origin validation | Custom middleware |
| **State** | State parameter for OAuth | Supabase Auth |

### 15.2.4 Clickjacking
| Layer | Prevention | Tool |
|-------|-----------|------|
| **Frame** | X-Frame-Options: DENY | Next.js middleware |
| **CSP** | frame-ancestors 'none' | Helmet.js |
| **UI** | Frame-busting JavaScript | Custom script |

### 15.2.5 Insecure Direct Object References (IDOR)
| Layer | Prevention | Tool |
|-------|-----------|------|
| **RLS** | Row-level security policies | PostgreSQL |
| **API** | Validate user owns resource | Custom middleware |
| **URL** | Use UUIDs instead of sequential IDs | Database design |

### 15.2.6 Security Misconfiguration
| Layer | Prevention | Tool |
|-------|-----------|------|
| **Headers** | Comprehensive security headers | Helmet.js |
| **Env** | No secrets in code | .env files |
| **Debug** | Disable debug in production | NODE_ENV check |
| **CORS** | Strict origin whitelist | Next.js config |

### 15.2.7 Sensitive Data Exposure
| Layer | Prevention | Tool |
|-------|-----------|------|
| **Transit** | TLS 1.3 only | Vercel SSL |
| **Rest** | AES-256 encryption | Supabase |
| **Passwords** | bcrypt hashing | Supabase Auth |
| **PII** | Minimize collection, encrypt at rest | Database design |

### 15.2.8 Missing Function-Level Access Control
| Layer | Prevention | Tool |
|-------|-----------|------|
| **Middleware** | Role verification on all protected routes | Custom middleware |
| **API** | Role checks in API handlers | Custom validators |
| **UI** | Conditional rendering based on role | Zustand + React |
| **DB** | RLS policies enforce access | PostgreSQL |

### 15.2.9 Cross-Origin Resource Sharing (CORS)
| Layer | Prevention | Tool |
|-------|-----------|------|
| **Config** | Strict origin whitelist | Next.js config |
| **API** | Validate Origin header | Custom middleware |
| **Credentials** | SameSite cookies only | Supabase Auth |

### 15.2.10 Unvalidated Redirects and Forwards
| Layer | Prevention | Tool |
|-------|-----------|------|
| **Validation** | Whitelist allowed redirect URLs | Zod |
| **User** | Never trust user-provided URLs | Input validation |

## 15.3 Dependency Security Management

### 15.3.1 Automated Security Scanning
```bash
# Weekly security audit
npm audit

# Fix automatically
npm audit fix

# Force fix (may break things)
npm audit fix --force

# Check for updates
npm outdated

# Update specific package
npm update package-name
```

### 15.3.2 GitHub Dependabot Configuration
```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
    open-pull-requests-limit: 10
    reviewers:
      - "your-github-username"
    labels:
      - "dependencies"
      - "security"
    commit-message:
      prefix: "chore"
      include: "scope"
    allow:
      - dependency-type: "direct"
    ignore:
      - dependency-name: "*"
        update-types: ["version-update:semver-major"]
```

### 15.3.3 Lock File Integrity
```bash
# Ensure lock file is up to date
npm ci

# Verify lock file integrity
npm audit signatures

# Check for lock file tampering
npm shrinkwrap
```

## 15.4 Environment Security

### 15.4.1 Required Environment Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Application
NEXT_PUBLIC_SITE_URL=https://voiceofupsa.vercel.app
NEXT_PUBLIC_SITE_NAME=Voice of UPSA

# Security
JWT_SECRET=your-jwt-secret-min-32-chars
ENCRYPTION_KEY=your-encryption-key-32-chars

# Monitoring
SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_SENTRY_DSN=your-public-sentry-dsn

# Rate Limiting (Redis - optional)
REDIS_URL=redis://localhost:6379

# Email (optional - for newsletters)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### 15.4.2 Environment Validation
```typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().min(32),
});

export const env = envSchema.parse(process.env);
```

---

# 16. DEPLOYMENT ARCHITECTURE

## 16.1 Hosting Strategy

### 16.1.1 Vercel (Frontend)
| Aspect | Configuration |
|--------|--------------|
| **Framework Preset** | Next.js |
| **Node Version** | 20.x |
| **Build Command** | `next build` |
| **Output Directory** | `.next` |
| **Install Command** | `npm ci` |
| **Environment** | Production |

### 16.1.2 Supabase (Backend)
| Aspect | Configuration |
|--------|--------------|
| **Region** | Closest to Ghana (EU-West) |
| **Database** | PostgreSQL 15 |
| **Compute** | Small (upgrade as needed) |
| **Storage** | 1GB (expandable) |
| **Bandwidth** | 2GB/month |
| **Realtime** | Enabled |
| **Edge Functions** | Enabled |

### 16.1.3 Cloudinary (Media)
| Aspect | Configuration |
|--------|--------------|
| **Plan** | Free tier (25GB storage, 25GB bandwidth) |
| **CDN** | Global |
| **Backup** | Enabled |
| **Transformations** | Unlimited |

## 16.2 CI/CD Pipeline

### 16.2.1 GitHub Actions Workflow
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run format:check

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test

  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build
          path: .next

  deploy:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel
        uses: vercel/action-deploy@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### 16.2.2 Deployment Environments
| Environment | Branch | URL | Purpose |
|------------|--------|-----|---------|
| **Development** | `feature/*` | `localhost:3000` | Local development |
| **Staging** | `develop` | `https://staging.voiceofupsa.vercel.app` | Pre-production testing |
| **Production** | `main` | `https://voiceofupsa.vercel.app` | Live site |

## 16.3 Domain & SSL Configuration

### 16.3.1 Custom Domain (Recommended)
```
Primary Domain: voiceofupsa.edu.gh
Redirect: www.voiceofupsa.edu.gh -> voiceofupsa.edu.gh

DNS Configuration:
- A Record: @ -> Vercel IP
- CNAME: www -> cname.vercel-dns.com
- MX Records: (if using custom email)

SSL: Automatic (Let's Encrypt via Vercel)
```

### 16.3.2 SSL/TLS Configuration
| Setting | Value |
|---------|-------|
| **Certificate** | Let's Encrypt (auto-renew) |
| **TLS Version** | 1.3 (minimum 1.2) |
| **HSTS** | Enabled, max-age=31536000 |
| **OCSP Stapling** | Enabled |

---

# 17. PERFORMANCE & OPTIMIZATION

## 17.1 Core Web Vitals Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Largest Contentful Paint (LCP)** | < 2.5s | Page load |
| **First Input Delay (FID)** | < 100ms | Interactivity |
| **Cumulative Layout Shift (CLS)** | < 0.1 | Visual stability |
| **Time to First Byte (TTFB)** | < 600ms | Server response |
| **First Contentful Paint (FCP)** | < 1.8s | Initial render |
| **Interaction to Next Paint (INP)** | < 200ms | Responsiveness |

## 17.2 Image Optimization Strategy

### 17.2.1 Responsive Images
```html
<!-- Example: Responsive article image -->
<img
  src="https://res.cloudinary.com/demo/image/upload/w_800/v1234567890/article.jpg"
  srcset="
    https://res.cloudinary.com/demo/image/upload/w_400/v1234567890/article.jpg 400w,
    https://res.cloudinary.com/demo/image/upload/w_800/v1234567890/article.jpg 800w,
    https://res.cloudinary.com/demo/image/upload/w_1200/v1234567890/article.jpg 1200w
  "
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
  alt="Article featured image"
  loading="lazy"
  decoding="async"
/>
```

### 17.2.2 Image Formats
| Format | Use Case | Browser Support |
|--------|----------|-----------------|
| **WebP** | Default for all images | 95%+ |
| **AVIF** | Hero images (smaller size) | 85%+ |
| **JPEG** | Fallback for older browsers | Universal |
| **PNG** | Images requiring transparency | Universal |

## 17.3 Caching Strategy

### 17.3.1 Browser Caching
```
Static Assets (JS, CSS, fonts):
  Cache-Control: public, max-age=31536000, immutable

Images (Cloudinary):
  Cache-Control: public, max-age=31536000

API Responses:
  Cache-Control: public, max-age=60, stale-while-revalidate=300

HTML Pages:
  Cache-Control: public, max-age=0, must-revalidate
```

### 17.3.2 CDN Caching (Vercel Edge)
| Content Type | Cache Duration | Revalidation |
|-------------|---------------|-------------|
| Static assets | 1 year | Never |
| ISR pages | 60 seconds | Stale-while-revalidate |
| API responses | 1 minute | Background revalidate |

### 17.3.3 Database Caching (TanStack Query)
```typescript
// Query caching configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: false,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});
```

## 17.4 Code Splitting

### 17.4.1 Route-Based Splitting
```typescript
// Automatic with Next.js App Router
// Each route is its own chunk
```

### 17.4.2 Component-Based Splitting
```typescript
// Lazy load heavy components
import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), {
  loading: () => <EditorSkeleton />,
  ssr: false, // Only load on client
});

const AnalyticsDashboard = dynamic(() => import('@/components/AnalyticsDashboard'), {
  loading: () => <DashboardSkeleton />,
});
```

### 17.4.3 Library Splitting
```typescript
// Split large libraries
const loadChartLibrary = () => import('recharts');
const loadPDFLibrary = () => import('react-pdf');
```

## 17.5 Bundle Optimization

### 17.5.1 Bundle Analysis
```bash
# Analyze bundle size
npm run build
npx @next/bundle-analyzer

# Check for duplicates
npx duplicate-package-checker
```

### 17.5.2 Tree Shaking
```typescript
// Import only what you need
import { Button } from '@/components/ui/button'; // Good
import { Button, Card, Dialog } from '@/components/ui'; // Bad - imports everything

// Use barrel exports with care
// components/ui/index.ts
export { Button } from './button';
export { Card } from './card';
// etc.
```

### 17.5.3 Dead Code Elimination
```bash
# Check for unused dependencies
npx depcheck

# Remove unused imports
npx unimported
```

---

# 18. TESTING STRATEGY

## 18.1 Testing Pyramid

```
        /       /  \     E2E Tests (Playwright) - 10%
      /    \    Critical user journeys
     /------    /        \   Integration Tests (Vitest + RTL) - 30%
   /          \  Component interactions, API mocking
  /------------\ 
 /              \ Unit Tests (Vitest) - 60%
/                \ Pure functions, utilities, hooks
```

## 18.2 Unit Testing

### 18.2.1 Test Configuration
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 18.2.2 Example Unit Tests
```typescript
// tests/utils/slugify.test.ts
import { describe, it, expect } from 'vitest';
import { generateSlug } from '@/lib/utils';

describe('generateSlug', () => {
  it('should convert title to slug', () => {
    expect(generateSlug('Hello World')).toBe('hello-world');
  });

  it('should handle special characters', () => {
    expect(generateSlug('UPSA: News & Updates!')).toBe('upsa-news-updates');
  });

  it('should handle multiple spaces', () => {
    expect(generateSlug('  Multiple   Spaces  ')).toBe('multiple-spaces');
  });
});

// tests/lib/validation.test.ts
import { describe, it, expect } from 'vitest';
import { articleSchema } from '@/lib/validation';

describe('articleSchema', () => {
  it('should validate valid article', () => {
    const validArticle = {
      title: 'Test Article',
      content: '<p>Valid content</p>',
      categoryId: '123e4567-e89b-12d3-a456-426614174000',
    };
    expect(() => articleSchema.parse(validArticle)).not.toThrow();
  });

  it('should reject empty title', () => {
    const invalidArticle = {
      title: '',
      content: '<p>Content</p>',
      categoryId: '123e4567-e89b-12d3-a456-426614174000',
    };
    expect(() => articleSchema.parse(invalidArticle)).toThrow();
  });
});
```

## 18.3 Integration Testing

### 18.3.1 Component Testing
```typescript
// tests/components/ArticleCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ArticleCard } from '@/components/ArticleCard';

describe('ArticleCard', () => {
  const mockArticle = {
    id: '1',
    title: 'Test Article',
    excerpt: 'Test excerpt',
    slug: 'test-article',
    featuredImage: 'https://example.com/image.jpg',
    category: { name: 'News', color: '#00004E' },
    author: { fullName: 'John Doe', avatar: null },
    publishedAt: '2026-05-13T10:00:00Z',
    readingTime: 5,
  };

  it('should render article information', () => {
    render(<ArticleCard article={mockArticle} />);

    expect(screen.getByText('Test Article')).toBeInTheDocument();
    expect(screen.getByText('Test excerpt')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should link to article page', () => {
    render(<ArticleCard article={mockArticle} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/article/test-article');
  });
});
```

### 18.3.2 API Testing with MSW
```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/articles', () => {
    return HttpResponse.json({
      success: true,
      data: [
        { id: '1', title: 'Article 1', slug: 'article-1' },
        { id: '2', title: 'Article 2', slug: 'article-2' },
      ],
      meta: { page: 1, limit: 10, total: 2, totalPages: 1 },
    });
  }),

  http.get('/api/articles/article-1', () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: '1',
        title: 'Article 1',
        content: '<p>Content</p>',
        slug: 'article-1',
      },
    });
  }),
];

// tests/setup.ts
import { beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## 18.4 End-to-End Testing

### 18.4.1 Playwright Configuration
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 18.4.2 E2E Test Examples
```typescript
// e2e/homepage.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display navigation', async ({ page }) => {
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByText('Voice of UPSA')).toBeVisible();
  });

  test('should display hero section', async ({ page }) => {
    await expect(page.getByTestId('hero-section')).toBeVisible();
  });

  test('should navigate to category page', async ({ page }) => {
    await page.getByText('Categories').hover();
    await page.getByText('Academics').click();
    await expect(page).toHaveURL('/category/academics');
  });

  test('should be responsive', async ({ page }) => {
    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByRole('navigation')).toBeVisible();

    // Tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByRole('navigation')).toBeVisible();

    // Desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.getByRole('navigation')).toBeVisible();
  });
});

// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should sign up new user', async ({ page }) => {
    await page.goto('/auth/signup');

    await page.getByLabel('Email').fill('test@upsa.edu.gh');
    await page.getByLabel('Password').fill('SecurePass123!');
    await page.getByLabel('Confirm Password').fill('SecurePass123!');
    await page.getByLabel('Full Name').fill('Test User');

    await page.getByRole('button', { name: 'Sign Up' }).click();

    await expect(page.getByText('Check your email')).toBeVisible();
  });

  test('should sign in existing user', async ({ page }) => {
    await page.goto('/auth/signin');

    await page.getByLabel('Email').fill('editor@upsa.edu.gh');
    await page.getByLabel('Password').fill('EditorPass123!');

    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByText('Welcome back')).toBeVisible();
  });
});
```

## 18.5 Accessibility Testing

### 18.5.1 Automated Accessibility Testing
```typescript
// tests/a11y/homepage.test.ts
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import HomePage from '@/app/page';

expect.extend(toHaveNoViolations);

describe('Homepage Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<HomePage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### 18.5.2 Manual Accessibility Checklist
| Checkpoint | Tool | Frequency |
|-----------|------|-----------|
| Keyboard navigation | Manual | Per release |
| Screen reader compatibility | NVDA/VoiceOver | Per release |
| Color contrast | WebAIM Contrast Checker | Per release |
| Focus indicators | Manual | Per release |
| Form labels | axe DevTools | Per release |
| Heading structure | WAVE | Per release |
| Alt text completeness | Manual review | Per release |

---

# 19. SEO & ACCESSIBILITY

## 19.1 SEO Strategy

### 19.1.1 Metadata Configuration
```typescript
// app/layout.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://voiceofupsa.edu.gh'),
  title: {
    default: 'Voice of UPSA - University News & Updates',
    template: '%s | Voice of UPSA',
  },
  description: 'The official news and updates platform for the University of Professional Studies, Accra (UPSA).',
  keywords: ['UPSA', 'University of Professional Studies Accra', 'Ghana university news', 'UPSA news'],
  authors: [{ name: 'Voice of UPSA Editorial Team' }],
  openGraph: {
    type: 'website',
    locale: 'en_GH',
    url: 'https://voiceofupsa.edu.gh',
    siteName: 'Voice of UPSA',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Voice of UPSA - University News Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@voiceofupsa',
    creator: '@voiceofupsa',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};
```

### 19.1.2 Dynamic Article Metadata
```typescript
// app/article/[slug]/page.tsx
import { Metadata } from 'next';
import { getArticleBySlug } from '@/lib/articles';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug);

  if (!article) {
    return { title: 'Article Not Found | Voice of UPSA' };
  }

  return {
    title: article.metaTitle || article.title,
    description: article.metaDescription || article.excerpt,
    keywords: article.metaKeywords?.split(',') || [],
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: 'article',
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [article.author.fullName],
      images: [
        {
          url: article.featuredImage,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      images: [article.featuredImage],
    },
  };
}
```

### 19.1.3 Structured Data (JSON-LD)
```typescript
// components/ArticleSchema.tsx
export function ArticleSchema({ article }: { article: Article }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt,
    image: article.featuredImage,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: {
      '@type': 'Person',
      name: article.author.fullName,
      url: `/author/${article.author.id}`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Voice of UPSA',
      logo: {
        '@type': 'ImageObject',
        url: 'https://voiceofupsa.edu.gh/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://voiceofupsa.edu.gh/article/${article.slug}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

### 19.1.4 Sitemap & Robots
```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next';
import { getAllArticles, getAllCategories } from '@/lib/articles';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://voiceofupsa.edu.gh';

  // Static pages
  const staticPages = [
    { url: `${baseUrl}/`, lastModified: new Date(), priority: 1.0 },
    { url: `${baseUrl}/about`, lastModified: new Date(), priority: 0.8 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), priority: 0.8 },
    { url: `${baseUrl}/advertise`, lastModified: new Date(), priority: 0.7 },
  ];

  // Category pages
  const categories = await getAllCategories();
  const categoryPages = categories.map((category) => ({
    url: `${baseUrl}/category/${category.slug}`,
    lastModified: new Date(),
    priority: 0.9,
  }));

  // Article pages
  const articles = await getAllArticles();
  const articlePages = articles.map((article) => ({
    url: `${baseUrl}/article/${article.slug}`,
    lastModified: article.updatedAt,
    priority: 0.9,
  }));

  return [...staticPages, ...categoryPages, ...articlePages];
}

// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/editor/', '/api/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin/', '/editor/'],
      },
    ],
    sitemap: 'https://voiceofupsa.edu.gh/sitemap.xml',
  };
}
```

## 19.2 Accessibility (a11y) Implementation

### 19.2.1 WCAG 2.1 AA Compliance Checklist

| Principle | Guideline | Implementation | Status |
|-----------|-----------|----------------|--------|
| **Perceivable** | 1.1 Text Alternatives | Alt text for all images | Required |
| | 1.2 Time-based Media | Captions for videos (if added) | Required |
| | 1.3 Adaptable | Semantic HTML, ARIA labels | Required |
| | 1.4 Distinguishable | Color contrast 4.5:1 minimum | Required |
| **Operable** | 2.1 Keyboard Accessible | Full keyboard navigation | Required |
| | 2.2 Enough Time | No auto-refresh without control | Required |
| | 2.3 Seizures | No flashing content | Required |
| | 2.4 Navigable | Skip links, focus indicators | Required |
| | 2.5 Input Modalities | Touch targets min 44x44px | Required |
| **Understandable** | 3.1 Readable | Lang attribute, readable fonts | Required |
| | 3.2 Predictable | Consistent navigation | Required |
| | 3.3 Input Assistance | Error prevention, clear labels | Required |
| **Robust** | 4.1 Compatible | Valid HTML, ARIA support | Required |

### 19.2.2 ARIA Implementation
```tsx
// components/Navigation.tsx
export function Navigation() {
  return (
    <nav aria-label="Main navigation">
      <ul role="menubar">
        <li role="none">
          <a href="/" role="menuitem">Home</a>
        </li>
        <li role="none">
          <button 
            aria-haspopup="true" 
            aria-expanded="false"
            role="menuitem"
          >
            Categories
          </button>
          <ul role="menu" aria-label="Categories">
            <li role="none"><a href="/category/academics" role="menuitem">Academics</a></li>
            <li role="none"><a href="/category/events" role="menuitem">Events</a></li>
            {/* ... */}
          </ul>
        </li>
      </ul>
    </nav>
  );
}

// components/ArticleCard.tsx
export function ArticleCard({ article }: { article: Article }) {
  return (
    <article aria-labelledby={`article-title-${article.id}`}>
      <img 
        src={article.featuredImage} 
        alt={article.title}
        loading="lazy"
      />
      <h2 id={`article-title-${article.id}`}>
        <a href={`/article/${article.slug}`}>
          {article.title}
        </a>
      </h2>
      <p>{article.excerpt}</p>
      <footer>
        <span>By {article.author.fullName}</span>
        <time dateTime={article.publishedAt}>
          {formatDate(article.publishedAt)}
        </time>
      </footer>
    </article>
  );
}
```

### 19.2.3 Focus Management
```css
/* styles/focus.css */
/* Visible focus indicators for all interactive elements */
a:focus-visible,
button:focus-visible,
input:focus-visible,
textarea:focus-visible,
select:focus-visible {
  outline: 3px solid #D4AF37; /* UPSA Gold */
  outline-offset: 2px;
  border-radius: 4px;
}

/* Skip link for keyboard users */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #00004E;
  color: #FFFFFF;
  padding: 8px 16px;
  z-index: 100;
  transition: top 0.3s;
}

.skip-link:focus {
  top: 0;
}
```

### 19.2.4 Screen Reader Support
```tsx
// components/LiveRegion.tsx
export function LiveRegion({ 
  children, 
  politeness = 'polite' 
}: { 
  children: React.ReactNode; 
  politeness?: 'polite' | 'assertive';
}) {
  return (
    <div 
      aria-live={politeness} 
      aria-atomic="true"
      className="sr-only"
    >
      {children}
    </div>
  );
}

// Usage in search
function SearchResults({ results }: { results: Article[] }) {
  return (
    <div>
      <LiveRegion>
        {results.length} articles found
      </LiveRegion>
      {/* Results list */}
    </div>
  );
}
```

---

# 20. ANALYTICS & MONITORING

## 20.1 Error Tracking (Sentry)

### 20.1.1 Sentry Configuration
```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  beforeSend(event) {
    // Filter out PII
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }
    return event;
  },
});

// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### 20.1.2 Custom Error Boundaries
```tsx
// components/ErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';

interface Props {
  children: ReactNode;
  fallback: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, {
      extra: { componentStack: errorInfo.componentStack },
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}
```

## 20.2 Performance Monitoring

### 20.2.1 Web Vitals Tracking
```typescript
// app/_components/WebVitals.tsx
'use client';

import { useReportWebVitals } from 'next/web-vitals';
import * as Sentry from '@sentry/nextjs';

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Send to analytics
    Sentry.captureMessage(`Web Vital: ${metric.name}`, {
      level: 'info',
      extra: {
        id: metric.id,
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        navigationType: metric.navigationType,
      },
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(metric);
    }
  });

  return null;
}
```

### 20.2.2 Custom Performance Marks
```typescript
// lib/performance.ts
export function markPerformance(label: string) {
  if (typeof window !== 'undefined' && 'performance' in window) {
    performance.mark(label);
  }
}

export function measurePerformance(label: string, startMark: string, endMark: string) {
  if (typeof window !== 'undefined' && 'performance' in window) {
    performance.measure(label, startMark, endMark);
    const entries = performance.getEntriesByName(label);
    return entries[entries.length - 1];
  }
}

// Usage
markPerformance('article-fetch-start');
const article = await fetchArticle(slug);
markPerformance('article-fetch-end');
const measure = measurePerformance('article-fetch', 'article-fetch-start', 'article-fetch-end');
```

## 20.3 Analytics Dashboard

### 20.3.1 Admin Analytics Page
```typescript
// app/admin/analytics/page.tsx
import { getAnalyticsData } from '@/lib/analytics';

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#00004E]">Analytics Dashboard</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard 
          title="Total Articles" 
          value={data.totalArticles} 
          trend={data.articlesTrend}
        />
        <MetricCard 
          title="Total Views" 
          value={data.totalViews} 
          trend={data.viewsTrend}
        />
        <MetricCard 
          title="Registered Users" 
          value={data.totalUsers} 
          trend={data.usersTrend}
        />
        <MetricCard 
          title="Comments" 
          value={data.totalComments} 
          trend={data.commentsTrend}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ViewsChart data={data.dailyViews} />
        <PopularArticlesChart data={data.popularArticles} />
      </div>

      {/* Tables */}
      <div className="space-y-6">
        <TopArticlesTable articles={data.topArticles} />
        <TrafficSourcesTable sources={data.trafficSources} />
      </div>
    </div>
  );
}
```

### 20.3.2 Analytics Data Schema
```sql
-- Table for analytics data
CREATE TABLE analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  returning_users INTEGER DEFAULT 0,
  avg_session_duration INTEGER DEFAULT 0, -- in seconds
  bounce_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE analytics_page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT NOT NULL,
  article_id UUID REFERENCES articles(id),
  views INTEGER DEFAULT 0,
  unique_views INTEGER DEFAULT 0,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_page_views_date ON analytics_page_views(date);
CREATE INDEX idx_analytics_page_views_path ON analytics_page_views(path);
```

## 20.4 Uptime Monitoring

### 20.4.1 Health Check Endpoint
```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const checks = {
    database: false,
    cloudinary: false,
    timestamp: new Date().toISOString(),
  };

  try {
    // Check database
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.from('categories').select('id').limit(1);
    checks.database = !error && data !== null;
  } catch {
    checks.database = false;
  }

  try {
    // Check Cloudinary (lightweight check)
    const response = await fetch(
      `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_1/test`
    );
    checks.cloudinary = response.status === 200 || response.status === 404;
  } catch {
    checks.cloudinary = false;
  }

  const allHealthy = checks.database && checks.cloudinary;

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'unhealthy',
      checks,
      uptime: process.uptime(),
    },
    { status: allHealthy ? 200 : 503 }
  );
}
```

### 20.4.2 External Monitoring
| Service | Purpose | Check Frequency |
|---------|---------|----------------|
| **UptimeRobot** | External uptime monitoring | Every 5 minutes |
| **Vercel Analytics** | Performance monitoring | Real-time |
| **Sentry** | Error tracking | Real-time |
| **Supabase Dashboard** | Database health | Real-time |
| **Cloudinary Dashboard** | Media delivery health | Real-time |

---

# 21. FUTURE ROADMAP (POST-MVP)

## 21.1 Phase 2: Enhanced Features (Months 3-4)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Mobile App** | React Native app for iOS/Android | P1 |
| **Push Notifications** | Web push + mobile push | P1 |
| **Advanced Search** | Full-text search with PostgreSQL | P1 |
| **Newsletter System** | Weekly digest with email templates | P1 |
| **Social Login** | Google, Microsoft OAuth | P2 |
| **Comment Reactions** | Like/dislike comments | P2 |
| **Article Series** | Multi-part article collections | P2 |
| **Author Profiles** | Public author pages with stats | P2 |

## 21.2 Phase 3: Advanced Features (Months 5-6)

| Feature | Description | Priority |
|---------|-------------|----------|
| **AI Content Assistant** | Grammar check, tone suggestions | P2 |
| **Auto-Tagging** | AI-powered article tagging | P2 |
| **Content Recommendations** | ML-based article suggestions | P2 |
| **Live Blogging** | Real-time event coverage | P2 |
| **Podcast Integration** | Audio articles | P3 |
| **Video Content** | Video news segments | P3 |
| **Multi-language** | Twi, Ga translations | P3 |
| **Print Edition** | PDF generation for print | P3 |

## 21.3 Phase 4: Platform Expansion (Months 7-12)

| Feature | Description | Priority |
|---------|-------------|----------|
| **API for Partners** | Public API for third parties | P2 |
| **White-label Solution** | For other universities | P3 |
| **Mobile SDK** | Embed in university apps | P3 |
| **Advanced Analytics** | Google Analytics 4 integration | P2 |
| **A/B Testing** | Content optimization | P3 |
| **Membership System** | Premium content tiers | P3 |
| **Event Ticketing** | Integration with campus events | P3 |
| **Alumni Network** | Dedicated alumni section | P3 |

---

# 22. APPENDICES

## Appendix A: UPSA Brand Guidelines Reference

### A.1 Official UPSA Colors
| Color | Hex | Pantone | Usage |
|-------|-----|---------|-------|
| Navy Blue | #00004E | 281C | Primary brand |
| Gold | #D4AF37 | 1245C | Accents |
| White | #FFFFFF | — | Backgrounds |

### A.2 Voice and Tone
- **Professional** but approachable
- **Authoritative** but not condescending
- **Inclusive** of all UPSA community members
- **Accurate** and fact-checked
- **Timely** and relevant

## Appendix B: File Structure

```
voice-of-upsa/
├── .github/
│   ├── workflows/
│   │   └── ci.yml
│   └── dependabot.yml
├── .husky/
│   ├── pre-commit
│   └── commit-msg
├── e2e/
│   ├── homepage.spec.ts
│   ├── auth.spec.ts
│   └── article.spec.ts
├── public/
│   ├── images/
│   │   ├── logo.svg
│   │   └── og-image.jpg
│   ├── favicon.ico
│   └── robots.txt
├── scripts/
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── signin/
│   │   │   ├── signup/
│   │   │   └── reset-password/
│   │   ├── (public)/
│   │   │   ├── page.tsx
│   │   │   ├── about/
│   │   │   ├── contact/
│   │   │   ├── advertise/
│   │   │   ├── article/
│   │   │   │   └── [slug]/
│   │   │   └── category/
│   │   │       └── [slug]/
│   │   ├── admin/
│   │   │   ├── dashboard/
│   │   │   ├── articles/
│   │   │   ├── users/
│   │   │   └── settings/
│   │   ├── editor/
│   │   │   ├── dashboard/
│   │   │   └── articles/
│   │   ├── api/
│   │   │   ├── articles/
│   │   │   ├── auth/
│   │   │   ├── categories/
│   │   │   ├── comments/
│   │   │   ├── contact/
│   │   │   ├── media/
│   │   │   ├── search/
│   │   │   └── users/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── sitemap.ts
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Navigation.tsx
│   │   ├── articles/
│   │   │   ├── ArticleCard.tsx
│   │   │   ├── ArticleList.tsx
│   │   │   ├── ArticleDetail.tsx
│   │   │   └── ArticleEditor.tsx
│   │   ├── auth/
│   │   │   ├── SignInForm.tsx
│   │   │   ├── SignUpForm.tsx
│   │   │   └── UserMenu.tsx
│   │   ├── comments/
│   │   │   ├── CommentList.tsx
│   │   │   └── CommentForm.tsx
│   │   ├── ads/
│   │   │   ├── AdBanner.tsx
│   │   │   └── AdSidebar.tsx
│   │   └── shared/
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBoundary.tsx
│   │       └── Pagination.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useArticles.ts
│   │   ├── useComments.ts
│   │   └── useMedia.ts
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   └── server.ts
│   │   ├── cloudinary.ts
│   │   ├── validation.ts
│   │   ├── utils.ts
│   │   └── constants.ts
│   ├── types/
│   │   ├── database.ts
│   │   ├── article.ts
│   │   ├── user.ts
│   │   └── api.ts
│   └── middleware.ts
├── tests/
│   ├── setup.ts
│   ├── mocks/
│   │   └── handlers.ts
│   ├── components/
│   ├── hooks/
│   └── lib/
├── supabase/
│   ├── migrations/
│   ├── functions/
│   └── seed.sql
├── .env.local.example
├── .env.production.example
├── .eslintrc.js
├── .prettierrc
├── commitlint.config.js
├── next.config.js
├── package.json
├── playwright.config.ts
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## Appendix C: Environment Variables Template

### C.1 Development (.env.local)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Application
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=Voice of UPSA (Dev)

# Security
JWT_SECRET=dev-jwt-secret-min-32-characters-long
ENCRYPTION_KEY=dev-encryption-key-32-chars

# Monitoring (optional for dev)
# SENTRY_DSN=
# NEXT_PUBLIC_SENTRY_DSN=
```

### C.2 Production (.env.production)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Application
NEXT_PUBLIC_SITE_URL=https://voiceofupsa.edu.gh
NEXT_PUBLIC_SITE_NAME=Voice of UPSA

# Security
JWT_SECRET=your-production-jwt-secret-32-chars-min
ENCRYPTION_KEY=your-production-encryption-key-32-chars

# Monitoring
SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_SENTRY_DSN=your-public-sentry-dsn

# Rate Limiting (optional)
# REDIS_URL=redis://your-redis-url
```

## Appendix D: API Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `SUCCESS` | 200 | Request successful |
| `CREATED` | 201 | Resource created |
| `NO_CONTENT` | 204 | Request successful, no content |
| `BAD_REQUEST` | 400 | Invalid request parameters |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `UNPROCESSABLE` | 422 | Validation failed |
| `RATE_LIMITED` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

## Appendix E: Glossary

| Term | Definition |
|------|-----------|
| **CDN** | Content Delivery Network - distributed servers for fast content delivery |
| **CSP** | Content Security Policy - browser security feature to prevent XSS |
| **CSR** | Client-Side Rendering - rendering in the browser |
| **ISR** | Incremental Static Regeneration - Next.js feature for static updates |
| **JWT** | JSON Web Token - compact, URL-safe token format |
| **LCP** | Largest Contentful Paint - Core Web Vital metric |
| **OG** | Open Graph - protocol for social media sharing |
| **PWA** | Progressive Web App - web app with native app features |
| **RLS** | Row Level Security - PostgreSQL feature for data access control |
| **RSC** | React Server Component - server-rendered React component |
| **SEO** | Search Engine Optimization - improving search visibility |
| **SSR** | Server-Side Rendering - rendering on the server |
| **TTFB** | Time to First Byte - server response time metric |
| **UUID** | Universally Unique Identifier - standard for unique IDs |
| **WCAG** | Web Content Accessibility Guidelines - accessibility standards |
| **XSS** | Cross-Site Scripting - injection of malicious scripts |

## Appendix F: Contact Information

### F.1 Development Team
| Role | Name | Email |
|------|------|-------|
| **Project Lead** | [Name] | [email@upsa.edu.gh] |
| **Tech Lead** | [Name] | [email@upsa.edu.gh] |
| **Frontend Dev** | [Name] | [email@upsa.edu.gh] |
| **Backend Dev** | [Name] | [email@upsa.edu.gh] |
| **UI/UX Designer** | [Name] | [email@upsa.edu.gh] |

### F.2 External Services
| Service | Support URL | Status Page |
|---------|-------------|-------------|
| **Vercel** | vercel.com/support | status.vercel.com |
| **Supabase** | supabase.com/support | status.supabase.com |
| **Cloudinary** | cloudinary.com/support | status.cloudinary.com |
| **Sentry** | sentry.io/support | status.sentry.io |

---

**END OF DOCUMENTATION**

*This document is a living document and will be updated as the project evolves. For the latest version, please refer to the project repository.*

**Document Version:** 1.0  
**Last Updated:** May 2026  
**Maintained by:** Voice of UPSA Development Team  
**Review Cycle:** Monthly during active development, quarterly post-launch
