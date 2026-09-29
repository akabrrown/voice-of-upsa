**APP FLOW**  
**Anonymous Confessions/Opinions**  
User journeys, screen flow, and URL structure — Phase 1  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0

Table of Contents
=================

1\. Student Journey (posting)
=============================

**→** Signed-in student opens Compose → sees the acknowledgment interstitial ("not fully anonymous, don’t identify others")  
**→** Writes a post (≤500 characters), picks type and category, submits  
**❖** Server runs content screening synchronously  
**→** Clears → published immediately, visible in the public feed  
**→** Flagged → held as Pending Review; student sees "under review" on My Posts, not silence  
**→** If flagged for self-harm language specifically → student immediately sees the support-resource message with a direct link to the Counseling Service’s Directory listing, regardless of the pending decision

2\. Student Journey (reading & reacting)
========================================

**→** Opens /confessions — filters by type/category, browses newest-first  
**→** Reacts to a post — one reaction per post  
**❖** Reports a post if needed — selects a reason; self-harm/threat reasons immediately pull the post from public view pending review

3\. Admin Journey (moderation)
==============================

**→** Opens Admin → Confessions moderation queue — priority-flagged items (self-harm, threat) shown first, visually separated  
**→** Approves or rejects a held post, with a required note on rejection  
**→** Resolves reports — same priority separation  
**→** Removes a published post if warranted — soft state change, traceable via the shared audit log

4\. Trust & Safety Journey (rare)
=================================

**→** A credible escalation (e.g. a specific, serious threat requiring identification) reaches someone holding the can\_unmask\_anonymous\_posts flag  
**❖** That person opens the specific post and invokes Unmask — the action is refused outright without a written reason  
**→** Author identity is revealed only to them, and only after the audit log write succeeds — there is no "quiet" path to this information

5\. Platform Cross-Feature Notes
================================

Closing out Wave 2 — continuing the living section from Campus Gallery and the Campus Map.

5.1 Shared, unchanged
---------------------

*   Auth, profiles, Admin shell, design system, Arcjet setup — reused as-is
*   public.audit\_logs — the fifth feature to write into it, and the first to use it for something as sensitive as an unmask action
*   public.reports — the second feature (after Gallery) to use the shared reports table, and the first to give specific reasons the power to auto-change a resource’s visibility state

5.2 Concrete cross-link activated
---------------------------------

*   The crisis support message pulls live from the Student Services Directory’s Counseling/Health & Wellness listing — the same forward-looking design choice that let the Campus Map link to Directory listings now pays off here too

5.3 New precedent set this cycle
--------------------------------

*   First feature to add a column to a shared platform table (public.profiles.can\_unmask\_anonymous\_posts) rather than only referencing one — future features needing a similarly rare, sensitive permission should follow this same out-of-band-grant, audit-on-use pattern rather than inventing a new one

5.4 Notification centre — carried forward, now urgent
-----------------------------------------------------

Unchanged status since the Job Board, but this is the third feature (after Job Board and, less urgently, Gallery) that would clearly benefit from "your post was approved/rejected" — the recommendation to build this as the first Phase 2 platform item, made after Wave 1, stands even more firmly now that Wave 2 is also closing without it.

6\. URL Structure (Phase 1)
===========================

| **Path** | **Purpose** |
| --- | --- |
| /confessions | Public feed — filters, newest-first |
| /confessions/new | Compose — acknowledgment interstitial, then the post form |
| /confessions/mine | Student’s own posts and their status |
| /admin/confessions | Moderation queue, priority-separated |
| /admin/confessions/reports | Reports, priority-separated |