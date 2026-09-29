**BACKEND SCHEMA**  
**Job/Internship Board**  
Database design — Phase 1 tables, relationships, and RLS  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0  
**Engine:** PostgreSQL (Supabase), schema: jobs  
**Note:** Writes into the shared public.audit\_logs table established during the Student Services Directory build

Table of Contents
=================

1\. Conventions
===============

*   Tables live in a dedicated jobs schema, referencing the same shared public.profiles table for identity
*   id uuid PK default gen\_random\_uuid(), created\_at/updated\_at on every table
*   Soft delete via deleted\_at on postings

2\. Tables
==========

2.1 job\_categories
-------------------

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid, PK |  |
| name, slug | text, unique | e.g. IT & Tech, Business & Finance, Marketing & Sales, Education, Healthcare, Creative & Design, Logistics, Other |
| sort\_order | int |  |
| is\_active | boolean, default true |  |

2.2 postings
------------

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid, PK |  |
| slug | text, unique | Server-generated from title + organization |
| poster\_id | uuid, FK → profiles.id |  |
| category\_id | uuid, FK → job\_categories.id |  |
| title, organization\_name | text |  |
| type | enum: full\_time, part\_time, internship, volunteer, freelance |  |
| location\_type, location\_label | enum: on\_campus, accra, remote, other; text |  |
| description, requirements | text |  |
| compensation\_type, compensation\_details | enum: paid, unpaid, stipend, undisclosed; text, nullable |  |
| apply\_method, apply\_value | enum: link, email, instructions; text |  |
| status | enum: pending\_review, approved, rejected, closed | "Expired" is computed at read time from expires\_at, not a stored status (TDD §6) |
| expires\_at | timestamptz, nullable | Application deadline |
| is\_featured | boolean, default false |  |
| search\_vector | tsvector, generated | GIN-indexed; from title + organization\_name + description |
| deleted\_at | timestamptz, nullable | Soft delete |

2.3 job\_reports
----------------

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid, PK |  |
| posting\_id | uuid, FK → postings.id |  |
| reporter\_id | uuid, FK → profiles.id |  |
| reason | enum: scam, fraud, misleading, inappropriate, other |  |
| details | text, nullable |  |
| status | enum: open, resolved, dismissed |  |
| resolution\_note, resolved\_by, resolved\_at | text, uuid, timestamptz |  |

3\. Status Transition Rule (enforced by trigger, not app code)
==============================================================

allowed edges:  
pending\_review -> approved, rejected  
approved -> pending\_review (any content-field UPDATE, forced)  
approved -> closed (owner or Admin, manual)  
rejected -> pending\_review (owner resubmits)  
reject any UPDATE that sets status outside these edges

4\. Shared Platform Table (referenced, not owned here)
======================================================

public.audit\_logs  
Job Board writes: "posting.approved", "posting.rejected",  
"posting.resubmitted", "report.resolved",  
"category.created"

5\. Row Level Security
======================

| **Table** | **Read** | **Write** |
| --- | --- | --- |
| job\_categories | Public, where is\_active = true; Admin sees all | Admin only |
| postings | Public, where status = approved and (expires\_at is null or expires\_at > now()); owner sees all own statuses; Admin sees all | Insert: any signed-in user. Update/close: owner or Admin only. Status set to approved/rejected: Admin only |
| job\_reports | Reporter reads own; Admin reads all | Insert: any signed-in user (rate-limited). Resolve: Admin only |

6\. Core Relationships
======================

job\_categories 1─└1 postings ─┄1 profiles (poster\_id)  
postings 1─└1 job\_reports ─┄1 profiles (reporter\_id)  
postings ──┄1 public.audit\_logs (moderation + resubmission events)