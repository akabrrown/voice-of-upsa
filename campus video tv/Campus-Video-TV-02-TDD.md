**TECHNICAL DESIGN DOCUMENT**  
**Campus Video & Voice of UPSA TV**  
Architecture, security, and API design — Phase 1  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0  
**Repo structure:** Feature module reusing Podcasts’ show/episode pattern, Cloudinary pipeline, and feed Route Handler almost exactly — differences called out explicitly below, not re-derived

Table of Contents
=================

1\. Architecture Overview
=========================

Structurally this is Podcasts with video instead of audio — same show/episode shape, same Admin-only trust posture, same per-show public feed. Three things differ enough to matter: native (not workaround) Cloudinary video handling, a real near-term cost ceiling, and the consent report path from Section 6 of the PRD.

| **Layer** | **Choice** | **Notes** |
| --- | --- | --- |
| Frontend | Next.js (App Router) + TypeScript + Tailwind + shadcn/ui | Same design system as every prior feature |
| Video player | Native HTML5 <video> element, custom-styled controls | No third-party player needed for Phase 1 |
| Data fetching | TanStack Query | Show and video listing caching |
| Backend | Next.js Server Actions + Route Handlers + Supabase (Postgres, Auth) | Same Route Handler pattern as Podcasts’ feed, extended with a video enclosure type |
| Validation | Zod | Shared client/server schema for show/video metadata |
| Media | Cloudinary (signed uploads, video resource type — native this time, not the audio workaround) | Adaptive-bitrate delivery and auto-generated thumbnails are native Cloudinary video features; the EXIF/location-stripping preset from Campus Gallery is reused unchanged |
| Caching | Upstash Redis | Show and video listings cached, same posture as Podcasts |
| Abuse protection | Arcjet | Rate limiting on public listing, feed, and report endpoints |
| Audit | Shared public.audit\_logs | Every show/video publish, unpublish, and report resolution writes here |
| Deployment | Vercel | Same project as the rest of Voice of UPSA |

2\. Roles & Permission Matrix
=============================

| **Resource** | **Visitor / User** | **Admin** |
| --- | --- | --- |
| Shows/videos (read, published) | Yes — no login required | Yes, plus draft |
| Video feed (read) | Yes — public, unauthenticated | n/a |
| Shows/videos (create/edit/publish) | No | Yes |
| Reports (create) | Yes | n/a |
| Reports (resolve) | No | Yes |

3\. Threat Model
================

Mostly identical in shape to Podcasts’ (T1, T2, T4, T5 below are the same controls, restated for video); the genuinely new item is T3.

| **#** | **Threat** | **Mitigation** |
| --- | --- | --- |
| T1 | Compromised Admin account publishes inappropriate video content | Every publish/unpublish is recorded in the shared audit log, same as Podcasts and every other Admin-authored feature |
| T2 | Video description used to inject a script (stored XSS) | Sanitized server-side before storage and render, same as Podcasts’ show notes |
| T3 | Published footage shows an identifiable person who did not consent to appear | No upload-time gate exists to catch this (Admin is the only publisher, not the subject) — mitigated entirely post-publish via the same fast-tracked consent report path Campus Gallery uses, reviewed with priority (PRD §6) |
| T4 | Location/device metadata embedded in a video file leaks where it was shot | Same Cloudinary metadata-stripping preset established as a platform-wide convention by Campus Gallery, applied unchanged to video uploads |
| T5 | Oversized or excessive video uploads run up Cloudinary storage/bandwidth cost well beyond what Podcasts’ audio ever would | A maximum duration and file size enforced at the upload-signature level; monthly bandwidth/storage tracked against the account’s free-tier limit with a documented upgrade trigger (Section 6) — the first feature on the roadmap where this cost conversation is load-bearing, not a footnote |
| T6 | Report-brigading used to get a legitimate video pulled | Reports reviewed by Admin before action, same stance as every other reports-table consumer on the platform |

4\. API Surface (Phase 1)
=========================

| **Action** | **Input** | **Notes** |
| --- | --- | --- |
| getShows | category, cursor | Public; only status = active |
| getShow | slug | Public; includes feed URL |
| getVideos | show\_id, cursor | Public; only status = published |
| getVideo | slug | Public; includes video\_url, thumbnail\_url, captions\_url if present |
| getShowFeedXML (Route Handler) | show\_slug | Same pattern as Podcasts, with a video enclosure type instead of audio |
| reportVideo | video\_id, reason (incl. no\_consent), details | Writes to public.reports; no\_consent flagged for priority review |
| createShow / updateShow (Admin) | show fields | Writes audit log |
| uploadVideo / updateVideo (Admin) | video fields incl. upload | Writes audit log |
| publishVideo / unpublishVideo (Admin) | video\_id | Writes audit log |
| resolveReport (Admin) | report\_id, resolution, note | Writes audit log |

5\. Data Integrity
==================

Feed rendering, soft delete, and the "no separate feed document" principle all carry over unchanged from Podcasts (its TDD §5.1–5.2) — restated here only where video differs.

### 5.1 Reports — used here, unlike Podcasts

This is the one place this feature diverges from Podcasts’ infrastructure choices: Podcasts and the Campus Map both opted out of public.reports because their content has no meaningful UGC-style risk. Video reintroduces the same appears-without-consent risk Campus Gallery identified, so this feature writes into public.reports with entity\_type = "campus\_video" and reuses the no\_consent priority-reason convention Gallery and Confessions both established.

6\. Cost Management (New for This Feature)
==========================================

*   Upload caps: a maximum duration (e.g. 20 minutes) and file size enforced when the upload signature is issued, not just checked after the fact
*   Monthly Cloudinary video bandwidth and storage tracked against the account’s free-tier allocation, consistent with the platform’s free-tier-first infrastructure philosophy
*   Documented upgrade trigger: if monthly video bandwidth approaches the free-tier ceiling, move to a paid Cloudinary tier or a dedicated video host (e.g. Mux, Bunny Stream) before service degrades — decided in advance rather than discovered during an outage

7\. Performance Strategy
========================

*   Adaptive bitrate delivery via Cloudinary, defaulting to a connection-appropriate quality rather than the highest available — directly serving the Ghanaian-mobile-data design constraint named in the standing engineering principles
*   Auto-generated thumbnails (a Cloudinary native video feature) avoid requiring Admin to manually create a poster image per upload
*   Show/video listings and feed responses cached, same posture as Podcasts