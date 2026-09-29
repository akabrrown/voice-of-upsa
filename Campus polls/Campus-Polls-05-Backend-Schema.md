**BACKEND SCHEMA**  
**Campus Polls**  
Database design — Phase 1 tables, relationships, and RLS  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0  
**Engine:** PostgreSQL (Supabase), schema: polls  
**Note:** References the shared public.profiles table established by Campus Mart — not duplicated here

Table of Contents
=================

1\. Conventions
===============

*   Tables live in a dedicated polls schema, separate from mart, but reference the same shared profiles table for identity
*   id uuid PK default gen\_random\_uuid(), created\_at/updated\_at on every table
*   Soft delete via deleted\_at on polls only — votes are never deleted in Phase 1

2\. Tables
==========

2.1 polls
---------

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid, PK |  |
| slug | text, unique | Server-generated from question text |
| question | text, not null |  |
| category | enum: academics, campus\_life, events, sports, opinion | Kept consistent with categories other Wave 1+ features may reuse (App Flow §3.3) |
| created\_by | uuid, FK → profiles.id | Admin who created it |
| status | enum: draft, published, closed | See TDD §5.3 for transition rule |
| results\_visibility | enum: always, after\_vote, after\_close |  |
| expires\_at | timestamptz, nullable | Null = manual close only |
| deleted\_at | timestamptz, nullable | Soft delete |

2.2 poll\_options
-----------------

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid, PK |  |
| poll\_id | uuid, FK → polls.id |  |
| label | text, not null | Locked once poll has ≥1 vote or is published (TDD T4) |
| sort\_order | int |  |
| vote\_count | int, default 0 | Mutated only by the trigger below — no application UPDATE grant (TDD T3) |

2.3 poll\_votes
---------------

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid, PK |  |
| poll\_id | uuid, FK → polls.id |  |
| option\_id | uuid, FK → poll\_options.id | Must belong to poll\_id — checked at insert |
| voter\_id | uuid, FK → profiles.id | Never exposed via any public read policy (TDD T5) |
| UNIQUE | (poll\_id, voter\_id) | One vote per student per poll — database-enforced (TDD T1) |

### 2.4 Vote-count trigger (enforced in the database, not app code)

AFTER INSERT ON poll\_votes:  
UPDATE poll\_options  
SET vote\_count = vote\_count + 1  
WHERE id = NEW.option\_id  
  
application role has no direct UPDATE grant on poll\_options.vote\_count

3\. Row Level Security
======================

| **Table** | **Read** | **Write** |
| --- | --- | --- |
| polls | Public, where status = published or (status = closed); draft only visible to Admin | Admin only |
| poll\_options | Public, alongside its parent poll (label + vote\_count only where the poll’s results\_visibility allows) | Admin only, and only while the poll has 0 votes and is not yet published |
| poll\_votes | A user may read only their own row (voter\_id = auth.uid()), to render "you voted"; Admin may read aggregate counts only, never per-row voter\_id, through any application query | Insert only, via castVote action; no UPDATE or DELETE path in Phase 1 |

4\. Core Relationships
======================

polls 1─└1 poll\_options 1─└1 poll\_votes ─┄1 profiles (voter)  
polls ─┄1 profiles (created\_by, Admin)