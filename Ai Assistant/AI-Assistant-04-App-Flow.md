**APP FLOW**  
**AI Assistant**  
User journeys, screen flow, and integration points — Phase 1  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0

Table of Contents
=================

1\. Student Journey (asking)
============================

**→** Opens the chat widget from any page — no login required for basic search  
**→** Types a question in plain language  
**❖** Server checks the message for crisis language first — before any model is called  
**→** Not crisis-flagged → the assistant searches the platform’s public content and answers, with source links beneath  
**→** Nothing relevant found → a plain "I don’t have information about that," not a guess  
**→** Crisis-flagged → the Counseling Service resource card appears instead of a normal answer, and the assistant doesn’t continue a counseling-style conversation  
**→** Taps a source chip → lands on the real listing in the relevant feature

2\. Seller Journey (copy helper)
================================

**→** Verified seller opens the Campus Mart product form  
**→** Enters the product’s real facts — name, condition, key features, price  
**→** Uses the copy panel → receives a draft description and short caption built only from those facts  
**❖** Reviews and edits the draft, then saves as part of the product — nothing auto-publishes, and the normal Campus Mart product moderation still applies afterward

3\. Log Reviewer Journey (rare)
===============================

**→** A specific abuse or cost concern reaches someone holding the can\_review\_assistant\_logs flag  
**❖** They open the log view — refused without a written reason  
**→** Access is recorded in the shared audit log regardless of what they find

4\. Platform Cross-Feature Notes
================================

The final entry in the living section — and, unlike the others, mostly a summary: this feature reads from everything else, so its integration points are the roadmap itself.

4.1 What the assistant reads from
---------------------------------

| **Feature** | **Indexed as** | **Notes** |
| --- | --- | --- |
| Campus Mart | product | Approved products only; the seller copy helper also lives inside this feature’s product form |
| Student Services Directory | service | Active listings; also the source of the live Counseling Service link used by the crisis path |
| Job/Internship Board | posting | Approved, unexpired postings only |
| Campus Polls | poll | Published polls; questions and results, never individual votes |
| Podcasts | podcast\_episode | Published episodes |
| Campus Video/TV | video | Published videos |
| UPSA Campus Map | map\_pin | Active pins |
| Campus Gallery | not indexed in Phase 1 | Photos carry consent and identifiability concerns better handled deliberately than swept in by default; revisit as its own decision |
| Anonymous Confessions/Opinions | never indexed | Explicit, permanent-by-default exclusion (PRD §2) |

4.2 New shared-platform additions
---------------------------------

*   public.profiles.can\_review\_assistant\_logs — the second sensitive, out-of-band-granted flag on the shared profiles table, following the pattern Confessions set with can\_unmask\_anonymous\_posts
*   A unified retrieval index (assistant.content\_index) that every in-scope feature keeps current by calling reindexContent() when its content is published or changed — the same "one funnel" shape as the Notification Centre’s notify()

4.3 Follow-up integration work
------------------------------

*   Each in-scope feature needs a one-line reindexContent() call added to its existing publish/update/unpublish actions — wiring, not a redesign, the same kind of follow-up the Notification Centre required

4.4 Roadmap status
------------------

With this feature documented, every item on the original list is covered: Job/Internship Board, Campus Polls, Student Services Directory, UPSA Campus Map, Campus Video & Voice of UPSA TV, Podcasts, AI assistant, Campus Gallery, and Anonymous Confessions/Opinions — alongside Campus Mart itself and the Notification Centre added along the way as shared infrastructure.

5\. Entry Points (Phase 1)
==========================

| **Location** | **Purpose** |
| --- | --- |
| Chat widget (every page) | General assistant, all in-scope content |
| Campus Mart seller product form | Seller copy helper |