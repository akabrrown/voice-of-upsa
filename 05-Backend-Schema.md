**BACKEND SCHEMA**  
**Campus Mart**  
Database design — Phase 1 tables, relationships, and RLS  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0  
**Engine:** PostgreSQL (Supabase), schema: mart  
**Scope:** Phase 1 tables only — later-phase tables listed separately in Section 6, not created yet

Table of Contents
=================

1\. Conventions
===============

*   All Phase 1 tables live in a dedicated mart schema — separate from existing Voice of UPSA tables, so RLS policies and migrations can be reasoned about independently
*   Every table has id uuid primary key default gen\_random\_uuid(), created\_at, updated\_at
*   Soft delete via deleted\_at timestamptz (nullable) on products and stores — never hard-deleted, so historical orders stay valid
*   Every foreign key to auth.users(id) is named consistently: owner\_id, buyer\_id, seller\_id, actor\_id
*   Row Level Security is enabled on every table below; policies are summarized per table, not written out in full SQL here — implemented at build time from this spec
*   Money stored as integer pesewas (GHS minor unit), never floating point

2\. Identity
============

2.1 profiles
------------

Extends the existing Voice of UPSA user profile — not a new auth system. Adds marketplace-specific fields only.

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid, PK, references auth.users | Shared with the rest of Voice of UPSA |
| is\_seller | boolean, default false | Contextual flag, not a separate role |
| seller\_status | enum: none, pending\_verification, verified, trusted, suspended, rejected | Drives storefront visibility |
| whatsapp\_number | text, nullable | Only exposed via explicit reveal action (TDD T9) |
| is\_admin | boolean, default false | Never trusted from client input — read from session claims only |

_RLS: a user reads/updates their own row only. Admin flag readable by the owner and by admins; not publicly selectable._

2.2 seller\_details
-------------------

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid, PK |  |
| profile\_id | uuid, FK → profiles.id, unique | One-to-one with profiles |
| seller\_type | enum: student, student\_business, campus\_business, external\_approved |  |
| full\_name, phone | text | Collected at application |
| index\_number | text, nullable | Never selected in any public query (TDD T11) |
| verified\_at, verified\_by | timestamptz, uuid FK → profiles.id | Set by admin action |

_RLS: owner reads/writes own row (except verified\_at/verified\_by); admin full access._

3\. Marketplace
===============

3.1 stores
----------

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid, PK |  |
| owner\_id | uuid, FK → profiles.id |  |
| slug | text, unique, not null | Server-generated with collision retry — never client-supplied raw (TDD T6) |
| name, description, location | text |  |
| logo\_url, banner\_url | text | Cloudinary URLs |
| policies | jsonb | Return/cancellation/delivery/exchange policy text |
| is\_paused | boolean, default false | Vacation mode |
| deleted\_at | timestamptz, nullable | Soft delete |

3.2 categories
--------------

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid, PK |  |
| name, slug | text, unique |  |
| sort\_order | int |  |
| is\_active | boolean, default true |  |

3.3 products
------------

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid, PK |  |
| store\_id | uuid, FK → stores.id |  |
| category\_id | uuid, FK → categories.id |  |
| slug | text, unique | Server-generated |
| name, description | text |  |
| price, discount\_price | int (pesewas) | discount\_price nullable |
| condition | enum: new, like\_new, good, fair, used |  |
| stock\_qty, reserved\_qty | int, default 0 | available = stock\_qty − reserved\_qty, computed, never stored directly |
| status | enum: draft, pending\_review, approved, rejected, suspended | Only approved is publicly queryable |
| search\_vector | tsvector, generated | GIN-indexed; built from name + description |
| deleted\_at | timestamptz, nullable | Soft delete |

3.4 product\_images
-------------------

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid, PK |  |
| product\_id | uuid, FK → products.id |  |
| url | text | Cloudinary URL |
| sort\_order | int |  |

_RLS across this section: public read where status/visibility allows (approved products, non-deleted stores, active categories); write restricted to store owner; admin full access. Public read queries select an explicit public column list — never \*._

4\. Shopping & Orders
=====================

4.1 cart\_items
---------------

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid, PK |  |
| buyer\_id | uuid, FK → profiles.id |  |
| product\_id | uuid, FK → products.id |  |
| quantity | int, check > 0 |  |

4.2 orders
----------

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid, PK |  |
| order\_number | text, unique | Generated from a Postgres sequence, formatted VOU-YYYY-NNNNNN — never app-generated random (avoids collision under concurrency) |
| checkout\_session\_id | uuid | Groups sibling orders from one multi-seller checkout |
| buyer\_id | uuid, FK → profiles.id |  |
| store\_id | uuid, FK → stores.id | One order = one seller |
| delivery\_location\_id | uuid, FK → delivery\_locations.id |  |
| delivery\_details | jsonb | Room/floor/instructions where applicable |
| subtotal, delivery\_fee, discount\_total, total | int (pesewas) | Computed server-side at checkout, never trusted from client |
| payment\_method | enum: pay\_on\_delivery | Single value in Phase 1; extended in Phase 4 |
| payment\_status | enum: pending, paid, failed, refunded, cancelled |  |
| status | enum: pending, confirmed, processing, ready, out\_for\_delivery, delivered, cancelled, rejected, disputed | Transitions enforced by trigger — see 4.4 |
| idempotency\_key | text, unique per buyer | Prevents duplicate orders on retry (TDD T7) |

