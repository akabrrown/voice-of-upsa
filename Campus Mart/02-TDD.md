**TECHNICAL DESIGN DOCUMENT**  
**Campus Mart**  
Architecture, security, and API design — Phase 1  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0  
**Repo structure:** Feature module inside the existing Voice of UPSA repo  
**Companion docs:** PRD · Design Brief · App Flow · Backend Schema

Table of Contents
=================

1\. Architecture Overview
=========================

Campus Mart ships as a feature module inside the existing voiceofupsa.com codebase rather than a separate app — it shares auth, the Postgres instance, and the deployment pipeline. This keeps it a Full-Stack Single-Repo addition: new route groups under /mart and /admin/mart, a marketplace/ package for shared types and Zod schemas, and its own migration set kept logically separate from existing Voice of UPSA tables.

| **Layer** | **Choice** | **Notes** |
| --- | --- | --- |
| Frontend | Next.js (App Router) + TypeScript + Tailwind + shadcn/ui | Reuses the existing Voice of UPSA design system where components already exist (buttons, cards, nav) |
| Data fetching | TanStack Query | Client-side caching for product/store data; pairs with Server Actions for mutations |
| Backend | Next.js Server Actions / Route Handlers + Supabase (Postgres, Auth, Storage, Realtime) | No separate API service needed at Phase 1 scale |
| Validation | Zod | Single schema shared between client form and server action — no drift |
| Media | Cloudinary (signed uploads) | Product images and store logos/banners; Supabase Storage is not used for marketplace media |
| Async jobs | Upstash QStash + Redis | Scheduled analytics rollups, low-stock checks, notification fan-out |
| Realtime | Supabase Realtime | Order status pushes to buyer and seller dashboards |
| Bot / abuse protection | Arcjet | Rate limits on registration, product creation, reviews, contact-reveal |
| Search | Postgres tsvector + GIN, pg\_trgm for fuzzy match | No separate search service at Phase 1 scale |
| Notifications (future channels) | Resend (email), Africa’s Talking (SMS) | In-app notification centre is the only channel required for Phase 1 |
| Deployment | Vercel | Existing Voice of UPSA deployment target |

2\. Roles & Permission Matrix
=============================

Two-role model: Admin and User, with contextual flags (is\_seller, seller\_status) rather than separate role tables or a third “seller” role. Enforced at the database layer via Row Level Security, not just in the UI.

| **Resource** | **Visitor** | **User (buyer)** | **User (verified seller, own store)** | **Admin** |
| --- | --- | --- | --- | --- |
| Product (read, approved) | Yes | Yes | Yes | Yes |
| Product (create/edit/delete) | No | No | Own only | Any (moderation) |
| Store (read, public fields) | Yes | Yes | Yes | Yes |
| Store (edit) | No | No | Own only | Any (suspension) |
| Cart / wishlist items | No | Own only | Own only | No direct access |
| Order (read) | No | Own (as buyer) only | Own store’s orders only | Any |
| Order (status update) | No | Cancel own, pre-confirmation only | Own store’s orders, forward transitions only | Any (dispute override) |
| Reviews (create) | No | Own delivered orders only | n/a | No |
| Reports / disputes (create) | No | Yes | Yes | n/a |
| Reports / disputes (resolve) | No | No | No | Yes |
| Seller verification | No | Apply only | View own status | Approve/reject/suspend |
| Categories | Read | Read | Read | Full CRUD |
| Audit log | No | No | No | Read-only |

is\_admin and seller\_status are never trusted from a client-submitted request — both are read server-side from the authenticated session/JWT claims on every mutation.

3\. Threat Model
================

Threats specific to a peer-to-peer campus marketplace, mapped to a mitigation already implementable with the Phase 1 stack.

| **#** | **Threat** | **Mitigation** |
| --- | --- | --- |
| T1 | Buyer or client tampers with product price/discount at checkout | Server re-fetches product row and recomputes subtotal/discount/total from the database; client-submitted price fields are ignored entirely |
| T2 | Two buyers race the last unit of stock (overselling) | Stock decrement runs inside a Postgres function using SELECT ... FOR UPDATE (row lock) or an atomic conditional UPDATE; never a read-then-write from the app layer |
| T3 | Seller or buyer edits/reads another seller’s products, orders, or customers | RLS policy on every marketplace table keyed to auth.uid() = owner column; verified server-side, not just hidden in the UI |
| T4 | Order status manipulated into an invalid state (e.g. Delivered → Pending, or skipping Confirmed) | Status transitions enforced by a Postgres check constraint / trigger encoding the allowed edges of the state machine (Section 5.3 of Backend Schema) |
| T5 | Fake or review-bombing reviews | Review insert requires order\_id with status = Delivered and buyer\_id = auth.uid(); unique constraint one review per (order, target) |
| T6 | Seller slug collision or enumeration via guessed/crafted slugs | Slugs generated server-side from store/product name with a collision-retry suffix; never accept a client-supplied slug directly |
| T7 | Duplicate order created by checkout double-submit or network retry | Checkout accepts a client-generated idempotency key; server upserts on that key within a short TTL |
| T8 | Malicious or oversized file uploaded as a product image | Cloudinary signed upload with server-issued signature; content-type sniffed server-side (not trusted from the file extension); size cap enforced at signature-generation time |
| T9 | Scraping seller WhatsApp numbers / contact-seller spam | Arcjet rate limit on the contact-reveal and messaging endpoints; numbers never included in server-rendered public HTML — fetched on explicit user action |
| T10 | SQL injection via unsanitized search input | Parameterized queries only; Postgres tsquery/plainto\_tsquery built from user input server-side, never string-concatenated |
| T11 | Exposure of private fields (student/index number, internal notes) on public storefront/product pages | Public read policies and API responses select an explicit public column list — never SELECT \* — on any publicly reachable query |
| T12 | Admin action taken without traceability (wrongful product removal, seller suspension) | Every admin mutation writes an append-only audit\_logs row (actor, action, resource, before/after, timestamp) with no UPDATE/DELETE grant on that table |
| T13 | Brute-force or scripted abuse of seller registration / product creation / review submission | Arcjet rate limiting per endpoint per user/IP |

