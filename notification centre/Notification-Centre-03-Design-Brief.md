**DESIGN BRIEF**  
**Notification Centre**  
Visual direction, components, and key screens — Phase 1  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0  
**Palette:** Reuses the existing Voice of UPSA / Campus Mart palette — no new colours introduced

Table of Contents
=================

1\. Design Principles
=====================

*   One bell, every feature — a student should never have to remember which section of the site to check for an update; everything relevant funnels here
*   Never a dead end — every notification is tappable and goes somewhere specific; a notification that leads nowhere is worse than no notification
*   Quiet by default — this is a utility, not an engagement-driving feed; no celebratory animation on new notifications, no artificially inflated urgency
*   Graceful with the unknown — a notification type the UI has never seen still needs to look intentional, not broken (TDD §3, T3)

2\. Visual Direction
====================

No new palette or typography — the bell and panel are chrome, not a feature with its own identity.

*   Campus Teal (#1F7A6C) — unread indicator dot, unread count badge
*   Ink Navy (#1B2A4A) — read notification text, panel header
*   Muted grey — read notifications, timestamps

3\. Components
==============

| **Component** | **Purpose** | **Key states** |
| --- | --- | --- |
| Bell Icon | Header, present on every page | Default, unread (badge with count, capped display at "9+") |
| Notification Panel | Dropdown (desktop) / full-screen sheet (mobile) listing notifications | Empty state ("You’re all caught up"), loading, populated |
| Notification Row | One entry — icon per source feature, short text, timestamp | Unread (teal dot + slightly bolder text), read (default weight); unknown-type fallback renders plain text only, no broken icon |
| Preferences Panel | Per-category mute toggles | One row per feature/category that currently sends notifications; a feature with no notification types yet (Polls, Directory, Map) simply doesn’t appear here until it does |

4\. Key Screens (Phase 1)
=========================

| **Screen** | **Priority** | **Notes** |
| --- | --- | --- |
| Notification panel (header dropdown/sheet) | P0 | Available from every page, not a standalone route users navigate to directly |
| Notification preferences (/account/notifications) | P0 | Simple list of mute toggles |