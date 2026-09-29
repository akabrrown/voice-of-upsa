**APP FLOW**  
**UPSA Campus Map**  
User journeys, screen flow, and URL structure — Phase 1  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0

Table of Contents
=================

1\. Visitor / Student Journey
=============================

**→** Opens /map — no login required  
**❖** Pans/zooms, or filters by category, or searches by name  
**→** Taps a pin → detail panel opens with name, description, optional photo  
**→** If the pin links to a Directory service or Gallery album still live → taps through directly  
**→** Arrives at the map already centered on a specific pin when following a cross-link from the Directory or Gallery (deep link)

2\. Admin Journey
=================

**→** Opens Admin → Map → creates or edits a pin  
**→** Sets the pin’s location by clicking the map, not typing coordinates  
**❖** Optionally links the pin to a Directory service or a Gallery album  
**→** Publishes — pin is immediately live (no moderation step, since this is Admin-authored content only)  
**→** Deactivates or removes a pin as campus changes (a service relocates, a building is renamed)  
**→** Every create/edit/deactivate action writes to the shared platform audit log automatically

3\. Platform Cross-Feature Notes
================================

Continuing the living section — this is the first feature to actually consume the forward references the Directory and Gallery docs flagged.

3.1 Shared, unchanged
---------------------

*   Auth, profiles, Admin shell, design system, Arcjet setup — reused as-is
*   public.audit\_logs — the Map is the fourth feature to write into it directly
*   Cloudinary’s EXIF/location-stripping preset, reused for optional pin photos

3.2 Cross-links activated
-------------------------

*   A pin can link to a Student Services Directory listing (via service\_id) — the exact connection the Directory’s App Flow anticipated when it kept location\_label structured rather than free-text
*   A pin can link to a Campus Gallery album (via album\_id) — the connection Gallery’s App Flow anticipated
*   Both links are live-checked against the linked resource’s current status, not just stored once and trusted (TDD §5.2)

3.3 Deliberately not shared
---------------------------

*   public.reports — this feature has no user-generated content, so it doesn’t participate in the reports table Gallery introduced; a Phase 2 "report a wrong pin" feature would be the point to start

3.4 Still not shared (carried forward)
--------------------------------------

*   Notification centre — unchanged; the Map has no notification needs of its own either

4\. URL Structure (Phase 1)
===========================

| **Path** | **Purpose** |
| --- | --- |
| /map | Full map view — filters, search, clustering |
| /map/pin/\[slug\] | Deep link — opens the map centered on and showing one pin’s detail |
| /admin/map/pins | Admin pin list |
| /admin/map/pins/new | Create pin, with map-click coordinate picker |
| /admin/map/pins/\[id\]/edit | Edit pin |
| /admin/map/categories | Category management |