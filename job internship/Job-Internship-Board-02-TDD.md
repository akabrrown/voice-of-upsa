**TECHNICAL DESIGN DOCUMENT**  
**Job/Internship Board**  
Architecture, security, and API design — Phase 1  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0  
**Repo structure:** Feature module inside the existing Voice of UPSA repo; reuses Campus Mart’s moderation pattern and the shared audit log

Table of Contents
=================

1\. Architecture Overview
=========================

Structurally closest to Campus Mart’s product moderation flow of anything in Wave 1 — a submit-then-review lifecycle with a re-review-on-edit rule — but without inventory, pricing, or fulfillment. No new infrastructure beyond what Campus Mart, Polls, and the Directory already established.

| **Layer** | **Choice** | **Notes** |
| --- | --- | --- |
| Frontend | Next.js (App Router) + TypeScript + Tailwind + shadcn/ui | Same design system across all four features |
| Data fetching | TanStack Query | Listing and filter caching |
| Backend | Next.js Server Actions + Supabase (Postgres, Auth) | No Realtime needed — moderation state changes don’t need to push live to a viewer |
| Validation | Zod | Shared client/server schema for posting submission and edits |
| Caching | Upstash Redis | Listing page cached with a shorter TTL than the Directory — postings churn faster (Section 6) |
| Abuse protection | Arcjet | Rate limit on posting submission and reporting |
| Audit | Shared public.audit\_logs | Every moderation decision and re-review trigger writes here (Section 5.2) |
| Deployment | Vercel | Same project as the rest of Voice of UPSA |

2\. Roles & Permission Matrix
=============================

| **Resource** | **Visitor** | **User (poster)** | **Admin** |
| --- | --- | --- | --- |
| Posting (read, approved + active) | Yes | Yes | Yes, plus pending/rejected/expired |
| Posting (create) | No | Yes | Yes |
| Posting (edit) | No | Own only — resets to pending\_review | Any |
| Posting (close/remove) | No | Own only | Any |
| Posting (approve/reject) | No | No | Yes |
| Reports (create) | No | Yes | n/a |
| Reports (resolve) | No | No | Yes |
| Categories | Read | Read | Full CRUD |

3\. Threat Model
================

| **#** | **Threat** | **Mitigation** |
| --- | --- | --- |
| T1 | Fake or scam posting reaches students (advance-fee scam, phishing dressed as a job application) | Mandatory Admin approval before any posting is publicly visible — no auto-publish path exists in the code at all, not just disabled by config |
| T2 | Bait-and-switch: a poster edits an already-approved listing to slip in scam content after review | Any UPDATE to an approved posting’s content fields sets status back to pending\_review server-side, unconditionally — the poster cannot opt out of re-review |
| T3 | Non-owner edits or closes another user’s posting | RLS keyed to poster\_id = auth.uid() for all poster-level writes; Admin bypass is explicit, not a default |
| T4 | Posting spam / scripted flooding of submissions | Arcjet rate limit on the submit-posting action per user/IP |
| T5 | Fraudulent report abuse (mass-reporting a legitimate posting to get it pulled) | Reports are logged with reporter\_id and reviewed by Admin before any action is taken — reporting alone never auto-hides a posting |
| T6 | Expired posting stays visible and misleads a student about an open deadline | Public read query excludes postings where expires\_at has passed, evaluated at query time — no reliance on a background job to hide stale content |
| T7 | Contact/how-to-apply info scraped at scale | Public by design (students need it to apply) — Arcjet rate limiting applied for load protection, not information disclosure, same stance as the Directory |
| T8 | SQL injection via search input | Parameterized queries; Postgres tsquery built server-side, never string-concatenated |

4\. API Surface (Phase 1)
=========================

| **Action** | **Input** | **Notes** |
| --- | --- | --- |
| getPostings | query, type, category, location, cursor | Public; only status = approved and not expired |
| getPosting | slug | Public column set; includes poster’s own edit state if the caller is the owner |
| createPosting | posting fields | Enters pending\_review |
| updatePosting | posting fields | Owner only; forces status back to pending\_review (T2) |
| closePosting | posting\_id | Owner or Admin; sets status = closed |
| reportPosting | posting\_id, reason, details | Rate limited (T4) |
| reviewPosting (Admin) | posting\_id, decision, note | Approve / reject / request changes; writes audit log |
| resolveReport (Admin) | report\_id, resolution, note | Writes audit log |
| manageCategory (Admin) | category fields | Writes audit log |

5\. Data Integrity
==================

### 5.1 Posting status transitions

allowed edges:  
pending\_review -> approved, rejected  
approved -> pending\_review (on any content edit — T2)  
approved -> closed (owner or Admin, manual)  
approved -> expired (computed at read time from expires\_at)  
rejected -> pending\_review (owner resubmits after addressing feedback)

### 5.2 Shared audit log

Every moderation decision, re-review trigger, and report resolution writes into the same public.audit\_logs table promoted during the Student Services Directory build — no new audit infrastructure introduced here.

### 5.3 Soft delete

Admin "remove" is a soft delete (deleted\_at); a rejected or closed posting is never hard-deleted, preserving a record for repeat-offender detection later.

6\. Performance Strategy
========================

*   Cursor-based pagination on the listing endpoint
*   Postgres full-text search (tsvector + GIN) plus filters on type/category/location as plain indexed columns
*   Listing cached in Redis with a shorter TTL than the Directory’s — postings are added, closed, and expire more frequently than service listings
*   Expiry handled as a query-time filter (expires\_at > now()), not a scheduled sweep — avoids adding a background job for something a plain indexed comparison already handles cheaply