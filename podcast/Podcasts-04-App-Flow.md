**APP FLOW**  
**Podcasts**  
User journeys, screen flow, and URL structure — Phase 1  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0

Table of Contents
=================

1\. Visitor / Student Journey
=============================

**→** Opens /podcasts — no login required  
**→** Browses shows, or filters by category  
**→** Opens a show → browses its episode list  
**→** Opens an episode → plays in-browser, scrubs freely, reads show notes/transcript  
**❖** Subscribes via the copyable RSS URL, or taps through to Spotify/Apple Podcasts if the show has been submitted there

2\. Admin Journey
=================

**→** Creates a show — title, description, cover art, category, iTunes metadata  
**→** Uploads an episode — audio file, title, show notes, episode/season number  
**→** Optionally adds a transcript  
**❖** Publishes — episode appears in-browser and in the show’s RSS feed simultaneously, since both read the same published data (TDD §5.1)  
**→** Submits the show’s feed URL to Spotify for Podcasters / Apple Podcasts Connect — a one-time manual step per show, outside the platform itself

3\. Platform Cross-Feature Notes
================================

Continuing the living section — first update since the Notification Centre resolved the prior open item.

3.1 Shared, unchanged
---------------------

*   Auth, profiles, Admin shell, design system, Arcjet setup — reused as-is
*   public.audit\_logs — the sixth feature to write into it directly
*   Cloudinary — first use for audio rather than images; the EXIF/location-stripping convention established by Campus Gallery doesn’t apply to audio, but the signed-upload-with-size-cap pattern does

3.2 New pattern introduced this cycle
-------------------------------------

*   The platform’s first public XML response (the RSS feed), alongside every other feature’s JSON — a Route Handler rather than a Server Action, since podcast directories expect to fetch a feed URL directly, not call an app API

3.3 Deliberately not shared
---------------------------

*   public.reports — no user-generated content here, same reasoning as the Campus Map
*   Notification Centre — not integrated yet; there’s no "follow a show" feature in Phase 1 to attach a "new episode" notification to. Flagged as the natural Phase 2 pairing once that exists, rather than integrated prematurely

3.4 Anticipated future link
---------------------------

*   A Student Services Directory listing for a media/broadcasting-related student service could link out to /podcasts, the same static cross-link pattern already used for the Job Board

4\. URL Structure (Phase 1)
===========================

| **Path** | **Purpose** |
| --- | --- |
| /podcasts | Shows home — category filter |
| /podcasts/\[show-slug\] | Show page — episode list, subscribe block |
| /podcasts/\[show-slug\]/\[episode-slug\] | Episode page — player, notes, transcript |
| /podcasts/\[show-slug\]/feed.xml | Public RSS feed for the show |
| /admin/podcasts/shows | Admin show list |
| /admin/podcasts/shows/new | Create show |
| /admin/podcasts/episodes/new | Upload episode |