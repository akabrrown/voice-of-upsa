**BACKEND SCHEMA**  
**Student Services Directory**  
Database design — Phase 1 tables, relationships, and RLS  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0  
**Engine:** PostgreSQL (Supabase), schema: directory  
**Note:** Writes into the newly shared public.audit\_logs table (promoted from Campus Mart’s mart schema — see TDD §5.2)

Table of Contents
=================

1\. Conventions
===============

*   Tables live in a dedicated directory schema, separate from mart and polls, referencing the same shared public.profiles table for identity
*   id uuid PK default gen\_random\_uuid(), created\_at/updated\_at on every table
*   Soft delete via deleted\_at on services

2\. Tables
==========

2.1 service\_categories
-----------------------

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid, PK |  |
| name, slug | text, unique | Slugs kept stable — Job Board and future Campus Map are expected to reference them (App Flow §3.4) |
| sort\_order | int |  |
| is\_active | boolean, default true |  |

2.2 services
------------

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid, PK |  |
| slug | text, unique | Server-generated from name |
| category\_id | uuid, FK → service\_categories.id |  |
| name, description | text |  |
| location\_label | text | e.g. "Student Centre, Ground Floor" — kept structured, not buried in description, for future map-pin use |
| contact\_phone, contact\_email, contact\_whatsapp, website\_url | text, all nullable | Public by design — no reveal-gating needed, unlike Campus Mart seller contacts |
| hours | jsonb | Per-day open/close, or a flag for 24/7 or "by appointment" |
| logo\_url | text, nullable | Cloudinary URL |
| is\_featured | boolean, default false |  |
| status | enum: active, inactive | Only active is publicly listed |
| last\_verified\_at | timestamptz | Set on create; refreshed by the "verify today" action or any edit |
| verified\_by, created\_by | uuid, FK → profiles.id |  |
| search\_vector | tsvector, generated | GIN-indexed; from name + description |
| deleted\_at | timestamptz, nullable | Soft delete |

3\. Shared Platform Table (referenced, not owned here)
======================================================

public.audit\_logs (promoted from mart-scoped — TDD §5.2)  
id, actor\_id, action, resource\_type, resource\_id, metadata jsonb, created\_at  
Directory writes: "service.created", "service.updated",  
"service.verified", "service.deactivated",  
"category.created", "category.updated"

4\. Row Level Security
======================

| **Table** | **Read** | **Write** |
| --- | --- | --- |
| service\_categories | Public, where is\_active = true; Admin sees all | Admin only |
| services | Public, where status = active and deleted\_at is null; Admin sees all | Admin only |
| public.audit\_logs | Admin only (SELECT) | INSERT-only, from any feature’s server actions; no UPDATE/DELETE grant |

5\. Core Relationships
======================

service\_categories 1─└1 services ─┄1 profiles (created\_by, verified\_by)  
services ──┄1 public.audit\_logs (every write recorded, not a FK — metadata carries resource\_id)