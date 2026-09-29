**TECHNICAL DESIGN DOCUMENT**  
**UPSA Campus Map**  
Architecture, security, and API design — Phase 1  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0  
**Repo structure:** Feature module inside the existing Voice of UPSA repo; reuses the shared audit log; introduces Mapbox GL JS / MapLibre GL

Table of Contents
=================

1\. Architecture Overview
=========================

The lowest-risk feature since Campus Polls — entirely Admin-authored content, no user submissions, no moderation queue, no reports table. The only new piece of infrastructure is the map library itself, already named in the standing engineering stack.

| **Layer** | **Choice** | **Notes** |
| --- | --- | --- |
| Frontend | Next.js (App Router) + TypeScript + Tailwind + shadcn/ui | Same design system as every prior feature |
| Map rendering | Mapbox GL JS (or MapLibre GL as the open-source fallback) | Standing stack choice; a custom map style applied to match the Voice of UPSA palette rather than Mapbox’s default styling |
| Data fetching | TanStack Query | Pin list caching |
| Backend | Next.js Server Actions + Supabase (Postgres, Auth, PostGIS) | PostGIS used for coordinate storage and any future proximity queries, consistent with the standing stack |
| Validation | Zod | Shared client/server schema for pin create/edit |
| Media | Cloudinary (signed uploads) | Optional pin photos; same EXIF/location-stripping preset established as a platform-wide rule by Campus Gallery |
| Caching | Upstash Redis | Pin list cached aggressively — this data changes rarely, same posture as the Directory |
| Audit | Shared public.audit\_logs | Every pin create/edit/deactivate writes here |
| Deployment | Vercel | Same project as the rest of Voice of UPSA |

2\. Roles & Permission Matrix
=============================

| **Resource** | **Visitor / User** | **Admin** |
| --- | --- | --- |
| Map pins (read, active) | Yes — no login required | Yes, plus inactive |
| Map pins (create/edit/deactivate) | No | Yes |
| Pin categories | Read | Full CRUD |

3\. Threat Model
================

A narrower surface than any feature since Campus Mart — there is no user-generated content here to abuse, so the risks are about data accuracy and standard infrastructure hygiene rather than trust-and-safety.

| **#** | **Threat** | **Mitigation** |
| --- | --- | --- |
| T1 | Compromised or malicious Admin account places an incorrect or misleading pin (e.g. wrong location for a health or security service) | Every pin write is recorded in the shared, append-only audit log (actor, before/after, timestamp) — same control used for the Directory’s listings (TDD precedent, Directory §5.2) |
| T2 | A pin’s cross-link (to a Directory service or Gallery album) goes stale — the linked resource is later deactivated, unpublished, or removed | The pin detail query checks the linked resource’s current public status at read time and simply omits the link if it’s no longer active — never a dead or misleading link (Section 5.2) |
| T3 | Public Mapbox access token is copied and used on another site, running up usage against this account | The public token is restricted to the Voice of UPSA domain(s) in the Mapbox dashboard — a standard, concrete Mapbox security setting, called out explicitly in the deployment checklist (Section 6) |
| T4 | SQL injection via the pin search input | Parameterized queries; no string-concatenated search |
| T5 | Scripted/high-volume abuse of the pin-list endpoint | Arcjet rate limiting as a baseline, consistent with every public read endpoint on the platform, even though this data carries no disclosure risk |

4\. API Surface (Phase 1)
=========================

| **Action** | **Input** | **Notes** |
| --- | --- | --- |
| getMapPins | category, bounds (optional, for viewport-based loading), cursor | Public; only status = active; cached |
| getMapPin | slug | Public; includes the linked service/album’s current public status (T2) |
| getMapCategories | — | Cached, invalidated on admin write |
| createPin (Admin) | pin fields | Coordinates set via map-click picker on the Admin form, not typed |
| updatePin (Admin) | pin fields | Writes audit log |
| deactivatePin / deletePin (Admin) | pin\_id | Deactivate hides from public map; delete is soft-delete only |
| manageCategory (Admin) | category fields | Writes audit log |

5\. Data Integrity
==================

### 5.1 Soft delete

Pins are soft-deleted, consistent with every other feature’s pattern.

### 5.2 Cross-link freshness check

on getMapPin:  
if pin.linked\_service\_id is set:  
include the link only if directory.services.status = active  
if pin.linked\_album\_id is set:  
include the link only if gallery.albums.status = published  
otherwise: omit the link silently, show the pin normally

### 5.3 No reports table used here

Unlike Campus Mart, the Job Board, and Campus Gallery, this feature does not write into the shared public.reports table — there is no user-generated content on the map to report. If Phase 2 adds a "this pin looks wrong" correction path, that’s the point to start using it.

6\. Performance & Deployment
============================

*   Pins cluster client-side at low zoom levels so the map stays legible and performant regardless of pin count
*   Pin list cached in Redis, invalidated on any Admin write — same posture as the Directory
*   Deployment checklist addition: restrict the public Mapbox access token to the Voice of UPSA domain(s) before going live (T3) — alongside the existing Cloudinary and Arcjet key setup from prior features