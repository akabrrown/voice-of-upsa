**APP FLOW**  
**Student Services Directory**  
User journeys, screen flow, and URL structure — Phase 1  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0

Table of Contents
=================

1\. Student / Visitor Journey
=============================

**→** Opens /services directly, or arrives via search/a link — no login prompt at any point in this journey  
**❖** Searches by keyword or taps a category chip  
**→** Scans results — featured services surfaced first on the unfiltered home view  
**→** Opens a service’s detail page → sees description, hours, verification date, and contact block  
**→** Taps a contact action (call, email, WhatsApp, or website) — hands off to the device’s native app, Campus Mart is not involved

2\. Admin Journey
=================

**→** Opens Admin → Services  
**→** Creates a new listing, or opens an existing one to edit  
**❖** For a quick accuracy check with no content changes → uses "Verify today" instead of a full edit  
**→** Deactivates a listing that’s no longer offered, or soft-deletes one entered in error  
**→** Manages categories as needed — expected to be rare after initial setup  
**→** Every create/update/verify/deactivate action writes to the shared platform audit log automatically (Section 3)

3\. Platform Cross-Feature Notes
================================

Continuing the living section introduced in Campus Polls’ App Flow — updated here now that the Directory is shipping.

3.1 Shared with Campus Mart and Campus Polls
--------------------------------------------

*   Auth, profiles, Admin shell, design system, and Arcjet setup — unchanged, no new infrastructure
*   Cloudinary signed-upload pipeline, reused as-is for service logos/images

3.2 Promoted this cycle
-----------------------

*   audit\_logs is now a shared, platform-level table (public.audit\_logs) rather than scoped to the mart schema — the Directory writes into it directly, and Campus Mart’s existing audit entries should be migrated in rather than left behind in a schema-specific table (a one-time migration, not a rebuild)
*   This retires the "notification centre not yet platform-wide" note’s sibling concern for audit logging specifically — notifications themselves are still feature-scoped (see below)

3.3 Still not shared (carried forward)
--------------------------------------

*   Notification centre — still scoped to Campus Mart’s buyer/seller events; the Directory has no notification needs of its own in Phase 1, so this isn’t urgent, but Job/Internship Board (next) likely will want one

3.4 Anticipated future links
----------------------------

*   UPSA Campus Map (Wave 2) — each service listing is a natural map pin once the Map feature exists; no schema change needed now beyond keeping location\_label structured rather than free-text (Backend Schema §2)
*   Job/Internship Board (next in Wave 1) — a job posting from Career Services could link to this directory’s Careers & Internships listing; keeping category slugs stable now avoids a rename later

4\. URL Structure (Phase 1)
===========================

| **Path** | **Purpose** |
| --- | --- |
| /services | Directory home — search, category chips, featured |
| /services/category/\[slug\] | Category-filtered listing |
| /services/\[slug\] | Service detail |
| /admin/services | Admin service list |
| /admin/services/new | Create service |
| /admin/services/\[id\]/edit | Edit service |
| /admin/services/categories | Category management |