4\. API Surface (Phase 1)
=========================

Implemented as Next.js Server Actions where the caller is always an authenticated browser session, and Route Handlers where a stable JSON contract is needed (webhooks, future mobile client). All mutating actions validate input with a Zod schema before touching the database.

4.1 Public read
---------------

| **Action** | **Input** | **Notes** |
| --- | --- | --- |
| getProducts | query, category, price range, condition, seller, sort, cursor | Cursor-based pagination; only status = approved rows |
| getProduct | slug | Public column set only |
| getStore | slug | Public column set only; includes aggregated rating, product count |
| getCategories | — | Cached (Redis, short TTL), invalidated on admin write |

4.2 Buyer
---------

| **Action** | **Input** | **Notes** |
| --- | --- | --- |
| addToCart / updateCartItem / removeCartItem | product\_id, quantity | Server re-validates stock on every mutation |
| checkout | cart snapshot, delivery\_location\_id, idempotency\_key | Server recomputes all prices; splits into one order per seller sharing a checkout\_session\_id (T1, T7) |
| cancelOrder | order\_id | Allowed only while status = Pending or Confirmed and buyer\_id = auth.uid() |
| createReview | order\_id, target\_type, rating, comment | Server checks order.status = Delivered and ownership (T5) |
| reportEntity | entity\_type, entity\_id, reason, details | Rate limited (T13) |
| sendMessage | store\_id or order\_id, body | Rate limited; persisted, not just relayed to WhatsApp |

4.3 Seller
----------

| **Action** | **Input** | **Notes** |
| --- | --- | --- |
| applySeller | seller registration fields | Creates seller\_details with status = pending\_verification |
| createStore / updateStore | store fields | RLS: owner only |
| createProduct / updateProduct / deleteProduct | product fields | New/edited products reset to status = pending\_review; soft-delete only |
| updateOrderStatus | order\_id, next\_status, note | Server validates the transition against the state machine and store ownership (T4) |
| getSellerAnalytics | store\_id, range | Reads from a scheduled rollup table, not a live aggregate query |

4.4 Admin
---------

| **Action** | **Input** | **Notes** |
| --- | --- | --- |
| reviewSellerApplication | seller\_id, decision, note | Writes audit\_logs |
| reviewProduct | product\_id, decision, note | Writes audit\_logs |
| manageCategory | category fields | Writes audit\_logs |
| resolveReport | report\_id, resolution, note | Writes audit\_logs |

5\. Data Integrity Patterns
===========================

### 5.1 Snapshot pricing

order\_items stores unit\_price\_snapshot and discount\_snapshot captured at order creation. The live product price can change freely without ever altering a placed order’s total — the same pattern used across other Codey Dev booking/ordering systems.

### 5.2 Concurrency-safe stock

Stock decrement is a single Postgres function call performed inside the checkout transaction, using row locking so two simultaneous checkouts against the last unit cannot both succeed.

### 5.3 Order state machine

Allowed transitions: Pending → Confirmed → Processing → Ready for Delivery → Out for Delivery → Delivered. Side branches: Pending/Confirmed → Cancelled; any active state → Disputed (admin-only entry). Any transition outside this graph is rejected at the database layer, not just hidden in the UI.

### 5.4 Append-only audit trail

audit\_logs has INSERT-only grants for the application role; no UPDATE or DELETE path exists, including for admins, through the application.

### 5.5 Soft delete

Products and stores are soft-deleted (deleted\_at timestamp) rather than hard-deleted, so historical orders keep a valid reference even after a seller removes a product.

6\. Performance Strategy
========================

*   Cursor-based pagination on every list endpoint (products, orders, reviews) — no OFFSET at scale
*   Postgres full-text search (tsvector + GIN index) plus pg\_trgm for typo-tolerant matching; no external search service at Phase 1 volume
*   Homepage/category/featured data cached in Upstash Redis with a short TTL, invalidated on the relevant admin write
*   Seller and product analytics computed by a scheduled QStash job into a rollup table — dashboards read the rollup, never aggregate live
*   Order status changes pushed via Supabase Realtime instead of client polling
*   Product images served through Cloudinary transformations + Next.js <Image> for responsive, lazy-loaded delivery
*   Low-stock and new-order notifications fan out asynchronously via QStash, not inline in the request that triggered them

7\. Deployment & Environments
=============================

*   Vercel — same project as the existing Voice of UPSA frontend; marketplace routes ship as part of the same build
*   Supabase — same project/instance; marketplace tables live in their own schema (mart) to keep migrations and RLS policies easy to audit independently of existing Voice of UPSA tables
*   Environment separation (staging/production) reused from the existing Voice of UPSA setup; no new environment variables beyond Cloudinary and Arcjet keys for this feature