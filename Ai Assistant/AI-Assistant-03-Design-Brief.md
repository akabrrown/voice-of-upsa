**DESIGN BRIEF**  
**AI Assistant**  
Visual direction, components, and key screens — Phase 1  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0  
**Palette:** Reuses the existing Voice of UPSA / Campus Mart palette — no new colours introduced

Table of Contents
=================

1\. Design Principles
=====================

*   Answers are checkable — every substantive answer shows the real listings it drew from, as links, so a student can verify rather than trust
*   Honest about limits — "I don’t have information about that" is a first-class, well-designed state, not an error screen
*   Does not pretend to be a person — clearly labelled as an assistant; no invented name, avatar, or personality that suggests otherwise
*   Crisis handling looks like the rest of the platform’s crisis handling — the same calm, teal support message Confessions uses, so it reads as one consistent, trustworthy behaviour rather than a different tone per feature
*   No AI-generic tells — no sparkle icons on every button, no gradient-glow chat bubbles, no "thinking" animations designed to look impressive; same anti-AI-generic rules as the rest of the portfolio (Campus Mart Design Brief §5)

2\. Visual Direction
====================

No new palette or typography. The assistant is a utility, styled the way the Notification Centre is: chrome, not a feature with its own identity.

*   Campus Teal (#1F7A6C) — the assistant’s own message accent, source-link chips, and the crisis support message
*   Ink Navy (#1B2A4A) — the student’s own messages, headers
*   Market Amber (#C97C1C) — the "temporarily unavailable" and rate-limit states, reusing its existing in-progress/warning meaning

3\. Components
==============

| **Component** | **Purpose** | **Key states** |
| --- | --- | --- |
| Chat Widget Launcher | Persistent, unobtrusive entry point on every page | Default; never auto-opens or pops up unprompted |
| Message Bubble | A single turn in the conversation | Student, assistant, streaming (text appears progressively), declined ("I don’t have information about that") |
| Source Chips | Links to the listings an answer drew from, shown beneath the answer | Each chip carries the source type (product, service, job…) so a student knows what they’re about to open |
| Support Resource Card | Shown in place of a normal answer when the crisis check triggers | Calm teal, direct tap-through to the Counseling Service listing; no chat input prompt immediately below it pressuring a reply |
| Seller Copy Panel | Inside the Campus Mart product form | Structured input fields → draft output → editable before saving; a visible note that the draft only uses the facts the seller entered |
| Unavailable State | When both models are down or the daily ceiling is reached | Plain, calm message — not an error code, not a spinner that never resolves |

4\. Key Screens (Phase 1)
=========================

| **Screen** | **Priority** | **Notes** |
| --- | --- | --- |
| Chat widget (overlay, every page) | P0 | Bottom-sheet on mobile, floating panel on desktop |
| Seller copy panel (inside /mart/seller/products/new and /edit) | P0 | Not a standalone route — lives in the existing product form |