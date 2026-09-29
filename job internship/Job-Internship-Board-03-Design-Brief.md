**DESIGN BRIEF**  
**Job/Internship Board**  
Visual direction, components, and key screens — Phase 1  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0  
**Palette:** Reuses the existing Voice of UPSA / Campus Mart palette — no new colours introduced

Table of Contents
=================

1\. Design Principles
=====================

*   Scannable in a list, not a scroll — students filtering by type/field/deadline need to compare postings quickly, so density matters more than showcase styling here
*   Deadline urgency is a visual signal, not just text — a posting closing soon should be easy to spot at a glance
*   Trust markers visible before the click — pending/rejected states are never shown to the public, so every card a visitor sees has already cleared review; no separate "verified" badge is needed the way Campus Mart needs one for sellers
*   No AI-generic tells — same anti-AI-generic rules as the rest of the portfolio (Campus Mart Design Brief §5)

2\. Visual Direction
====================

No new palette or typography. One reused semantic convention, consistent with Campus Mart and Campus Polls:

*   Campus Teal (#1F7A6C) — type tag for Internship/Full-time, primary "Apply" action
*   Market Amber (#C97C1C) — "Closing soon" deadline indicator, reusing the same warning meaning as Campus Mart’s low-stock and the Directory’s staleness flag
*   Ink Navy (#1B2A4A) — headings, secondary type tags (Volunteer, Freelance/Gig)

3\. Components
==============

| **Component** | **Purpose** | **Key states** |
| --- | --- | --- |
| Posting Card | List item on the board home and filtered views | Default, featured (subtle highlight), closing-soon (amber deadline chip) |
| Filter Bar | Type / field / location / deadline filters above the list | Compact on mobile — collapses into a filter sheet rather than four dropdowns competing for width |
| Type Tag | Inline label on card and detail page | Full-time, Part-time, Internship, Volunteer, Freelance/Gig — each a consistent colour, not decorative variety |
| Apply Block | Detail page — how-to-apply instructions as a clear final action | External link (opens in new tab), email (mailto), or plain instructions text — rendered distinctly per type rather than one generic "Apply" button that may not fit |
| Poster Form | Submission and edit form | Draft/pending banner shown to the poster on their own postings so they always know current review status |

4\. Key Screens (Phase 1)
=========================

| **Screen** | **Priority** | **Notes** |
| --- | --- | --- |
| Board home (/jobs) | P0 | Filter bar, featured postings first, then newest |
| Posting detail (/jobs/\[slug\]) | P0 | Full description, requirements, apply block |
| Submit posting (/jobs/new) | P0 | Single form; clear "Pending Review" confirmation on submit |
| My Postings (/jobs/mine) | P0 | Status per posting (pending/approved/rejected/closed/expired), edit/close actions |
| Admin — moderation queue | P0 | Approve/reject with a required note on reject, consistent with Campus Mart’s product moderation UI |