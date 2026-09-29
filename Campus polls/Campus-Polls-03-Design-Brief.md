**DESIGN BRIEF**  
**Campus Polls**  
Visual direction, components, and key screens — Phase 1  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0  
**Palette:** Reuses the Campus Mart palette — no new colours introduced for this feature

Table of Contents
=================

1\. Design Principles
=====================

*   One clear action per screen — a poll is a single question; the UI should never feel busier than that
*   Result bars are the reward for voting — the transition from ballot to bars should feel immediate and satisfying, not like a page reload
*   No AI-generic tells — same anti-AI-generic rules as the rest of the portfolio (Campus Mart Design Brief §5), reused verbatim here

2\. Visual Direction
====================

No new palette or typography for this feature — Campus Polls sits inside the same Voice of UPSA + Campus Mart visual system. The only addition is a semantic use of the existing accent colours:

*   Campus Teal (#1F7A6C) — the leading option’s result bar, and the "You voted" confirmation state
*   Market Amber (#C97C1C) — reused here for "Closing soon" / expiry countdown, not for results — keeps the deals-vs-status meaning consistent with Campus Mart
*   Ink Navy (#1B2A4A) — non-leading option bars, kept low-contrast so the leading option reads clearly at a glance

3\. Components
==============

| **Component** | **Purpose** | **Key states** |
| --- | --- | --- |
| Poll Card | Grid item on the poll listing page | Active (with category tag), closing-soon (amber countdown), closed (result bars shown, muted) |
| Ballot | Single-select option list on the poll detail page before voting | Default, submitting (brief loading state on the button, not the whole page), error (e.g. already voted, poll closed) |
| Result Bar Group | Animated horizontal bars showing % per option after a vote or on a closed/always-visible poll | Leading option in teal, others in muted navy; total vote count shown beneath |
| Visibility Badge | Small label on a poll card indicating when results become visible | Always visible / Results after you vote / Results after close |

4\. Key Screens (Phase 1)
=========================

| **Screen** | **Priority** | **Notes** |
| --- | --- | --- |
| Poll listing (/polls) | P0 | Filter by category; active polls first, then closed |
| Poll detail (/polls/\[slug\]) | P0 | Ballot or result bars depending on vote/visibility state |
| Admin — create/edit poll | P0 | Simple form: question, 2–6 options, category, expiry, visibility rule |
| Admin — poll list | P0 | Turnout at a glance per poll; close/delete actions |