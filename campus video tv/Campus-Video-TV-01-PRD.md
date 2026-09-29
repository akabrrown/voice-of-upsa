**PRODUCT REQUIREMENTS DOCUMENT**  
**Campus Video & Voice of UPSA TV**  
On-demand video for voiceofupsa.com  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0 — Phase 1 (MVP) scope  
**Sequence:** Wave 3, item 2 of 3 (Podcasts → Campus Video/TV → AI assistant)  
**Related docs:** TDD · Design Brief · App Flow · Backend Schema

Table of Contents
=================

1\. Overview
============

Campus Video & Voice of UPSA TV is a home for on-demand video — event recordings, interviews, campus vlogs and mini-documentaries, with "Voice of UPSA TV" as the flagship show for the platform’s own produced content. It reuses almost everything Podcasts just established: the show/episode model, the Cloudinary media pipeline, the per-show public feed pattern, and the Admin-only trust posture. Podcasts was built first specifically so this feature could reuse that pattern rather than solving the same problems twice.  
The one meaningful new risk this feature introduces that Podcasts didn’t: video, unlike audio, almost always shows identifiable people. Section 6 addresses that directly.

2\. Goals
=========

1.  Give Voice of UPSA a home for on-demand video content, organized the same way Podcasts organizes audio — shows containing episodes.
2.  Reuse the Cloudinary pipeline and per-show feed pattern from Podcasts rather than introducing new infrastructure.
3.  Design playback around real Ghanaian mobile data conditions — adaptive quality, not a single high-bitrate stream by default.
4.  Give anyone who appears in published footage without having consented a clear way to request its removal, even though there’s no submission pipeline to gate at upload time.
5.  Keep bandwidth and storage cost visible and bounded — video is far more expensive to host than audio, and this is the first feature where the platform’s free-tier-first infrastructure philosophy meets a real, near-term limit.

3\. User Roles
==============

| **Role** | **Capabilities** |
| --- | --- |
| Visitor / User | Browse shows and videos, watch on-demand — no login required |
| Admin (editorial) | Create/edit shows, upload and publish videos, add captions where available |

4\. Phase 1 Feature Scope
=========================

4.1 Public (no login required)
------------------------------

*   Browse shows, each with its own category, thumbnail, and description — "Voice of UPSA TV" marked as the flagship show
*   Browse a show’s videos, newest first
*   Watch on-demand, in-browser, with adaptive quality based on connection speed
*   Read the video description, and view captions where the Admin has provided them
*   Subscribe via a copyable RSS/video feed URL, same pattern as Podcasts
*   Report a video — including "I appear in this and didn’t consent to it being shown" (Section 6)

4.2 Admin
---------

*   Create/edit a show — title, description, thumbnail, category
*   Upload a video — file, title, description, optional caption file (.vtt)
*   Publish/unpublish; feature a show or video
*   Resolve reports filed against a published video, with consent-based reports prioritized
*   Deactivate a show or soft-delete a video

5\. Non-Functional Requirements
===============================

| **Area** | **Requirement** |
| --- | --- |
| Bandwidth-conscious playback | Video quality adapts to connection speed by default rather than always serving the highest bitrate — mobile data cost is a real constraint for UPSA students, consistent with this platform’s standing design principle for the Ghanaian market |
| Privacy | Location/GPS and device metadata is stripped from every uploaded video, the same platform-wide convention Campus Gallery established for photos |
| Cost visibility | Upload duration and file-size caps are enforced at the signature level, and Cloudinary video bandwidth/storage usage is monitored against the account’s free-tier limits with a documented upgrade trigger (Section 7 of the TDD) |
| Accessibility | A caption file is supported per video (optional in Phase 1, same posture as Podcasts’ optional transcript) |
| Recourse without a submission queue | Even though there’s no upload-time moderation gate (Admin-only publishing), a fast, clearly-labeled consent-based report path exists after publish (Section 6) |

6\. Consent & Privacy for People in Footage
===========================================

Campus Gallery treats consent as a submission-time gate, because students submit their own photos. Video has no submission pipeline in Phase 1 — only Admin publishes — so the same protection has to work differently here: it can’t be a checkbox at upload, because the person being filmed usually isn’t the one uploading.

*   Editorial due diligence at the point of filming/publishing (securing consent at an event, blurring or cutting footage of someone who objects) is an operational responsibility for whoever runs Voice of UPSA’s video production — outside what this document or the software can enforce
*   What the platform does provide: the same fast-tracked, priority-reviewed "didn’t consent" report path Campus Gallery uses for photos, giving anyone who appears in published footage a clear way to request removal after the fact
*   Location/GPS metadata is stripped unconditionally, same as every photo/video upload on the platform since Campus Gallery

7\. Out of Scope for Phase 1
============================

**Cut** Live streaming — explicitly out of scope; RTMP ingest, live transcoding, and live-chat moderation are a substantially larger infrastructure and trust-and-safety commitment than on-demand video, and nothing in "Voice of UPSA TV" requires it to launch  
**Phase 2** Auto-generated captions (a Gemini 1.5 Flash candidate, same as Podcasts’ auto-transcription idea), viewer comments/reactions, "follow this show" with Notification Centre integration for new-video alerts  
**Later** Student-submitted video — deliberately not added; it would reopen Campus Gallery’s entire consent-and-moderation problem at a scale (video, not stills) that deserves its own dedicated scoping pass rather than an afterthought here

8\. Success Metrics
===================

*   Reach: watch-throughs and completion rate per video
*   Cost health: monthly Cloudinary video bandwidth/storage against free-tier limits, tracked explicitly (Section 5)
*   Trust: consent-related report volume and resolution time, tracked the same way Campus Gallery tracks its own