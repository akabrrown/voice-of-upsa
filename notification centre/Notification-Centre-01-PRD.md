**PRODUCT REQUIREMENTS DOCUMENT**  
**Notification Centre**  
Shared platform notifications for voiceofupsa.com  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0 — Phase 1 (MVP) scope  
**Sequence:** Platform infrastructure — recommended after Wave 1 (Job Board), reinforced after Wave 2 (Gallery, Confessions)  
**Related docs:** TDD · Design Brief · App Flow · Backend Schema

Table of Contents
=================

1\. Overview
============

Every feature built so far has, at some point, wanted to tell a student something happened to their content — a job posting approved, a photo rejected, a confession under review. Three features (the Job Board, Campus Gallery, and Anonymous Confessions/Opinions) explicitly flagged this gap in their own App Flow docs rather than each building a one-off. This feature closes that gap once, as shared platform infrastructure, and retires Campus Mart’s original feature-scoped notifications table into it.  
This is infrastructure, not a new user-facing surface in its own right — the win is entirely in not having a fourth, fifth, and sixth feature each reinvent "tell the user what happened."

2\. Goals
=========

1.  Give every feature one shared, simple way to notify a student about something that happened to their own content or account.
2.  Let a student see, in one place, everything relevant to them across Campus Mart, the Job Board, Campus Gallery, Anonymous Confessions/Opinions, and any future feature — without each having its own separate inbox.
3.  Never let one feature’s notification shape or bug break the shared list — an unrecognized notification type degrades gracefully, it doesn’t crash the panel.
4.  Retire Campus Mart’s original mart-scoped notifications table into this shared one, rather than running two systems side by side.
5.  Design the data model so email/SMS delivery (already named in the standing stack — Resend, Africa’s Talking) can be added later without a redesign, even though Phase 1 ships in-app only.

3\. User Roles
==============

| **Role** | **Capabilities** |
| --- | --- |
| User | Sees their own notifications; marks read/unread; mutes notifications per feature/category |
| Admin | No special access in Phase 1 — notifications are triggered by feature events, not sent manually (Section 7) |
| Feature code (internal) | Any feature’s server action can trigger a notification through a single shared function — never by writing to the table directly (TDD §1) |

4\. Phase 1 Feature Scope
=========================

4.1 Student
-----------

*   A bell icon with an unread count, visible platform-wide in the header
*   A notification list/panel: newest first, each item routes to the relevant page in whichever feature it came from (their own job posting, their own gallery submission, their own confession status, their own Campus Mart order)
*   Mark a single notification read (by opening it) or mark all read
*   Per-category mute — a student can turn off notifications from, say, Campus Polls without losing Job Board or Campus Mart notifications
*   New notifications appear live (no manual refresh needed) while the student has the site open

4.2 Notification types shipped at launch
----------------------------------------

| **Feature** | **Events** |
| --- | --- |
| Campus Mart | Order status changed, product approved/rejected, low stock (seller) — migrated from its existing mart-scoped table (Section 7) |
| Job/Internship Board | Posting approved, posting rejected |
| Campus Gallery | Submitted photo approved, submitted photo rejected |
| Anonymous Confessions/Opinions | Post approved, post rejected — payload deliberately minimal (decision and reason only), consistent with that feature’s anonymity guarantees |

_Campus Polls, the Student Services Directory, and the Campus Map have no Phase 1 notification needs of their own and are not wired in yet — the point of this feature is that they can be, later, without any change to this system._

5\. Non-Functional Requirements
===============================

| **Area** | **Requirement** |
| --- | --- |
| Extensibility | A new feature can add a new notification type by calling the shared trigger function with a new type string — no schema migration, no enum update, required to add one |
| Robustness | The notification panel never fails to render because of an unrecognized or malformed notification type — falls back to a generic display rather than erroring |
| Privacy | A notification never contains more information than the recipient could already see themselves — in particular, a Confessions notification never includes anything that could help correlate the post’s timing or content back to the author beyond what the author already knows |
| Performance | Unread-count lookups are cheap and frequent (checked on nearly every page load) — solved with a well-indexed query, not a cache layer (Section 6 of the TDD explains why) |
| Isolation | Ownership is enforced server-side — a student can never read or mark-read another student’s notifications |

6\. Migration Note — Campus Mart
================================

Campus Mart’s original Backend Schema defined its own mart.notifications table, written before this shared system existed. This is the third time a per-feature table has been promoted to a shared platform one, after public.audit\_logs (promoted at the Student Services Directory) and public.reports (promoted at Campus Gallery). Migrating Campus Mart’s existing rows and call sites into public.notifications is a one-time cleanup task (Backend Schema §4), not a redesign of Campus Mart itself.

7\. Out of Scope for Phase 1
============================

**Phase 2** Email and SMS delivery (Resend, Africa’s Talking) — the data model is built to add these without a redesign, but no delivery channel beyond in-app ships in Phase 1  
**Phase 2** Admin-triggered manual/broadcast announcements (e.g. a platform-wide maintenance notice) — Phase 1 notifications are always triggered by a specific event on a specific piece of the recipient’s own content  
**Phase 2** Notification digests/summaries (e.g. "3 new reactions on your post" collapsed into one entry) — Phase 1 events are all low-frequency enough per user that this isn’t needed yet

8\. Success Metrics
===================

*   Adoption: proportion of eligible events (approvals/rejections across Job Board, Gallery, Confessions, Mart) that result in a delivered notification
*   Engagement: notification open rate and time-to-read
*   Reliability: zero incidents of the shared panel breaking due to a new or malformed notification type