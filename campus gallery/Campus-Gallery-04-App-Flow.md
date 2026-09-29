**APP FLOW**  
**Campus Gallery**  
User journeys, screen flow, and URL structure — Phase 1  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0

Table of Contents
=================

1\. Visitor / Student Journey (viewing)
=======================================

**→** Opens /gallery — no login required to browse  
**→** Filters by category or opens a featured album  
**→** Views photos in a grid → taps into the lightbox for a full-screen view  
**❖** Reports a photo if needed — including the fast-tracked consent-based reason

2\. Student Journey (submitting)
================================

**→** Opens an album marked open for submissions → "Submit a photo"  
**❖** Uploads a photo, adds an optional caption, confirms the consent statement — cannot submit without checking it  
**→** Submission enters Pending Review — visible in My Submissions  
**→** Admin approves → photo appears in the public album; or rejects → submitter sees the reason  
**→** Submitter can withdraw a still-pending submission at any time before it’s reviewed

3\. Admin Journey
=================

**→** Creates or edits an album — sets category, event date, and whether it’s open for submissions  
**→** Uploads official photos directly — published immediately  
**→** Works the moderation queue — approve/reject submitted photos  
**❖** Resolves reports — consent-related reports surfaced with priority  
**→** Removes a photo or album if needed — soft delete, traceable via the shared audit log

4\. Platform Cross-Feature Notes
================================

Continuing the living section from Wave 1 — first update since the Job Board closed it out.

4.1 Shared, unchanged
---------------------

*   Auth, profiles, Admin shell, design system, Arcjet setup, Cloudinary pipeline — all reused as-is
*   public.audit\_logs — Gallery is the third feature to write into it directly

4.2 Promoted this cycle
-----------------------

*   public.reports — a new shared table replacing the pattern of each feature inventing its own (Campus Mart’s reports, the Job Board’s job\_reports). Gallery is the first to use the shared version; migrating the two existing tables in is a tracked Phase 2 cleanup, not a blocker for any feature shipped so far (TDD §5.3)

4.3 New platform-wide convention
--------------------------------

*   EXIF/location metadata stripping on upload is now a standing rule, not a Gallery-specific choice — any future feature accepting photo or video uploads (Campus Video/TV in Wave 3, potentially Campus Map pins) should apply the same Cloudinary upload-preset setting rather than deciding it fresh

4.4 Still not shared (carried forward)
--------------------------------------

*   Notification centre — unchanged since the Job Board’s note; still recommended as the first Phase 2 infrastructure item across the whole roadmap

4.5 Anticipated future links
----------------------------

*   Campus Map (next in Wave 2) may eventually let an album be pinned to a location — no schema decision needed now

5\. URL Structure (Phase 1)
===========================

| **Path** | **Purpose** |
| --- | --- |
| /gallery | Gallery home — category filter, featured albums |
| /gallery/\[slug\] | Album view — photo grid |
| /gallery/\[slug\]/submit | Submit a photo (only when open for submissions) |
| /gallery/mine | Student’s own submissions and their status |
| /admin/gallery/albums | Admin album list |
| /admin/gallery/albums/new | Create album |
| /admin/gallery/moderation | Photo moderation queue |
| /admin/gallery/reports | Reports on published photos |