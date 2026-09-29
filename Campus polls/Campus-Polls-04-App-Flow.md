**APP FLOW**  
**Campus Polls**  
User journeys, screen flow, and URL structure — Phase 1  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0

Table of Contents
=================

1\. Student Journey
===================

**→** Opens /polls (nav entry alongside Campus Mart)  
**→** Browses active polls, optionally filtered by category  
**❖** Opens a poll → sees the ballot (if not yet voted and visibility rule allows voting first) or result bars (if already voted or visibility is Always)  
**→** Selects one option → submits  
**→** Server validates — poll still open, no prior vote — records the vote  
**→** Screen transitions to result bars with a "You voted" confirmation on their chosen option  
**→** Poll closes (manually or at expiry) → result bars become the permanent state, ballot no longer offered

2\. Admin Journey
=================

**→** Opens Admin → Polls  
**→** Creates a poll — question, options, category, expiry, visibility rule → publishes  
**→** Monitors turnout from the poll list — vote counts visible to Admin regardless of the student-facing visibility rule  
**→** Closes a poll early if needed, or lets it auto-close at expires\_at  
**→** Soft-deletes a poll if it needs to come down — vote history is preserved, not lost

3\. Platform Cross-Feature Notes
================================

Kept as a living section across every Wave 1+ feature’s App Flow doc, rather than a separate document, so it stays next to the journeys it affects. Updated as each feature ships.

3.1 Shared with Campus Mart
---------------------------

*   Auth, profiles, and the Admin shell are shared — Polls introduces no second login or account system
*   Design system (palette, shadcn/ui components) is shared — see Design Brief §2
*   Arcjet rate-limiting setup is shared infrastructure, configured per-endpoint

3.2 Not yet shared (tracked for Phase 2)
----------------------------------------

*   Notification centre — Campus Mart’s notifications table is scoped to buyer/seller events today; a "new poll" notification type would need it promoted to a platform-wide notification service before Polls (or any future feature) can safely plug into it
*   No current link between Polls and Campus Mart — e.g. a seller-run promotional poll is explicitly not in scope; polls remain Voice-of-UPSA-editorial-only in Phase 1

3.3 Anticipated future links
----------------------------

*   Job/Internship Board and Student Services Directory (next in Wave 1) are expected to reuse this same listing + category-filter pattern directly
*   Anonymous Confessions/Opinions (Wave 2) may eventually reference poll results as discussion prompts — no technical dependency required now, just a naming/category convention worth keeping consistent (Academics, Campus Life, Events, Sports, Opinion) so cross-linking is easy later

4\. URL Structure (Phase 1)
===========================

| **Path** | **Purpose** |
| --- | --- |
| /polls | Poll listing, filterable by category |
| /polls/\[slug\] | Poll detail — ballot or results depending on state |
| /admin/polls | Admin poll list with turnout |
| /admin/polls/new | Create poll |
| /admin/polls/\[id\]/edit | Edit poll (pre-vote fields only, per TDD T4) |