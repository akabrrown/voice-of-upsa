**PRODUCT REQUIREMENTS DOCUMENT**  
**Campus Mart**  
Student marketplace feature for voiceofupsa.com  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0 — Phase 1 (MVP) scope  
**Status:** Draft for build  
**Related docs:** TDD · Design Brief · App Flow · Backend Schema

Table of Contents
=================

1\. Overview
============

Campus Mart is a student-focused marketplace added to the existing Voice of UPSA platform. It gives UPSA students and approved campus businesses a place to list, discover, and buy products and services from within the campus community, with each seller operating their own storefront under a shared marketplace shell.  
This PRD scopes Phase 1 only — the buildable MVP. Later-phase ideas from the original concept brief (delivery agents, seller wallets, sponsored listings, AI search, a campus map) are named explicitly in Section 8 so they are never accidentally pulled into this build.

2\. Goals
=========

1.  Give every approved seller a working storefront with product management, order handling, and a dashboard.
2.  Give every buyer a shopping and order-tracking experience that works well on a phone.
3.  Launch with Pay on Delivery only — no payment gateway dependency for v1.
4.  Keep the trust layer real from day one: seller verification, product moderation, reviews, and reporting — not deferred to “later.”
5.  Build the data model so Phase 2–5 features (wishlists, promotions, delivery agents, wallets, AI search) can be added without a schema rewrite.

3\. User Roles
==============

One account, contextual behavior — consistent with the two-role model used across Codey Dev projects. There is no separate “buyer account” or “seller account.”

| **Role** | **Definition** | **Key capabilities** |
| --- | --- | --- |
| Visitor | Unauthenticated | Browse, search, view storefronts and products — must sign in to buy |
| User (buyer, default) | Any signed-in account | Cart, checkout, order tracking, reviews, reporting, messaging |
| User (seller flag) | Signed-in account with seller\_status = verified | Storefront, product management, order fulfillment, seller dashboard |
| Admin | Internal staff, is\_admin = true | Seller verification, product moderation, dispute handling, category management, audit log access |

4\. Phase 1 Feature Scope
=========================

4.1 Buyer
---------

*   Browse, search (name/category/description), and filter (category, price, condition, seller, delivery availability)
*   View a product page: images, price, stock, seller card, delivery info, reviews
*   View a seller storefront (public, at /mart/store/\[slug\])
*   Cart — supports items from multiple sellers, correctly split into one order per seller at checkout
*   Checkout — select campus delivery location, confirm Pay on Delivery, place order
*   Order tracking with status history (Pending → Confirmed → Processing → Ready → Out for Delivery → Delivered, plus Cancelled/Rejected/Disputed)
*   Cancel an order while still eligible (before seller confirms)
*   Review a product and a seller after a Delivered order (one review per order, per target)
*   Message a seller about a product; optional “Chat on WhatsApp” link if the seller has provided a number
*   Report a product, seller, or order
*   In-app notification centre — order status changes, product-approved/rejected (if also a seller)

4.2 Seller
----------

*   Apply to become a seller — collects the fields in Section 5 of the original concept brief; goes to Pending Verification
*   Once verified: create/edit the storefront (name, slug, logo, banner, description, location, policies)
*   Product CRUD — images, price, stock, condition (New/Like New/Good/Fair/Used), category, variants (simple: color/size only in Phase 1)
*   New products enter Pending Review; only Admin-approved products are publicly visible
*   Order queue — accept, reject, update status, add notes, mark ready/out-for-delivery/delivered
*   Seller dashboard — orders, products, low-stock flags, reviews, and a simple aggregated view of store views/orders/revenue (computed on a schedule, not live per-request — see TDD §6)
*   Vacation mode — pause purchasing without unpublishing the store

4.3 Admin
---------

*   Seller queue — approve, reject, suspend, reactivate
*   Product moderation queue — approve, reject, request changes, suspend, remove
*   Category management — create, edit, reorder, disable
*   Reports and disputes — view, investigate, resolve, with resolution reason recorded
*   Audit log — read-only view of all administrative actions

4.4 Delivery model (Phase 1)
----------------------------

No delivery-agent network yet. Delivery locations are a fixed, admin-managed lookup list (Hostel, Academic Block, Library, Cafeteria, Student Centre, Administration Block, Business School, Other), and fulfillment is coordinated directly between buyer and seller after the order is placed. This keeps Phase 1 shippable without the delivery-agent subsystem in Section 8.

5\. Non-Functional Requirements
===============================

| **Area** | **Requirement** |
| --- | --- |
| Performance | Product listing pages interactive in <2s on 3G-equivalent mobile; cursor-based pagination throughout; no live-computed analytics on dashboard load |
| Security | Row Level Security enforced on every marketplace table; server-side price and stock validation on every order (browser-submitted prices are never trusted); rate limiting on registration, product creation, reviews, and contact-reveal actions |
| Data integrity | Order line items store a frozen price/discount snapshot at creation; order status transitions enforced by a state machine, not just application logic; audit log is append-only |
| Availability | Marketplace pages degrade gracefully if the wider Voice of UPSA site has an outage in an unrelated module |
| Mobile | Mobile-first for the five critical flows: search, product detail, cart, checkout, order tracking |
| Privacy | Student/index numbers and any field not explicitly marked public are never exposed on a public storefront or product page |

6\. Out of Scope for Phase 1
============================

Named explicitly so scope does not creep mid-build. These map to Phases 2–5 of the original concept brief and are picked up as separate, later PRDs.  
**Phase 2** Wishlist, follow sellers, coupons/promotions, featured stores & products, richer seller/product analytics, second-hand/books/food sub-marketplaces, formal buyer-protection dispute flow  
**Phase 3** Delivery agents, delivery dashboard, delivery zones and fees, delivery tracking  
**Phase 4** Online payments (Paystack/MoMo), seller wallets, withdrawals, platform commission  
**Phase 5** AI search (pgvector), AI recommendations, AI seller copy assistant, sponsored products, advertising system  
**Cut** Campus marketplace map — dropped from the roadmap; low expected value against added geolocation/privacy surface

7\. Success Metrics (Phase 1)
=============================

*   Sellers: number of verified sellers with ≥1 published product within 30 days of launch
*   Liquidity: median time from order placed to seller confirmation
*   Trust: % of delivered orders that receive a review; report-to-order ratio stays low
*   Reliability: zero known incidents of price mismatch between checkout total and server-recorded total

8\. Open Questions
==================

*   Does Voice of UPSA already have an admin panel Campus Mart should plug into, or does Phase 1 need its own /admin/mart shell?
*   Should “Report a product/seller” route to the existing Voice of UPSA moderation team, or a Campus Mart–specific queue?
*   Confirm campus delivery location list with UPSA (hostel names, blocks) before hardcoding the lookup table.