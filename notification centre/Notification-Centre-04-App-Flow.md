**APP FLOW**  
**Notification Centre**  
User journeys, screen flow, and URL structure — Phase 1  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0

Table of Contents
=================

1\. Student Journey
===================

**→** Something happens to their own content elsewhere on the platform — a Job Board posting is approved, a Gallery submission is rejected, a Confessions post clears review, a Campus Mart order status changes  
**❖** The relevant feature’s server action calls notify() — the student never sees this step, it just happens  
**→** If they have the site open, the bell badge updates immediately via Realtime; otherwise it’s waiting next time they visit  
**→** Opens the panel → sees the notification, taps it → lands directly on the relevant page (their posting, their submission, their post, their order)  
**→** Notification is marked read automatically on open, or via "mark all read"  
**→** Can visit /account/notifications at any time to mute a category they don’t want to hear from

2\. Feature-Integration Journey (for future features)
=====================================================

**→** A new feature that wants to notify a student calls notify(recipient\_id, type, payload) from its own server action  
**❖** Registers a Zod schema for its new type’s payload shape, and a small renderer (or accepts the generic fallback) for the panel  
**→** No changes to the Notification Centre’s own schema, RLS, or UI shell are required — this is the entire point of building it as shared infrastructure now

3\. Platform Cross-Feature Notes
================================

This entry in the living cross-feature section is different from the others — this feature exists specifically to resolve a note that has appeared in three prior App Flow docs, rather than adding a new open item.

3.1 Resolved this cycle
-----------------------

*   The "notification centre not yet platform-wide" note, carried since the Job Board’s App Flow and repeated by Campus Gallery and Anonymous Confessions/Opinions, is retired — all three now have a shared system to integrate with
*   Campus Mart’s original mart-scoped notifications table is migrated into public.notifications (Backend Schema §4) — the third table promoted to shared platform status, after audit\_logs and reports

3.2 Integration required (tracked as follow-up work, not blocking this feature’s own ship)
------------------------------------------------------------------------------------------

*   Job Board, Campus Gallery, and Confessions’ existing approve/reject actions need a one-line addition each to call notify() — the moderation logic itself doesn’t change
*   Campus Mart’s existing notification-sending call sites need to be repointed at the shared notify() function and its old table retired

3.3 Still open
--------------

*   Email/SMS delivery channels (Resend, Africa’s Talking) — the schema is ready (channel column), but no Phase 1 feature ships a non-in-app channel
*   Admin broadcast/announcement capability — deferred to Phase 2 (PRD §7)

4\. URL Structure (Phase 1)
===========================

| **Path** | **Purpose** |
| --- | --- |
| (header component) | Bell icon + panel — available on every page, not a standalone route |
| /account/notifications | Per-category mute preferences |