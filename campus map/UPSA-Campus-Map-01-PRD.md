**PRODUCT REQUIREMENTS DOCUMENT**  
**UPSA Campus Map**  
Interactive campus map for voiceofupsa.com  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0 — Phase 1 (MVP) scope  
**Sequence:** Wave 2, item 2 of 3 (Gallery → Campus Map → Anonymous Confessions/Opinions)  
**Related docs:** TDD · Design Brief · App Flow · Backend Schema

Table of Contents
=================

1\. Overview
============

The Campus Map is an interactive, filterable map of UPSA — academic buildings, hostels, dining, health services, and other points of interest — so students (and new students especially) can find their way around visually instead of by word of mouth. It is entirely Admin-authored content in Phase 1: no student pin submissions, no user-generated content, no moderation queue.  
This is the lowest architectural-risk feature since Campus Polls — it’s a read-heavy map over Admin-managed data, with two deliberate cross-links back into features already shipped: a pin can point to a Student Services Directory listing, or to a Campus Gallery album, closing the forward references both of those docs flagged.

2\. Goals
=========

1.  Give students a fast, filterable, visual way to find a building, service, or landmark on campus.
2.  Connect the map to what’s already built — tapping a "Health & Wellness" pin can lead straight to that service’s Directory listing; a pin for an event space can link to its Gallery album.
3.  Keep this feature genuinely simple — no user submissions, no moderation, no new trust-and-safety surface. The risk here is data accuracy, not abuse.
4.  Use the map library already named in the standing tech stack (Mapbox GL JS / MapLibre GL) rather than evaluating a new one.

3\. User Roles
==============

| **Role** | **Capabilities** |
| --- | --- |
| Visitor / User | View and interact with the map: pan, zoom, filter by category, search, tap a pin for details — no login required |
| Admin | Create, edit, feature, deactivate, and remove map pins; manage pin categories |

4\. Phase 1 Feature Scope
=========================

4.1 Public (no login required)
------------------------------

*   Pan/zoom the map; pins cluster at low zoom levels so the map stays readable with many pins
*   Filter pins by category (Academic Buildings, Administrative, Hostels/Residence, Dining & Food, Health & Wellness, Sports & Recreation, Parking, Landmarks, Student Services, Other)
*   Search pins by name
*   Tap a pin → detail panel: name, category, description, optional photo
*   If the pin is linked to a Student Services Directory listing that is still active — a "View service details" link; if linked to a Campus Gallery album that is still published — a "View photos" link

4.2 Admin
---------

*   Create/edit a pin — name, category, coordinates (set via a map-click picker, not typed lat/long), description, optional photo, optional building code, optional link to a Directory service or a Gallery album
*   Feature a pin (e.g. highlight key orientation-week locations)
*   Deactivate a pin (hides from public map, keeps the record) or soft-delete it
*   Manage pin categories

5\. Non-Functional Requirements
===============================

| **Area** | **Requirement** |
| --- | --- |
| Accuracy | Every pin edit is traceable via the shared platform audit log — a wrong or malicious pin placement is never anonymous |
| Data integrity | A pin linked to a Directory service or Gallery album only shows that link while the linked resource is still active/published — a deactivated service or unpublished album never leaves a dangling link on the map |
| Performance | Pins cluster at low zoom and load progressively — the map stays smooth even as pin count grows; pin list is cached, since this data changes rarely |
| Availability | No login dependency for viewing — consistent with the Directory’s stance that finding your way around campus should never sit behind an auth wall |
| Mobile | Touch-friendly pan/zoom/tap; the pin detail view works as a bottom sheet on mobile rather than a desktop-style sidebar |

6\. Out of Scope for Phase 1
============================

**Phase 2** Turn-by-turn walking directions between two pins, user-submitted pins or corrections ("this pin is wrong" reporting), indoor/floor-level maps for multi-service buildings  
**Later** Live location sharing or "find my friend" style features — explicitly avoided given the privacy risk of real-time student location data on a platform that has otherwise been deliberately careful about location privacy (Campus Gallery’s EXIF-stripping standard)

7\. Success Metrics
===================

*   Coverage: number of active pins across all categories, with Academic Buildings and Student Services fully mapped as the priority set
*   Usage: map opens and pin taps per week, filtered vs. unfiltered
*   Cross-link value: click-through rate from a map pin to its linked Directory listing or Gallery album