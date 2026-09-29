**DESIGN BRIEF**  
**Campus Gallery**  
Visual direction, components, and key screens — Phase 1  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0  
**Palette:** Reuses the existing Voice of UPSA / Campus Mart palette, with one intentional exception for the lightbox viewer (Section 2)

Table of Contents
=================

1\. Design Principles
=====================

*   The photo is the content — chrome, labels, and UI stay out of the way once someone opens the lightbox
*   Consent and moderation status are never decorative — a submitter always knows plainly whether their photo is pending, approved, or rejected
*   Community without chaos — submissions feel welcome, but the gallery never looks like an unmoderated feed
*   No AI-generic tells — same anti-AI-generic rules as the rest of the portfolio (Campus Mart Design Brief §5), including no gradient blobs or glassmorphism on photo cards

2\. Visual Direction
====================

No new palette for the browsing UI — album cards, chips, and forms reuse the existing Voice of UPSA / Campus Mart system exactly. One deliberate, functional exception:

*   Lightbox viewer background — near-black (#111417), not the usual light surface — a practical choice so photos read with correct contrast and colour, the same reason every photo-viewing product (not just AI-generated ones) does this; it is not a stylistic flourish and is scoped to the lightbox only
*   Campus Teal (#1F7A6C) — "Approved"/published status, primary submit action
*   Market Amber (#C97C1C) — "Pending review" status, reusing the same in-progress meaning as Campus Mart and the Job Board
*   A muted red (not the brand palette — reserved specifically) — "Rejected" status and the consent-report action, kept visually distinct from amber so a submitter never confuses "still reviewing" with "declined"

3\. Components
==============

| **Component** | **Purpose** | **Key states** |
| --- | --- | --- |
| Album Card | Grid item on the gallery home | Default, featured (subtle highlight), open-for-submissions (small camera icon/tag) |
| Photo Grid | Masonry/grid of approved photos within an album | Loading (skeleton, not a spinner per photo), empty (no photos yet) |
| Lightbox | Full-screen single-photo viewer with next/previous | Caption visible, close affordance always reachable, report action available |
| Submission Form | Upload flow for an open album | Includes the consent checkbox as a required, unskippable field — not pre-checked |
| My Submissions List | Student’s own submission history | Pending (amber), approved (teal), rejected (muted red, with the Admin note visible), withdrawn |
| Moderation Card | Admin review queue item | Photo preview, submitter, consent confirmation shown plainly, approve/reject with required reason on reject |

4\. Key Screens (Phase 1)
=========================

| **Screen** | **Priority** | **Notes** |
| --- | --- | --- |
| Gallery home (/gallery) | P0 | Category filter, featured albums first |
| Album view (/gallery/\[slug\]) | P0 | Photo grid → lightbox on tap |
| Submit to album (/gallery/\[slug\]/submit) | P0 | Only reachable when the album is open for submissions |
| My Submissions (/gallery/mine) | P0 | Status per submission, withdraw action while pending |
| Admin — album list & editor | P0 | Create/edit, submissions-open toggle, feature flag |
| Admin — moderation queue | P0 | Consistent with the Campus Mart / Job Board moderation pattern |