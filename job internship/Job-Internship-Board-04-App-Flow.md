**APP FLOW**  
**Job/Internship Board**  
User journeys, screen flow, and URL structure — Phase 1  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0

Table of Contents
=================

1\. Student / Visitor Journey
=============================

**→** Opens /jobs — no login required to browse  
**→** Filters by type, field, location, or deadline  
**→** Opens a posting → reads description, requirements, compensation info  
**❖** Uses the Apply block — external link, email, or instructions — handled entirely outside the platform  
**→** Can report a posting that looks fraudulent from the detail page

2\. Poster Journey
==================

**→** Signed-in user opens "Post an Opportunity" → fills the submission form → submits  
**❖** Posting enters Pending Review — poster sees a clear pending banner on My Postings  
**→** Admin approves → posting goes live on the board  
**→** Poster edits the live posting → it automatically returns to Pending Review before the change is visible to students  
**→** Poster closes the posting early once filled, or lets it expire at the stated deadline

3\. Admin Journey
=================

**→** Opens Admin → Job Board moderation queue  
**→** Reviews a submitted or re-submitted posting → Approve / Reject (with a required note) / Request changes  
**→** Reviews reports filed against live postings → investigates → closes or removes if warranted  
**→** Manages categories/fields as needed  
**❖** Every decision writes to the shared platform audit log automatically

4\. Platform Cross-Feature Notes
================================

Closing out Wave 1 — continuing the living section from Campus Polls and the Student Services Directory.

4.1 Shared across all four features
-----------------------------------

*   Auth, profiles, Admin shell, design system, Arcjet setup — unchanged
*   public.audit\_logs — the Job Board is the second feature (after the Directory) to write into the shared table directly, no new audit infrastructure
*   Moderation-queue UI pattern reused conceptually from Campus Mart’s product review flow — approve/reject/request-changes with a required note on rejection

4.2 Cross-link with the Student Services Directory
--------------------------------------------------

*   The Directory’s Careers & Internships listing can carry a static link to /jobs in Phase 1 — a live "current openings from this service" feed is a Phase 2 enhancement once both features have enough volume to make it worthwhile

4.3 Notification centre — now the clear trigger to build it
-----------------------------------------------------------

This has been carried forward as "not yet shared" since Campus Polls. The Job Board is the first feature where it stops being optional: posters need to know when their submission is approved or rejected, and students would benefit from a "new posting in your field" alert. Recommend this becomes the first Phase 2 item across the whole Wave 1 set, built once as a shared, platform-level notification service rather than a fourth one-off.

5\. URL Structure (Phase 1)
===========================

| **Path** | **Purpose** |
| --- | --- |
| /jobs | Board home — filters, featured, newest |
| /jobs/\[slug\] | Posting detail |
| /jobs/new | Submit a posting |
| /jobs/mine | Poster’s own postings and their status |
| /jobs/\[slug\]/edit | Edit own posting (resets to pending\_review) |
| /admin/jobs | Moderation queue |
| /admin/jobs/reports | Reports on live postings |
| /admin/jobs/categories | Category management |