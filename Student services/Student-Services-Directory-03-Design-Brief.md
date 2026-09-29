**DESIGN BRIEF**  
**Student Services Directory**  
Visual direction, components, and key screens — Phase 1  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0  
**Palette:** Reuses the Campus Mart / Campus Polls palette — no new colours introduced

Table of Contents
=================

1\. Design Principles
=====================

*   Findable in seconds, not browsed at leisure — this is the feature most likely to be used while a student is stressed or in a hurry; search and category filters must be immediate, above the fold
*   Trust over decoration — the "last verified" date is a first-class visual element, not a footnote
*   Calm, not cheerful, for sensitive categories — Health & Wellness and Security & Safety listings should read as clear and reassuring, not styled identically to a "Clubs & Societies" card
*   No AI-generic tells — same anti-AI-generic rules as the rest of the portfolio (Campus Mart Design Brief §5)

2\. Visual Direction
====================

No new palette or typography — the directory sits inside the same Voice of UPSA + Campus Mart + Campus Polls visual system. One additional semantic convention:

*   Campus Teal (#1F7A6C) — "Verified recently" indicator, category tags
*   Market Amber (#C97C1C) — reserved for a "Not verified in a while" staleness flag, reusing its existing warning meaning from Campus Mart’s low-stock alerts
*   Ink Navy (#1B2A4A) — headings, category icons

_Sensitive categories (Health & Wellness, Security & Safety) use the same components as every other category — deliberately not a separate "urgent" visual treatment, which would risk looking alarming rather than reassuring. Calm consistency is the design choice._

3\. Components
==============

| **Component** | **Purpose** | **Key states** |
| --- | --- | --- |
| Service Card | Grid/list item on the directory home and category pages | Default, featured (subtle highlight, not a loud badge) |
| Category Chip Row | Horizontal scrollable filter row at the top of the directory | Selected (teal fill), unselected (outline) |
| Verification Tag | Small inline label on a card and the detail page | "Verified \[date\]" in teal; "Not verified since \[date\]" in amber if past a staleness threshold |
| Contact Block | Detail page — phone, email, WhatsApp, website as tappable actions | Each action is a real tap target sized for mobile, not inline text links |
| Hours Table | Detail page — structured open/close per day | Today’s row visually emphasized; "Closed today" state handled explicitly, not left blank |

4\. Key Screens (Phase 1)
=========================

| **Screen** | **Priority** | **Notes** |
| --- | --- | --- |
| Directory home (/services) | P0 | Search bar, category chips, featured services first |
| Category listing (/services/category/\[slug\]) | P0 | Same card grid, pre-filtered |
| Service detail (/services/\[slug\]) | P0 | Contact block, hours, description, verification tag |
| Admin — service list | P0 | Status and last-verified date visible per row for quick scanning |
| Admin — create/edit service | P0 | All fields from PRD §4.1; "Verify today" as a separate one-tap action from the full edit form |