**PRODUCT REQUIREMENTS DOCUMENT**  
**Campus Polls**  
Official student polling feature for voiceofupsa.com  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0 — Phase 1 (MVP) scope  
**Sequence:** Wave 1, item 1 of 3 (Polls → Directory → Job Board)  
**Related docs:** TDD · Design Brief · App Flow · Backend Schema

Table of Contents
=================

1\. Overview
============

Campus Polls gives Voice of UPSA an editorial-controlled way to run quick, trustworthy polls for the UPSA student body — an academic policy question, a campus-life opinion check, an event turnout gauge — with one-vote-per-student integrity and live results.  
This is the first and simplest of the Wave 1 features. It intentionally does not let students create their own polls in Phase 1 — that is a meaningfully different trust and moderation problem, tracked as a Phase 2 option (Section 6).

2\. Goals
=========

1.  Let Voice of UPSA editorial staff (Admin) publish a poll in under a minute.
2.  Guarantee one vote per student per poll, enforced server-side, not just in the UI.
3.  Show results as they come in, without ever letting a client fake or inflate a count.
4.  Keep voter identity out of any publicly reachable query — votes are anonymous to other students and to the public storefront-style results view.
5.  Reuse the auth, design system, and infrastructure already established by Campus Mart rather than introducing anything new.

3\. User Roles
==============

| **Role** | **Capabilities** |
| --- | --- |
| Visitor | View poll listing and results (subject to the poll’s results-visibility setting); cannot vote |
| User (any signed-in student) | Vote once per poll; view results per the poll’s visibility setting |
| Admin | Create, edit (pre-vote only), publish, close, and soft-delete polls; view full results and turnout at any time |

4\. Phase 1 Feature Scope
=========================

4.1 Admin
---------

*   Create a poll: question, 2–6 options, category (Academics, Campus Life, Events, Sports, Opinion), optional expiry date/time
*   Set results visibility: Always visible, After voting, or After close
*   Publish poll (goes live immediately, or scheduled — scheduling is a nice-to-have, not a blocker for v1)
*   Manually close a poll before its expiry if needed
*   View live results and total turnout at any time regardless of the visibility setting shown to students
*   Soft-delete a poll (removes from public listing, preserves vote history)

4.2 Student (User)
------------------

*   Browse active polls, filtered by category
*   View a poll and cast one vote (single-select in Phase 1)
*   See results per the poll’s visibility rule — never before casting a vote if the rule is “After voting”
*   See a clear “You voted” state on a poll already voted on — no re-voting or vote-changing in Phase 1

4.3 Visitor
-----------

*   View poll listing and any poll whose results are set to Always visible
*   Prompted to sign in to vote

5\. Non-Functional Requirements
===============================

| **Area** | **Requirement** |
| --- | --- |
| Integrity | A vote can only ever be counted once per (poll, student); result counts are derived server-side and never accepted from the client |
| Anonymity | Voter identity is never exposed through any publicly reachable query or API response — only aggregate counts |
| Performance | Result bars render from a pre-aggregated count column, not a live COUNT(\*) over votes, so a popular poll doesn’t slow down under load |
| Abuse resistance | Vote submission is rate-limited per user/IP to blunt scripted mass-voting |
| Mobile | Voting and viewing results are one-tap flows on a phone — this is the feature most likely to be used in a hallway between classes |

6\. Out of Scope for Phase 1
============================

**Phase 2** Student-submitted polls (with moderation queue), multi-select polls, comments on a poll, changing/retracting a vote, scheduled auto-publish  
**Phase 2** Push/email notification on new poll (reuse Campus Mart’s notification pattern once a shared notification centre exists — see App Flow §3)  
**Later** Poll results feeding into AI assistant summaries, or cross-linking into Anonymous Confessions/Opinions threads

7\. Success Metrics
===================

*   Turnout: votes per poll relative to active student accounts
*   Integrity: zero confirmed instances of double-voting or client-side count manipulation
*   Editorial adoption: polls published per week by the Voice of UPSA team