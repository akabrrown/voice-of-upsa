**DESIGN BRIEF**  
**Campus Mart**  
Visual direction, components, and key screens — Phase 1  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0  
**Palette status:** Proposal — no client brand assets supplied for this feature; pending review against the existing Voice of UPSA site palette

Table of Contents
=================

1\. Design Principles
=====================

*   Storefront-first, not catalogue-first — every seller should feel like they have their own small shop, not a row in a spreadsheet
*   Trust is visible, not buried — verification badges, ratings, and order counts sit next to the seller’s name everywhere, not only on their profile page
*   Mobile is the primary surface — the five critical flows (search, product detail, cart, checkout, order tracking) are designed for a one-handed phone session first, desktop second
*   No AI-generic tells — this feature follows the same anti-AI-generic rules used across the Codey Dev portfolio (see Section 5)

2\. Visual Direction (Proposal)
===============================

Voice of UPSA is a campus media brand first, marketplace second — Campus Mart should read as a section of that platform, not a bolted-on separate product. This palette extends rather than replaces whatever Voice of UPSA already uses; confirm against the live site before implementation.

2.1 Colour
----------

■ **Ink Navy — primary, headers, nav** #1B2A4A  
■ **Campus Teal — accent, verified badges, primary actions** #1F7A6C  
■ **Market Amber — secondary accent, deals/discount tags, warnings** #C97C1C  
■ **Body text** #222831  
■ **Secondary text / metadata** #5B6572  
■ **Surface / card background** #F4F6F8  
_Deliberately not the default AI-assistant blue-and-purple gradient pairing — navy + teal reads as “campus institution,” amber gives a market/deal accent without tipping into e-commerce-template orange-on-white._

2.2 Typography
--------------

| **Role** | **Typeface** | **Notes** |
| --- | --- | --- |
| Headings | Match existing Voice of UPSA heading font | Confirm current site font before finalizing — do not introduce a second heading typeface for one section of the site |
| Body / UI | Inter or existing site body font | Whichever Voice of UPSA already ships avoids a second font-loading cost |
| Explicitly avoided | Space Grotesk + Instrument Serif pairing | Flagged portfolio-wide as an overused AI-generated-site default |

3\. Components
==============

Built on shadcn/ui primitives already in the stack — extended, not replaced, so Campus Mart doesn’t introduce a second component library into the codebase.

| **Component** | **Purpose** | **Key states** |
| --- | --- | --- |
| Product Card | Grid item across homepage, category, search, store pages | Default, out-of-stock (dimmed + badge), discounted (price strike-through + amber tag) |
| Seller Badge | Inline verification indicator next to any seller name | Pending (not shown), Verified (teal check), Trusted Seller (filled teal) |
| Store Header | Banner + logo + name + badge + rating + follow/chat actions | Owner-preview mode (seller viewing own store) shows an “Edit Store” affordance instead of Follow |
| Order Status Tracker | Horizontal stepper on order detail / buyer dashboard | In-progress step filled teal, future steps outlined, cancelled/disputed shown as a red interrupt on the track rather than continuing the happy path |
| Delivery Location Picker | Checkout step | Structured select (zone → sub-location) rather than a free-text field, to keep delivery data queryable later for Phase 3 delivery zones |
| Empty States | No products / no orders / no reviews yet | Specific, campus-flavoured copy — not generic “Nothing here” placeholders |

4\. Key Screens (Phase 1)
=========================

| **Screen** | **Priority** | **Notes** |
| --- | --- | --- |
| Campus Mart home (/mart) | P0 | Search bar, categories, featured/trending (admin-curated for launch, not yet algorithmic) |
| Product detail | P0 | Image gallery, seller card, stock state, reviews, related products |
| Seller storefront | P0 | Public — this is the page Voice of UPSA articles link out to (App Flow §5) |
| Cart | P0 | Grouped by seller with per-seller subtotal, ahead of split checkout |
| Checkout | P0 | Delivery location, Pay on Delivery confirmation, order summary |
| Buyer — My Orders | P0 | Status tracker, cancel action while eligible, review prompt post-delivery |
| Seller — Apply | P0 | Registration form; clear “Pending Verification” state after submit |
| Seller dashboard — Overview | P0 | Orders needing action first, then rollup metrics |
| Seller — Product form | P0 | Multi-image upload, variant fields, condition selector |
| Seller — Orders | P0 | Queue grouped by status, action buttons inline |
| Admin — Moderation queue | P0 | Sellers and products in one triage view, approve/reject with a required note on reject |

5\. Anti-AI-Generic Rules (applied)
===================================

Same rules enforced across all Codey Dev Figma work — explicitly excluded from Campus Mart:

*   Gradient blobs as decoration
*   Glassmorphism as the default card treatment
*   Uniform pill buttons everywhere regardless of hierarchy
*   Scroll-fade-in applied to every section indiscriminately
*   Cursor-following gradient beams
*   Grain used specifically to dress up a gradient (plain grain texture alone is fine)
*   Fade-only hover states with no other feedback
*   Decorative italic serif accents dropped into an otherwise sans-serif UI
*   The Space Grotesk + Instrument Serif pairing

6\. Accessibility & Trust Cues
==============================

*   Verification badges and ratings must meet WCAG AA contrast against both the card background and any discount-tag overlay
*   Out-of-stock and pending-review states communicated by more than colour alone (icon + label), not colour-only
*   WhatsApp/contact-seller actions are explicit buttons the user taps — numbers are never pre-rendered as visible text in page HTML (ties to TDD T9)
*   Delivery location picker and checkout form usable with on-screen keyboard on common Android budget devices — this is the primary device class for UPSA students