**TECHNICAL DESIGN DOCUMENT**  
**Podcasts**  
Architecture, security, and API design — Phase 1  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0  
**Repo structure:** Feature module inside the existing Voice of UPSA repo; reuses Cloudinary and the shared audit log; introduces the platform’s first public XML response (Section 4)

Table of Contents
=================

1\. Architecture Overview
=========================

Low trust-and-safety risk (Admin-only content, same posture as the Campus Map), but real technical risk in a different place: media delivery correctness and RSS standards compliance. Most of this TDD’s weight is there rather than in a threat model.

| **Layer** | **Choice** | **Notes** |
| --- | --- | --- |
| Frontend | Next.js (App Router) + TypeScript + Tailwind + shadcn/ui | Same design system as every prior feature |
| Audio player | Native HTML5 <audio> element, custom-styled controls | No third-party player library needed for Phase 1’s simple per-episode playback (PRD §7 defers a persistent mini-player) |
| Data fetching | TanStack Query | Show and episode listing caching |
| Backend | Next.js Server Actions + Route Handlers + Supabase (Postgres, Auth) | Route Handler used specifically for the RSS feed endpoint, since it must return XML, not JSON (Section 4) |
| Validation | Zod | Shared client/server schema for show/episode metadata |
| Media | Cloudinary (signed uploads, video resource type) | Cloudinary handles audio files through its video pipeline; delivers via CDN with byte-range support, satisfying the seek/scrub requirement without custom streaming infrastructure |
| Caching | Upstash Redis | Show and episode listings cached; RSS feed responses cached briefly too, since directories poll on a schedule rather than continuously |
| Abuse protection | Arcjet | Rate limiting on the RSS feed endpoint and public listing endpoints, as a baseline against scripted scraping load |
| Audit | Shared public.audit\_logs | Every show/episode publish, unpublish, and edit writes here |
| Deployment | Vercel | Same project as the rest of Voice of UPSA |

2\. Roles & Permission Matrix
=============================

| **Resource** | **Visitor / User** | **Admin** |
| --- | --- | --- |
| Shows/episodes (read, published) | Yes — no login required | Yes, plus draft |
| RSS feed (read) | Yes — public, unauthenticated by design | n/a |
| Shows/episodes (create/edit/publish) | No | Yes |

3\. Threat Model
================

A narrow surface, similar in shape to the Campus Map’s — Admin-only content, no user submissions.

| **#** | **Threat** | **Mitigation** |
| --- | --- | --- |
| T1 | Compromised Admin account publishes inappropriate audio content | Every publish/unpublish/edit is recorded in the shared, append-only audit log — same control used for Directory listings and Map pins |
| T2 | Show notes field used to inject a script (stored XSS) via an Admin-entered rich-text field | Show notes are sanitized server-side before storage and again at render — no raw HTML execution path, even though the field accepts basic formatting |
| T3 | RSS feed or public listing endpoints scraped at high, abusive volume | Arcjet rate limiting as a baseline; distinct from information-disclosure risk, since this content is meant to be public and machine-readable by design — the same stance taken for the Directory |
| T4 | Oversized or abusive audio uploads run up Cloudinary storage/bandwidth cost | A maximum file size enforced at the upload-signature level, same pattern as Campus Gallery’s image cap; Admin-only upload access already limits this to a trusted, small set of accounts |
| T5 | A malformed or incorrect RSS feed silently fails validation at a podcast directory | Not a security threat, but treated with equal engineering seriousness — the feed generator is tested against the iTunes namespace requirements before each show’s directory submission (PRD §6) |

4\. API Surface (Phase 1)
=========================

| **Action** | **Input** | **Notes** |
| --- | --- | --- |
| getShows | category, cursor | Public; only status = active |
| getShow | slug | Public; includes RSS feed URL and external-app links |
| getEpisodes | show\_id, cursor | Public; only status = published |
| getEpisode | slug | Public; includes audio\_url and transcript if present |
| getShowFeedXML (Route Handler) | show\_slug | Public, unauthenticated; returns application/rss+xml, not JSON — the platform’s first non-JSON public response |
| createShow / updateShow (Admin) | show fields | Writes audit log |
| createEpisode / updateEpisode (Admin) | episode fields incl. audio upload | Writes audit log |
| publishEpisode / unpublishEpisode (Admin) | episode\_id | Writes audit log |
| deleteShow / deleteEpisode (Admin) | id | Soft delete only |

5\. Data Integrity
==================

### 5.1 Feed generation — single source of truth

GET /podcasts/\[show\_slug\]/feed.xml:  
SELECT published episodes for show\_slug, newest first  
render RSS 2.0 + itunes: namespace fields from that same data  
no separately stored or cached "feed document" to fall out of sync —  
the XML is a rendering of the current published set, not a copy of it

### 5.2 Soft delete

Shows and episodes are soft-deleted, consistent with every other feature’s pattern — an episode removed from the feed still exists internally for audit purposes.

### 5.3 No reports table used here

Same reasoning as the Campus Map: entirely Admin-authored content, nothing for a student to report in Phase 1.

6\. Performance Strategy
========================

*   Audio bytes are served directly from Cloudinary’s CDN, never proxied through the Next.js server — the application only ever hands out the CDN URL
*   Byte-range request support (inherent to Cloudinary’s delivery) enables seek/scrub without downloading the full file first
*   Show/episode listings and RSS responses are cached with a short TTL, invalidated on publish — directories and in-browser listeners both tolerate a small delay far better than a slow or uncached feed under repeated polling