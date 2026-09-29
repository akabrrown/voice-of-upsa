**PRODUCT REQUIREMENTS DOCUMENT**  
**Job/Internship Board**  
Opportunity listings for voiceofupsa.com  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0 — Phase 1 (MVP) scope  
**Sequence:** Wave 1, item 3 of 3 (Polls → Directory → Job Board) — closes out Wave 1  
**Related docs:** TDD · Design Brief · App Flow · Backend Schema

Table of Contents
=================

1\. Overview
============

The Job/Internship Board lets employers, campus organizations, and students post job, internship, and gig opportunities for the UPSA community, and lets students browse and apply. Every posting is moderated before it goes public — this is the one Wave 1 feature carrying real scam risk (fake job postings are a well-known pattern targeting students), so trust design gets the same weight it got in Campus Mart’s product moderation.  
Phase 1 deliberately stops at listing + moderation. There is no in-app application or applicant-tracking system — "how to apply" is a link, email, or instruction the poster provides, and the student hands off to it. This keeps the platform from ever holding applicant PII in Phase 1.

2\. Goals
=========

1.  Let any signed-in student, organization, or verified employer submit a posting in a few minutes.
2.  Never publish a posting without Admin review — every listing is moderated before it’s visible, same discipline as Campus Mart product moderation.
3.  Give students fast, filterable browsing (type, field, location, deadline) that works well on a phone.
4.  Keep postings honest over time — an approved listing that gets edited must be re-reviewed before the edit goes live, closing the most common bait-and-switch pattern.
5.  Reuse the shared audit log, Admin moderation pattern, and category conventions already established by Campus Mart and the Student Services Directory.

3\. User Roles
==============

| **Role** | **Capabilities** |
| --- | --- |
| Visitor | Browse and search approved, active postings — no login required to browse |
| User (poster, contextual — not a persistent role) | Signed-in user submits a posting; can edit or close their own postings; any edit to an approved posting returns it to Pending Review |
| Admin | Approve, reject, feature, close, or remove any posting; manage categories |

Posting is an action, not an account type — consistent with the two-role model used everywhere else in the portfolio. There is no separate "employer account."

4\. Phase 1 Feature Scope
=========================

4.1 Visitor / Student
---------------------

*   Browse and search postings by keyword
*   Filter by type (Full-time, Part-time, Internship, Volunteer, Freelance/Gig), field/category, location (On Campus, Accra, Remote, Other), and deadline
*   View a posting’s full detail: description, requirements, compensation info, deadline, and how to apply
*   Report a posting that looks fraudulent or inappropriate

4.2 Poster (any signed-in user)
-------------------------------

*   Submit a posting — title, organization name, type, field, location, description, requirements, compensation info, application deadline, how-to-apply details
*   New submissions enter Pending Review; only Admin-approved postings are publicly visible
*   Edit their own posting — any edit to an already-approved posting resets it to Pending Review (Section 6)
*   Close their own posting early (e.g. position filled before the deadline)

4.3 Admin
---------

*   Moderation queue — approve, reject (with a required reason), or request changes on a submitted posting
*   Feature a posting on the board home
*   Close or remove any posting
*   Manage categories/fields
*   Review reports filed against a posting

5\. Non-Functional Requirements
===============================

| **Area** | **Requirement** |
| --- | --- |
| Trust & safety | No posting reaches the public board without Admin approval; an edited approved posting is re-queued for review before the change goes live |
| Privacy | No applicant data is collected or stored in Phase 1 — "how to apply" hands off to an external channel the poster controls, so the platform never becomes a target for applicant PII exposure |
| Performance | Cursor-based pagination and filterable search; listing page cached with a short TTL given postings churn faster than Directory listings |
| Abuse resistance | Posting submission and reporting are rate-limited to blunt spam and scripted abuse |
| Mobile | Browsing, filtering, and viewing a posting are fast one-handed flows |

6\. Trust & Safety Design
=========================

Fake job postings are a documented scam pattern against students (fake "easy money" listings, advance-fee requests, phishing for personal or banking details in a fabricated application form). Phase 1 leans on three deliberately simple controls rather than a heavier verification system:

*   Mandatory pre-publish moderation — nothing goes live without an Admin decision, no auto-publish path exists
*   Re-review on edit — an approved posting that changes (new "how to apply" instructions, new compensation terms, etc.) goes back to Pending Review before students see the change, closing the bait-and-switch gap
*   Reporting — students can flag a live posting; Admin reviews it the same way Campus Mart reviews a reported product or seller

_Deliberately out of scope for Phase 1: verifying an employer’s legal identity, requiring a business registration number, or any automated scam-pattern detection — these are Phase 2 hardening steps once real posting volume shows what patterns actually need catching._

7\. Out of Scope for Phase 1
============================

**Phase 2** In-app application/applicant tracking, employer verification badges, saved searches and "new posting in your field" notifications, scheduled/renewal reminders before a posting expires  
**Later** Dynamic cross-linking from a Student Services Directory listing (e.g. Career Services) to live postings in a related field — Phase 1 ships a static link only (App Flow §3)

8\. Success Metrics
===================

*   Volume: approved postings live at any given time, by type and field
*   Trust: reject rate at moderation and report rate post-publish, tracked to catch a rising scam pattern early
*   Turnaround: median time from submission to Admin decision