**APP FLOW**  
**Campus Video & Voice of UPSA TV**  
User journeys, screen flow, and URL structure — Phase 1  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0

Table of Contents
=================

1\. Visitor / Student Journey
=============================

**→** Opens /video — no login required  
**→** Sees "Voice of UPSA TV" featured, browses other shows by category  
**→** Opens a show → browses its videos  
**❖** Plays a video — quality adapts to connection automatically  
**→** Reports a video if needed — including "I appear in this and didn’t consent"

2\. Admin Journey
=================

**→** Creates a show — title, description, thumbnail, category (or uses the existing "Voice of UPSA TV" flagship show)  
**→** Uploads a video — sees duration/size limits upfront before starting the upload  
**→** Adds a caption file if available  
**→** Publishes — video appears in-browser and in the show’s feed simultaneously, same single-source-of-truth pattern as Podcasts  
**❖** Resolves reports — consent-based reports reviewed with priority

3\. Platform Cross-Feature Notes
================================

Continuing the living section from Podcasts.

3.1 Shared, unchanged
---------------------

*   Auth, profiles, Admin shell, design system, Arcjet setup — reused as-is
*   public.audit\_logs — the seventh feature to write into it
*   The per-show public feed pattern (Route Handler, XML) — identical shape to Podcasts, extended with a video enclosure
*   Cloudinary’s EXIF/location-stripping preset, reused unchanged from Campus Gallery

3.2 Diverges from Podcasts here
-------------------------------

*   public.reports IS used by this feature (unlike Podcasts and the Map) — video reintroduces the appears-without-consent risk Campus Gallery identified, even without a submission pipeline (PRD §6)
*   Cost management is a first-class concern here in a way it wasn’t for audio — upload caps and a documented Cloudinary free-tier upgrade trigger (TDD §6)

3.3 Still not shared
--------------------

*   Notification Centre — same reasoning as Podcasts; no "follow a show" feature exists yet to attach a "new video" alert to

3.4 Deliberately not built
--------------------------

*   Live streaming and student-submitted video — both explicitly out of scope (PRD §7), not deferred silently

4\. URL Structure (Phase 1)
===========================

| **Path** | **Purpose** |
| --- | --- |
| /video | Video home — flagship show featured, category filter |
| /video/\[show-slug\] | Show page — video grid |
| /video/\[show-slug\]/\[video-slug\] | Video page — player, description, captions |
| /video/\[show-slug\]/feed.xml | Public video feed for the show |
| /admin/video/shows | Admin show list |
| /admin/video/videos/new | Upload video |
| /admin/video/reports | Reports, consent-based reasons prioritized |