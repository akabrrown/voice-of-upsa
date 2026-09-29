**TECHNICAL DESIGN DOCUMENT**  
**Campus Gallery**  
Architecture, security, and API design — Phase 1  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0  
**Repo structure:** Feature module inside the existing Voice of UPSA repo; reuses Campus Mart’s Cloudinary pipeline and the shared audit log

Table of Contents
=================

1\. Architecture Overview
=========================

The first Wave 2 feature, and the first since Campus Mart to reintroduce a real media pipeline. Reuses Cloudinary wholesale rather than evaluating a new provider, and reuses the submit-then-moderate shape established by the Job Board.

| **Layer** | **Choice** | **Notes** |
| --- | --- | --- |
| Frontend | Next.js (App Router) + TypeScript + Tailwind + shadcn/ui | Same design system across every feature so far |
| Data fetching | TanStack Query | Album and photo grid caching |
| Backend | Next.js Server Actions + Supabase (Postgres, Auth) | No Realtime needed |
| Validation | Zod | Shared client/server schema for album and submission forms |
| Media | Cloudinary (signed uploads) | Same pipeline as Campus Mart; upload preset configured to strip EXIF/location metadata unconditionally (Section 5.1) |
| Caching | Upstash Redis | Album listing cached, similar TTL to the Directory — albums change on the order of days, not minutes |
| Abuse protection | Arcjet | Rate limit on submission and reporting; daily per-student per-album submission cap enforced server-side |
| Audit | Shared public.audit\_logs | Every moderation and removal decision writes here |
| Deployment | Vercel | Same project as the rest of Voice of UPSA |

2\. Roles & Permission Matrix
=============================

| **Resource** | **Visitor** | **User (submitter)** | **Admin** |
| --- | --- | --- | --- |
| Album (read, published) | Yes | Yes | Yes, plus draft |
| Album (create/edit/feature) | No | No | Yes |
| Photo (read, approved) | Yes | Yes | Yes, plus pending/rejected |
| Photo (submit) | No | Yes, to open albums only | Yes (auto-approved) |
| Photo (approve/reject) | No | No | Yes |
| Photo (withdraw own pending) | No | Yes, own only | n/a |
| Photo (remove, any) | No | No | Yes |
| Reports (create) | No | Yes | n/a |
| Reports (resolve) | No | No | Yes |

3\. Threat Model
================

| **#** | **Threat** | **Mitigation** |
| --- | --- | --- |
| T1 | Inappropriate, offensive, or harmful image submitted by a student | Mandatory Admin approval before any submitted photo is publicly visible — no auto-publish path for submissions |
| T2 | A photo leaks a student’s precise location (EXIF GPS) or device information | EXIF/location metadata is stripped at the Cloudinary upload step, unconditionally, for both submitted and Admin-uploaded photos — not a filter applied only on the public-facing render |
| T3 | A photo is published showing someone who never consented to appear in it | Submission requires an explicit consent confirmation (Section 6 of PRD), stored with the submission; a dedicated "didn’t consent" report path is reviewed with priority and can result in immediate removal |
| T4 | Submitter falsely claims ownership/rights over a photo they don’t hold (copyright) | Consent/rights confirmation is captured at submission time as a stored boolean tied to the submitter’s account — not a legal guarantee, but a due-diligence record and a deterrent, reviewed by Admin before publish |
| T5 | Submission flooding a single album’s review queue | Server-enforced daily cap on submissions per student per album, plus Arcjet rate limiting on the submit action |
| T6 | A malicious report used to get a legitimate photo pulled | Reports are reviewed by Admin before any removal action — filing a report never auto-hides a photo, same stance as Campus Mart and the Job Board |
| T7 | Non-owner withdraws or edits another student’s pending submission | RLS keyed to submitter\_id = auth.uid() for withdrawal; there is no edit path for a submission at all — withdraw and resubmit instead, which keeps the moderation model simple |

4\. API Surface (Phase 1)
=========================

| **Action** | **Input** | **Notes** |
| --- | --- | --- |
| getAlbums | category, cursor | Public; only status = published |
| getAlbum | slug | Public; includes submissions\_open flag |
| getAlbumPhotos | album\_id, cursor | Public; only status = approved (or Admin-uploaded, auto-approved) |
| submitPhoto | album\_id, image, caption, consent\_confirmed | Rejected server-side if submissions\_open = false or the daily cap is hit (T5); consent\_confirmed must be true |
| withdrawSubmission | photo\_id | Owner only, status = pending\_review only (T7) |
| reportPhoto | photo\_id, reason (incl. no\_consent), details | no\_consent reason flagged for priority review |
| createAlbum / updateAlbum (Admin) | album fields | Includes submissions\_open toggle |
| uploadPhoto (Admin) | album\_id, image, caption | Auto-approved, no review step |
| reviewSubmission (Admin) | photo\_id, decision, note | Writes audit log |
| removePhoto (Admin) | photo\_id | Soft delete; writes audit log |
| resolveReport (Admin) | report\_id, resolution, note | Writes audit log |

5\. Data Integrity
==================

### 5.1 Metadata stripping

The Cloudinary upload preset for this feature strips EXIF and any embedded GPS/location data on every upload, before the asset is ever stored — enforced at the pipeline level, not left to a client-side setting a submitter could bypass.

### 5.2 Photo status transitions

submitted photos: pending\_review -> approved, rejected  
pending\_review -> withdrawn (submitter action)  
admin uploads: (created directly as approved, no pending state)  
any approved photo -> removed (Admin only, soft delete)

### 5.3 Reports promoted to a shared platform table

Campus Mart’s reports, the Job Board’s job\_reports, and this feature’s photo reports all share the same shape (entity type, entity id, reporter, reason, resolution). Rather than adding a third near-identical table, Gallery reports write directly into a new shared public.reports table — the same promotion Campus Mart’s audit log went through at the Directory. Migrating the two existing tables into it is a tracked Phase 2 cleanup, not required to ship this feature.  
public.reports  
id, entity\_type, entity\_id, reporter\_id, reason, details,  
status, resolution\_note, resolved\_by, resolved\_at, created\_at  
entity\_type for this feature: "gallery\_photo"  
reason includes "no\_consent" as a first-class value, not just "other"

6\. Performance Strategy
========================

*   Cloudinary responsive transformations serve appropriately sized images per viewport — grid thumbnails never load full-resolution originals
*   Album listing cached in Redis, invalidated on publish/feature changes
*   Cursor-based pagination on photo grids for large albums
*   Lightbox loads the next/previous image lazily rather than the whole album at once