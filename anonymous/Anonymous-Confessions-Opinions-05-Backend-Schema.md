**BACKEND SCHEMA**  
**Anonymous Confessions/Opinions**  
Database design — Phase 1 tables, relationships, and RLS  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0  
**Engine:** PostgreSQL (Supabase), schema: confessions  
**Note:** First feature to add a column to the shared public.profiles table (Section 3) rather than only referencing it

Table of Contents
=================

1\. Conventions
===============

*   Tables live in a dedicated confessions schema, referencing the same shared public.profiles table for identity
*   id uuid PK default gen\_random\_uuid(), created\_at/updated\_at on every table
*   No hard delete anywhere in this schema — removed and archived are both status values, never a DELETE, since the audit trail depends on the row surviving

2\. Tables
==========

2.1 posts
---------

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid, PK |  |
| author\_id | uuid, FK → profiles.id | Never selected by any public or standard-Admin query — only the unmask query path reads it (TDD §5.2) |
| type | enum: confession, opinion |  |
| category | enum: academics, campus\_life, relationships, humor, serious\_support, other |  |
| body\_text | text, max 500 chars | Enforced at both Zod and database check-constraint level |
| acknowledgment\_confirmed | boolean | Must be true at insert (TDD T2) |
| screening\_flag | enum: none, hate\_speech, threat, self\_harm, contact\_info, name\_pattern, nullable | Set by the automated screening step at submission time |
| status | enum: pending\_review, published, rejected, hidden\_pending\_review, removed, archived | See TDD §5.1 for the transition graph |
| reviewed\_by, reviewed\_at | uuid FK → profiles.id, timestamptz, nullable |  |
| published\_at, archived\_at | timestamptz, nullable | archived\_at set automatically 14 days after published\_at |

2.2 reactions
-------------

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid, PK |  |
| post\_id | uuid, FK → posts.id |  |
| user\_id | uuid, FK → profiles.id |  |
| reaction\_type | enum: relate, support, funny |  |
| UNIQUE | (post\_id, user\_id) | One reaction per user per post (TDD T7) |

3\. Shared Platform Additions
=============================

ALTER TABLE public.profiles  
ADD COLUMN can\_unmask\_anonymous\_posts boolean NOT NULL DEFAULT false;  
  
— granted only via direct database action, never an Admin UI toggle (TDD T5)  
public.audit\_logs  
Confessions writes: "post.approved", "post.rejected", "post.removed",  
"report.resolved",  
"post.unmasked" — requires metadata.reason, always  
  
public.reports  
entity\_type for this feature: "confession\_post"  
reason enum extended with: self\_harm, threat\_of\_violence,  
identifies\_person  
self\_harm / threat\_of\_violence: the only reasons on the platform that  
trigger an automatic status change (-> hidden\_pending\_review) rather  
than only queuing for review (TDD §5.3)

4\. Row Level Security
======================

| **Table** | **Read** | **Write** |
| --- | --- | --- |
| posts | Public: status = published; own row: caller reads all fields except this changes nothing since author\_id is never surfaced to the client regardless of ownership — the app layer, not RLS alone, withholds it; Admin/Trust & Safety: status ≠ archived-only restriction lifted, author\_id still withheld from Admin’s ordinary query path | Insert: any signed-in user. Status changes to published/rejected: Admin only. Status change to removed: Admin only. Automatic archive: system, on schedule |
| reactions | Public, aggregated counts only; own reaction visible to the user who made it | Insert: any signed-in user, one per post. No update/delete in Phase 1 |
| public.profiles.can\_unmask\_anonymous\_posts | Admin/Trust & Safety only (to confirm their own status); never publicly readable | No application write path at all — database-console only |

_The author\_id column deserves an explicit note beyond a standard RLS policy: because even a well-written RLS policy is one bug away from a leak, the application’s standard read queries are written to omit the column entirely at the query level for every path except the single, separately-reviewed unmaskPost function — defense in depth, not reliance on RLS alone for the platform’s single most sensitive field._

5\. Core Relationships
======================

posts ─┄1 profiles (author\_id — access restricted per Section 4)  
posts 1─└1 reactions ─┄1 profiles (user\_id)  
posts ──┄1 public.reports (entity\_type = confession\_post)  
posts ──┄1 public.audit\_logs (moderation + unmask events)