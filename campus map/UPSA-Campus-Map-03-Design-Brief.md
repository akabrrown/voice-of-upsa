**DESIGN BRIEF**  
**UPSA Campus Map**  
Visual direction, components, and key screens — Phase 1  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0  
**Palette:** Reuses the existing Voice of UPSA / Campus Mart palette, applied to a custom map style

Table of Contents
=================

1\. Design Principles
=====================

*   Orientation over decoration — someone new to campus should be able to find a building faster than asking a stranger; that’s the entire bar
*   Category is a shape, not just a colour — pin icons differ by category so the map is scannable even for a student who can’t distinguish two similar colours at a glance
*   One tap to cross-link — a pin’s connection to a Directory listing or Gallery album should never require more than a single tap from the detail panel
*   No AI-generic tells — no default Mapbox "streets" styling left unstyled, no gradient-blob markers

2\. Visual Direction
====================

The map itself gets a custom style rather than a stock Mapbox theme, so it reads as part of Voice of UPSA rather than an embedded third-party widget:

*   Base map — a light, low-saturation custom style (muted greys/greens for terrain and roads) so pins are what draws the eye, not the basemap
*   Campus Teal (#1F7A6C) — default pin colour for most categories, cluster bubbles
*   Market Amber (#C97C1C) — Featured pin highlight
*   Ink Navy (#1B2A4A) — selected/active pin state, detail panel header
*   Each category gets a distinct icon (building, bed, utensils, cross/plus for health, ball for sports, parking symbol, landmark/star, information icon for services) — not colour-only differentiation, consistent with the platform’s accessibility stance from Campus Mart’s Design Brief

3\. Components
==============

| **Component** | **Purpose** | **Key states** |
| --- | --- | --- |
| Map Pin | Per-category marker on the map | Default, selected (enlarged + navy), featured (amber ring) |
| Cluster Bubble | Groups nearby pins at low zoom | Shows a count; expands to individual pins on tap/zoom-in |
| Category Filter Bar | Toggleable category chips overlaying the map | Multi-select; unselected categories’ pins hidden, not just dimmed, to reduce visual noise |
| Search Overlay | Text search over pin names | Autocomplete-style results list, tapping a result pans/zooms to that pin |
| Pin Detail Panel | Shows on tap — bottom sheet on mobile, side panel on desktop | Includes cross-link buttons ("View service details" / "View photos") only when the linked resource is still active (TDD §5.2) |

4\. Key Screens (Phase 1)
=========================

| **Screen** | **Priority** | **Notes** |
| --- | --- | --- |
| Map view (/map) | P0 | Full-screen map with filter bar, search, and cluster behavior |
| Pin deep link (/map/pin/\[slug\]) | P0 | Opens the map already centered on and showing that pin’s detail panel — the URL a Directory listing or Gallery album cross-links to |
| Admin — pin list | P0 | Table view with category and status, faster to scan than a mini-map |
| Admin — create/edit pin | P0 | Map-click coordinate picker embedded in the form, not typed lat/long fields |