4.3 order\_items
----------------

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid, PK |  |
| order\_id | uuid, FK → orders.id |  |
| product\_id | uuid, FK → products.id | Reference only — not the source of truth for price |
| product\_name\_snapshot | text | Frozen at order time (product may later change name/be deleted) |
| unit\_price\_snapshot, discount\_snapshot | int (pesewas) | Frozen at order creation — never recalculated from live product price (TDD T1, TDD §5.1) |
| quantity | int |  |

### 4.4 Order status transition rule (enforced by trigger, not app code)

allowed edges:  
pending -> confirmed, cancelled  
confirmed -> processing, cancelled  
processing -> ready  
ready -> out\_for\_delivery  
out\_for\_delivery -> delivered  
any active state -> disputed (admin-only)  
reject any UPDATE that sets status outside these edges

4.5 order\_status\_history
--------------------------

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid, PK |  |
| order\_id | uuid, FK → orders.id |  |
| from\_status, to\_status | enum |  |
| note | text, nullable |  |
| changed\_by | uuid, FK → profiles.id |  |

4.6 delivery\_locations
-----------------------

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid, PK |  |
| zone | enum: hostel, academic\_block, library, cafeteria, student\_centre, admin\_block, business\_school, other |  |
| label | text | e.g. specific hostel/block name |
| is\_active | boolean, default true |  |

_RLS: cart\_items and orders readable/writable only by buyer\_id = auth.uid() (buyer side) or by the owning store’s owner (seller side); order\_status\_history insert-only via the status-update action; delivery\_locations public read, admin write._

5\. Reviews, Communication, Moderation
======================================

5.1 product\_reviews / seller\_reviews
--------------------------------------

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid, PK |  |
| order\_id | uuid, FK → orders.id | Must be status = delivered; unique per (order\_id, reviewer, target) |
| buyer\_id | uuid, FK → profiles.id |  |
| target\_id | uuid, FK → products.id or stores.id | Two tables, same shape — kept separate for clean query indexes |
| rating | int, check 1–5 |  |
| comment | text, nullable |  |
| image\_urls | text\[\], nullable | Cloudinary URLs |

_Delivery sub-rating from the original concept brief is folded into seller\_reviews as an optional field for Phase 1, rather than a third table — reconsider as a separate delivery\_reviews table only once Phase 3 delivery agents exist._

5.2 conversations / messages
----------------------------

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| conversations.id | uuid, PK |  |
| conversations.buyer\_id, store\_id | uuid, FK |  |
| conversations.product\_id | uuid, FK, nullable | Optional context |
| messages.id | uuid, PK |  |
| messages.conversation\_id | uuid, FK |  |
| messages.sender\_id | uuid, FK → profiles.id |  |
| messages.body | text | Rate limited at the action layer (TDD T13) |

5.3 notifications
-----------------

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid, PK |  |
| profile\_id | uuid, FK → profiles.id |  |
| type | enum | order\_status\_changed, product\_approved, product\_rejected, new\_order, low\_stock, new\_review, new\_message |
| payload | jsonb |  |
| read\_at | timestamptz, nullable |  |

5.4 reports
-----------

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid, PK |  |
| reporter\_id | uuid, FK → profiles.id |  |
| entity\_type | enum: product, store, order, review, message |  |
| entity\_id | uuid |  |
| reason | enum | scam, fraud, fake\_product, counterfeit, inappropriate, misleading, harassment, suspicious, other |
| details | text, nullable |  |
| status | enum: open, investigating, resolved, dismissed |  |
| resolution\_note, resolved\_by, resolved\_at | text, uuid, timestamptz |  |

5.5 audit\_logs
---------------

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid, PK |  |
| actor\_id | uuid, FK → profiles.id |  |
| action | text | e.g. seller.approved, product.rejected, report.resolved |
| resource\_type, resource\_id | text, uuid |  |
| metadata | jsonb | Before/after values where relevant |

_RLS: audit\_logs — INSERT allowed from server actions only, no UPDATE/DELETE grant at all (append-only, TDD §5.4); SELECT restricted to admins._

6\. Deferred to Later Phases (not created in Phase 1)
=====================================================

Listed here so the Phase 1 migration set is a deliberate subset, not an oversight.

| **Phase** | **Tables** |
| --- | --- |
| Phase 2 | wishlists, wishlist\_items, store\_followers, coupons, promotions, featured\_stores |
| Phase 3 | delivery\_agents, delivery\_zones, deliveries, delivery\_events |
| Phase 4 | payments, seller\_wallets, wallet\_transactions, withdrawals |
| Phase 5 | sponsored\_products, product embeddings (pgvector) for AI search |

7\. Core Relationships
======================

profiles 1─━1 seller\_details ─└1 stores ─└1 products ─└1 product\_images  
profiles (buyer) ─└1 orders ─└1 order\_items ─┄1 products  
orders ─└1 order\_status\_history  
orders ─└1 product\_reviews / seller\_reviews (post-delivery only)  
stores ─└1 conversations ─└1 messages