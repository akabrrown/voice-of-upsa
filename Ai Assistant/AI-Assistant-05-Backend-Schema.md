**BACKEND SCHEMA**  
**AI Assistant**  
Database design — Phase 1 tables, relationships, and RLS  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0  
**Engine:** PostgreSQL (Supabase) with pgvector, schema: assistant  
**Note:** Second feature to add a sensitive, out-of-band-granted flag to the shared public.profiles table (Section 3)

Table of Contents
=================

1\. Conventions
===============

*   Tables live in a dedicated assistant schema, referencing the same shared public.profiles table for identity
*   id uuid PK default gen\_random\_uuid(), created\_at on every table
*   Neither table below is exposed to any client-side query — both are reached only through server-side functions

2\. Tables
==========

2.1 content\_index
------------------

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid, PK |  |
| source\_type | enum: product, service, posting, poll, podcast\_episode, video, map\_pin | Deliberately has no value for confessions or gallery (PRD §2, App Flow §4.1) |
| source\_id | uuid | ID of the row in the owning feature’s own table |
| indexed\_text | text | The text that was embedded — kept so an answer can be traced back to exactly what the model saw |
| embedding | vector | pgvector; dimension set by the chosen embedding model |
| updated\_at | timestamptz | Refreshed by reindexContent() |
| UNIQUE | (source\_type, source\_id) | One index row per source record |

2.2 query\_log
--------------

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid, PK |  |
| user\_id | uuid, FK → profiles.id, nullable | Null for signed-out visitors |
| message | text | The student’s message as sent |
| crisis\_flagged | boolean | True when the pre-model crisis check matched; the message is still stored for the same 30-day window, not treated differently for retention |
| model\_used | text | e.g. primary or fallback |
| tokens\_used | int | For cost tracking (PRD §8) |
| expires\_at | timestamptz | created\_at + 30 days; rows past this are deleted by a scheduled cleanup (TDD §6) |

3\. Shared Platform Addition
============================

ALTER TABLE public.profiles  
ADD COLUMN can\_review\_assistant\_logs boolean NOT NULL DEFAULT false;  
  
— granted only via direct database action, never an Admin UI toggle  
— same out-of-band pattern as can\_unmask\_anonymous\_posts (Confessions)  
  
public.audit\_logs  
Assistant writes: "assistant\_logs.reviewed" — requires metadata.reason, always

4\. Row Level Security
======================

| **Table** | **Read** | **Write** |
| --- | --- | --- |
| content\_index | No direct client access. The retrieval function joins it back to each source table under the caller’s own RLS, so a row is only ever returned if the caller could already read its source record (TDD T2) | Only via reindexContent(), server-side |
| query\_log | No direct client access at all, including a student reading their own rows. Log reviewers only, through the audited path, with a mandatory reason | INSERT-only from the askAssistant server action; no UPDATE; DELETE only by the scheduled retention cleanup |
| public.profiles.can\_review\_assistant\_logs | Log reviewer (to confirm their own status); never publicly readable | No application write path — database-console only |

5\. Core Relationships
======================

content\_index ──→ (source\_type, source\_id) in each owning feature’s schema  
(a logical reference, not a foreign key — seven different tables)  
query\_log ─┄1 profiles (user\_id, nullable)  
query\_log ──┄1 public.audit\_logs (on log-reviewer access only)