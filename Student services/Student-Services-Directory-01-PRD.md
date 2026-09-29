**PRODUCT REQUIREMENTS DOCUMENT**  
**Student Services Directory**  
Campus service listings for voiceofupsa.com  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0 — Phase 1 (MVP) scope  
**Sequence:** Wave 1, item 2 of 3 (Polls → Directory → Job Board)  
**Related docs:** TDD · Design Brief · App Flow · Backend Schema

Table of Contents
=================

1\. Overview
============

The Student Services Directory is a searchable, categorized listing of support services available to UPSA students — counseling, health services, financial aid, academic advising, IT helpdesk, career services, security, hostel administration, and student clubs/societies. It answers the question every student eventually has: "where on campus do I go for this?"  
This is the second and simplest of the Wave 1 features — genuinely read-only for the public. There is no login required to browse, no voting, no transactions. The only write path in Phase 1 is Admin-managed listings.

2\. Goals
=========

1.  Give students one reliable place to find a campus service’s contact info, location, and hours, instead of word-of-mouth or outdated flyers.
2.  Make critical services (counseling, health, security) easy to find under stress — fast search, no login wall.
3.  Give Admin a simple way to keep listings accurate, with a visible "last verified" date so students can trust what they’re seeing.
4.  Keep category and cross-link conventions consistent with Campus Mart and Campus Polls so later features (Job Board, Campus Map) can connect to this directory without rework.

3\. User Roles
==============

| **Role** | **Capabilities** |
| --- | --- |
| Visitor / User | Browse, search, and filter services by category; view a service’s full listing — no account needed |
| Admin | Create, edit, verify, deactivate, and soft-delete listings; manage categories |

No distinct "User" capability beyond Visitor in Phase 1 — the directory is intentionally open, since the services most likely to be searched under stress (counseling, health, security) should never sit behind a login.

4\. Phase 1 Feature Scope
=========================

4.1 Public (no login required)
------------------------------

*   Browse all active services, grouped by category
*   Search by name, description, or keyword
*   Filter by category (Health & Wellness, Academic Support, Financial Aid, Careers & Internships, IT & Tech Support, Security & Safety, Housing & Hostel, Clubs & Societies, Administrative, Other)
*   View a service’s detail page: description, location, contact (phone, email, WhatsApp, website), operating hours, and a visible "last verified" date
*   Featured services (Admin-curated) surfaced at the top of the directory home

4.2 Admin
---------

*   Create/edit a service listing — all fields in Section 4.1, plus status (active/inactive)
*   Mark a listing "verified today" — refreshes last\_verified\_at without requiring a full edit
*   Feature/unfeature a listing
*   Deactivate a listing (hides from public directory, keeps the record) or soft-delete it
*   Manage categories — create, reorder, deactivate

5\. Non-Functional Requirements
===============================

| **Area** | **Requirement** |
| --- | --- |
| Accuracy & trust | Every listing shows when it was last verified; Admin changes to any listing are traceable (Section 6) |
| Availability | No login dependency for reading — a student in a stressful moment (e.g. looking for counseling) should never hit an auth wall |
| Performance | Directory listing and category pages are heavily cacheable — this data changes rarely |
| Mobile | Search and service detail are one-handed, fast-loading flows |
| Privacy | Only information the service itself has agreed to publish is shown — no internal-only contact details |

6\. Trust & Accuracy Design
===========================

Because this directory will be relied on for time-sensitive, sometimes stressful needs, accuracy carries more weight than novelty here. Two lightweight mechanisms cover Phase 1 without adding real complexity:

*   last\_verified\_at is shown publicly on every listing — a student can see at a glance whether the phone number they’re about to call was checked recently
*   Every Admin change to a listing is written to the platform’s shared audit log (promoted from Campus Mart’s mart-scoped table — see App Flow §3) so a wrong or malicious edit (e.g. tampering with the counseling hotline number) is always traceable to an actor and a timestamp

7\. Out of Scope for Phase 1
============================

**Phase 2** Service-owner accounts (letting a department edit its own listing directly, with Admin approval), student ratings/reviews of a service, saved/bookmarked services for signed-in users  
**Phase 2** Scheduled "please re-verify" reminders to Admin for listings not touched in N months  
**Later** Map pin per service, once UPSA Campus Map (Wave 2) exists; cross-links from Job/Internship Board postings to the relevant Careers & Internships listing

8\. Success Metrics
===================

*   Coverage: number of active, verified-within-90-days listings across all categories
*   Usage: searches and detail-page views per week, with Health & Wellness / Security & Safety tracked separately given their stakes
*   Trust: zero confirmed incidents of stale or incorrect critical contact information going unnoticed for more than a reporting cycle