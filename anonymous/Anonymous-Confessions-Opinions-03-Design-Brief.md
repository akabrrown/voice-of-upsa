**DESIGN BRIEF**  
**Anonymous Confessions/Opinions**  
Visual direction, components, and key screens — Phase 1  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0  
**Palette:** Reuses the existing Voice of UPSA / Campus Mart palette — deliberately not a distinct "edgy" visual identity (Section 1)

Table of Contents
=================

1\. Design Principles
=====================

*   Calm, not a meme wall — the visual tone should read as a normal, moderated part of Voice of UPSA, not a separate gossip-app skin; a louder, more playful treatment would work against the trust-and-safety posture the whole feature depends on
*   The acknowledgment is a real interstitial, not a checkbox buried at the bottom — a student should not be able to submit without visibly seeing what "anonymous" does and doesn’t mean here
*   No score to "lose" — reactions are supportive/reflective (Relate, Support, Funny), never an upvote/downvote pair that turns a vulnerable post into something with a visible negative score
*   Support resources look supportive, not alarming — the crisis-flag message uses the platform’s calm teal, not a jarring red banner, consistent with how the Student Services Directory treats sensitive categories
*   No AI-generic tells — same anti-AI-generic rules as the rest of the portfolio (Campus Mart Design Brief §5)

2\. Visual Direction
====================

No new palette. If anything, this feature should feel slightly more restrained than Campus Mart or the Gallery — fewer accent colours in view at once, more whitespace, quieter typography.

*   Ink Navy (#1B2A4A) — headings, post text
*   Campus Teal (#1F7A6C) — reaction buttons, the support-resource message, "published" status
*   Market Amber (#C97C1C) — "Pending review" status, the \[DECISION\]-style emphasis pattern carried over from this document suite itself is not user-facing, but the same amber-for-in-progress convention is
*   A muted, non-alarming red, used only for "Removed" status and the identify-a-person report action — present but not shouting

3\. Components
==============

| **Component** | **Purpose** | **Key states** |
| --- | --- | --- |
| Post Card | Feed item | Default; own-post variants (pending amber, rejected muted-red-with-reason) visible only to the author on My Posts |
| Acknowledgment Interstitial | Shown before first submission each session, or always above the compose box | Must be actively dismissed/confirmed — never pre-checked, never skippable |
| Reaction Row | Relate / Support / Funny buttons under a post | Selected state per user; counts shown but de-emphasized relative to the post text itself |
| Support Resource Banner | Shown immediately on a self-harm-flagged submission | Calm teal, plain language, a direct tap-through to the Counseling Service Directory listing’s contact info |
| Report Sheet | Reason picker on a post | "Identifies a specific person" and "Self-harm/crisis" visually equal-weighted with other reasons — not hidden at the bottom of the list |

4\. Key Screens (Phase 1)
=========================

| **Screen** | **Priority** | **Notes** |
| --- | --- | --- |
| Feed (/confessions) | P0 | Type/category filters, newest-first, no algorithmic ranking in Phase 1 |
| Compose (/confessions/new) | P0 | Acknowledgment interstitial → short text box → type/category → submit |
| My Posts (/confessions/mine) | P0 | Status per post; the only place a submitter sees their own post’s review state |
| Admin — moderation queue | P0 | Priority-flagged (self-harm/threat) items visually separated at the top, not just sorted by date |
| Admin — reports | P0 | Same priority separation as the moderation queue |