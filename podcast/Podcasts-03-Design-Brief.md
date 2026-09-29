**DESIGN BRIEF**  
**Podcasts**  
Visual direction, components, and key screens — Phase 1  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0  
**Palette:** Reuses the existing Voice of UPSA / Campus Mart palette — no new colours introduced

Table of Contents
=================

1\. Design Principles
=====================

*   The player is the interface — everything else on an episode page (show notes, transcript) supports the act of listening, it doesn’t compete with it
*   Looks like a real podcast, not a file list — cover art, episode numbering, and show identity matter; this should feel recognizable to anyone who already uses Spotify or Apple Podcasts
*   Scrubbing must feel responsive — the one interaction this feature absolutely cannot afford to get wrong is seeking within an episode
*   No AI-generic tells — same anti-AI-generic rules as the rest of the portfolio (Campus Mart Design Brief §5)

2\. Visual Direction
====================

No new palette or typography. Cover art carries most of the visual identity per show, the same way it does on any podcast platform — the UI chrome stays deliberately quiet around it.

*   Campus Teal (#1F7A6C) — play button, progress bar fill, "Listen on…" link accents
*   Ink Navy (#1B2A4A) — titles, episode metadata
*   Cover art — square format, consistent with podcast directory conventions (Apple Podcasts and Spotify both expect roughly square artwork), not a wide banner like Campus Gallery’s albums

3\. Components
==============

| **Component** | **Purpose** | **Key states** |
| --- | --- | --- |
| Show Card | Grid item on the podcasts home | Default, featured (subtle highlight) |
| Episode Row | List item within a show page | Default, currently-playing (progress indicator inline), played (subtle checkmark/dim, client-side only — no server-tracked listen history in Phase 1) |
| Audio Player | Embedded on the episode page | Playing, paused, loading/buffering; scrub bar with visible current time / duration |
| Subscribe Block | "Listen on Spotify" / "Listen on Apple Podcasts" / copy RSS URL | Recognizable platform badges, simply styled — not styled to mimic those platforms’ own branding beyond standard badge usage |
| Transcript Panel | Expandable text block below the player, when present | Collapsed by default on mobile to keep the player above the fold |

4\. Key Screens (Phase 1)
=========================

| **Screen** | **Priority** | **Notes** |
| --- | --- | --- |
| Podcasts home (/podcasts) | P0 | Show grid, category filter |
| Show page (/podcasts/\[show-slug\]) | P0 | Cover art, description, episode list, subscribe block |
| Episode page (/podcasts/\[show-slug\]/\[episode-slug\]) | P0 | Player, show notes, transcript if present |
| Admin — show list & editor | P0 | Create/edit show metadata including iTunes fields |
| Admin — episode upload | P0 | Audio upload, metadata, optional transcript, publish toggle |