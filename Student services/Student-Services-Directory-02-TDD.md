**TECHNICAL DESIGN DOCUMENT**  
**Student Services Directory**  
Architecture, security, and API design — Phase 1  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0  
**Repo structure:** Feature module inside the existing Voice of UPSA repo; reuses Campus Mart’s auth, design system, and Arcjet setup

Table of Contents
=================

1\. Architecture Overview
=========================

The lowest-risk feature in Wave 1 — no votes, no transactions, no per-user state at all in Phase 1. Almost entirely a cached read path plus a small Admin CRUD surface.

| **Layer** | **Choice** | **Notes** |
| --- | --- | --- |
| Frontend | Next.js (App Router) + TypeScript + Tailwind + shadcn/ui | Same design system as Campus Mart and Campus Polls |
| Data fetching | TanStack Query | Directory and category listing caching |
| Backend | Next.js Server Actions + Supabase (Postgres, Auth) | No Realtime needed — nothing here updates live in front of a viewer |
| Validation | Zod | Shared client/server schema for listing create/edit |
| Media | Cloudinary (signed uploads) | Service logos/images, same pipeline as Campus Mart |
| Caching | Upstash Redis | Directory and category pages cached aggressively — this data changes rarely (Section 6) |
| Abuse protection | Arcjet | Rate limit on the Admin write endpoints; public read endpoints are the lowest-abuse-risk surface in the platform so far |
| Deployment | Vercel | Same project as the rest of Voice of UPSA |

2\. Roles & Permission Matrix
=============================

| **Resource** | **Visitor / User** | **Admin** |
| --- | --- | --- |
| Service listing (read, active) | Yes — no login required | Yes, plus inactive/draft listings |
| Service listing (create/edit/deactivate) | No | Yes |
| Categories (read) | Yes | Yes |
| Categories (create/edit/reorder) | No | Yes |
| Verification timestamp | Read-only, shown publicly | Can refresh via "verify today" action |
| Audit log | No | Read-only (shared platform table — Section 5.2) |

3\. Threat Model
================

A narrower threat surface than Campus Mart or Polls — there’s no vote or price to tamper with, and no per-student data to leak. The risks here are almost entirely about the integrity of Admin-controlled content that students rely on under stress.

| **#** | **Threat** | **Mitigation** |
| --- | --- | --- |
| T1 | Compromised or malicious Admin account alters a critical listing (e.g. changes the counseling or security hotline number to a wrong or malicious one) | Every write to a service listing is recorded in the shared, append-only audit log (actor, before/after, timestamp) — no UPDATE/DELETE grant on that table, same pattern as Campus Mart’s (Section 5.2) |
| T2 | Listing goes stale without anyone noticing (wrong hours, disconnected phone number) and a student acts on bad information | last\_verified\_at is shown publicly on every listing, so staleness is visible rather than hidden; a Phase 2 scheduled reminder nudges Admin to re-verify (PRD §7) |
| T3 | A listing’s external link (website\_url) is changed to point somewhere unsafe | URL is validated as well-formed at save time; Admin remains the only writer in Phase 1, so this reduces to "trust the Admin account," reinforced by T1’s audit trail |
| T4 | Scripted scraping or abuse of the search/listing endpoints | Arcjet rate limiting on public read endpoints as a baseline, even though this data is meant to be public — protects against load-based abuse, not information disclosure (this directory has no reveal-gated fields, unlike Campus Mart’s WhatsApp numbers) |
| T5 | Category sprawl or inconsistent naming makes the directory hard to browse over time | Category CRUD is Admin-only and deliberately small (Section 4 of PRD) — an operational discipline note more than a technical control |

4\. API Surface (Phase 1)
=========================

| **Action** | **Input** | **Notes** |
| --- | --- | --- |
| getServices | query, category, cursor | Public; only status = active rows; cached (Section 6) |
| getService | slug | Public; includes last\_verified\_at |
| getServiceCategories | — | Cached, invalidated on admin write |
| createService (Admin) | listing fields | Sets last\_verified\_at = now() on create |
| updateService (Admin) | listing fields | Writes audit log entry (T1) |
| verifyServiceToday (Admin) | service\_id | Refreshes last\_verified\_at without a full edit |
| deactivateService / deleteService (Admin) | service\_id | Deactivate hides from public directory; delete is soft-delete only |
| manageCategory (Admin) | category fields | Writes audit log entry |

5\. Data Integrity & Platform Reuse
===================================

### 5.1 Soft delete

Services are soft-deleted (deleted\_at), consistent with Campus Mart’s pattern, so historical references (e.g. a future Job Board link to a Careers Services listing) never break silently.

### 5.2 Audit log promoted to a shared platform table

Campus Mart’s audit\_logs table was scoped to the mart schema. The Directory is the natural point to promote it to a shared, platform-level table (public.audit\_logs) that any feature’s Admin actions can write into — this is the first cross-feature infrastructure promotion tracked in the Platform Cross-Feature Notes (App Flow §3), and future features should write here rather than re-inventing a per-feature audit table.  
public.audit\_logs  
id, actor\_id, action, resource\_type, resource\_id, metadata jsonb, created\_at  
INSERT-only for the application role; SELECT restricted to Admin  
action examples: "service.updated", "service.verified", "category.created"

6\. Performance Strategy
========================

*   Directory home and category pages cached in Redis with a longer TTL than Campus Mart’s (this content changes on the order of days/weeks, not minutes) — invalidated explicitly on any Admin write rather than relying on TTL alone
*   Postgres full-text search (tsvector + GIN) on name/description, same approach as Campus Mart’s product search
*   No Realtime subscriptions needed — nothing on this feature updates while a student is looking at the page