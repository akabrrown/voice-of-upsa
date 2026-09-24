**APP FLOW**  
**Campus Mart**  
User journeys, screen flow, and URL structure — Phase 1  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0

Table of Contents
=================

1\. Buyer Journey
=================

**→** Visitor lands on /mart or a Voice of UPSA article linking to a store  
**→** Browses / searches / filters products  
**→** Opens a product page → views seller card, stock, reviews  
**→** Adds to cart (prompted to sign in if not authenticated)  
**❖** Opens cart — items grouped by seller with subtotals  
**→** Proceeds to checkout → selects campus delivery location → confirms Pay on Delivery  
**→** Server validates stock + recomputes price → creates one order per seller under a shared checkout session  
**→** Order confirmation screen → order(s) appear in My Orders  
**→** Seller confirms → buyer sees status update in real time (Supabase Realtime)  
**→** Order reaches Delivered → buyer pays the seller in person → buyer prompted to review product + seller  
**→** Buyer can reorder, contact seller, or report a problem at any point from My Orders

2\. Seller Journey
==================

**→** Signed-in user opens “Become a Seller” → submits registration form  
**❖** Account enters Pending Verification — sees status banner until reviewed  
**→** Admin approves → seller notified → prompted to complete store setup (name, slug, logo, banner, policies)  
**→** Seller adds a product → product enters Pending Review  
**❖** Admin approves → product goes live on storefront and category/search pages  
**→** Buyer places an order → seller gets a real-time + in-app notification  
**→** Seller reviews order in dashboard → Accept or Reject  
**→** If accepted → seller moves order through Processing → Ready → Out for Delivery → Delivered  
**→** Seller monitors dashboard rollups (orders, revenue, low-stock) and responds to buyer messages / reviews

3\. Admin Journey
=================

**→** Admin opens /admin/mart → moderation queue shows pending sellers and pending products together  
**→** Reviews a seller application → Approve / Reject (reject requires a note)  
**→** Reviews a product → Approve / Reject / Request changes  
**→** Monitors open reports/disputes → investigates → resolves with a recorded resolution  
**→** Manages categories as the catalogue grows  
**❖** All actions above write to the audit log automatically — no separate step required

4\. Multi-Seller Cart → Checkout → Order Split
==============================================

This is the one flow in Campus Mart with real data-modeling weight, so it’s worth diagramming on its own.

| **Stage** | **What happens** |
| --- | --- |
| Cart | cart\_items can reference products from any number of distinct stores; the cart UI groups them by seller with a running subtotal per seller |
| Checkout submit | Client sends the full cart plus a generated idempotency\_key; no prices are sent — only product\_id + quantity |
| Server validation | For every line: re-fetch current product price/stock, reject or flag out-of-stock/changed-price items before proceeding |
| Order creation | One orders row is created per distinct seller in the cart, all sharing a single checkout\_session\_id; each order gets its own order\_items with frozen price snapshots |
| Confirmation | Buyer sees one confirmation screen listing all resulting orders (e.g. “2 orders placed — from Tobi Tech and Campus Eats”) |
| Downstream | Each seller only ever sees and manages their own order; the buyer’s My Orders lists both, linked by checkout\_session\_id for the buyer’s own reference |

5\. Voice of UPSA Editorial → Store Link
========================================

The one cross-platform flow Campus Mart needs to support at launch, per the original concept brief:  
**→** Voice of UPSA publishes a “Meet the Student Behind \[Store\]” article  
**→** Article includes a “Visit \[Store\] on Campus Mart” link to /mart/store/\[slug\]  
**→** Reader lands on the storefront already warmed up by the article context → browses products → enters the buyer journey above  
_No special integration work is required beyond the storefront URL being stable and public — this is a content/editorial workflow, not a technical dependency._

6\. URL Structure (Phase 1)
===========================

| **Path** | **Purpose** |
| --- | --- |
| /mart | Marketplace homepage |
| /mart/products | Full product listing with filters |
| /mart/products/\[slug\] | Product detail |
| /mart/category/\[slug\] | Category listing |
| /mart/store/\[slug\] | Public seller storefront |
| /mart/cart | Cart |
| /mart/checkout | Checkout |
| /mart/orders | Buyer order history |
| /mart/orders/\[id\] | Buyer order detail / tracking |
| /mart/account | Buyer account settings |
| /mart/sell | Seller application entry point |
| /mart/seller | Seller dashboard overview |
| /mart/seller/products | Seller product list |
| /mart/seller/products/new | Add product |
| /mart/seller/products/\[id\]/edit | Edit product |
| /mart/seller/orders | Seller order queue |
| /mart/seller/store | Store settings |
| /admin/mart | Admin moderation overview |
| /admin/mart/sellers | Seller queue |
| /admin/mart/products | Product moderation queue |
| /admin/mart/categories | Category management |
| /admin/mart/reports | Reports & disputes |

_Deferred to later phases and intentionally not reserved yet: seller analytics as a standalone route (folded into /mart/seller for Phase 1), delivery-agent routes, wallet/withdrawal routes._