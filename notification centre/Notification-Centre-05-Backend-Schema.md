**BACKEND SCHEMA**  
**Notification Centre**  
Database design — Phase 1 tables, relationships, and RLS  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0  
**Engine:** PostgreSQL (Supabase), schema: public (Section 1)  
**Note:** Includes the one-time migration of Campus Mart’s mart.notifications into this shared table (Section 4)

Table of Contents
=================

1\. Conventions
===============

*   Unlike every feature schema so far, these tables live directly in public — there is no notifications-specific schema, because this table is itself the shared platform resource every feature calls into, not a feature with its own domain
*   id uuid PK default gen\_random\_uuid(), created\_at on every table
*   type is a plain text column, not a Postgres enum — deliberately, so a new feature can introduce a new notification type without an ALTER TYPE migration; validity is enforced at the application layer by the Zod schema registered for that type, not by the database

2\. Tables
==========

2.1 notifications
-----------------

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid, PK |  |
| recipient\_id | uuid, FK → profiles.id |  |
| type | text | e.g. "job.posting\_approved", "gallery.photo\_rejected", "confessions.post\_approved", "mart.order\_status\_changed" — see PRD §4.2 for the launch set |
| category | text | Coarser grouping used for mute preferences — e.g. "job\_board", "gallery", "confessions", "campus\_mart" |
| payload | jsonb | Shape validated per-type by the calling feature’s own Zod schema before notify() is invoked, not by this table |
| channel | enum: in\_app | Single value in Phase 1; extended in Phase 2 for email/sms (PRD §7) |
| read\_at | timestamptz, nullable | Set once, never cleared (TDD §5.2) |

2.2 notification\_preferences
-----------------------------

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid, PK |  |
| profile\_id | uuid, FK → profiles.id |  |
| category | text | Matches notifications.category |
| muted | boolean, default false |  |
| UNIQUE | (profile\_id, category) |  |

3\. The notify() Function — Sole Write Path
===========================================

CREATE FUNCTION notify(recipient\_id uuid, type text, category text, payload jsonb)  
SECURITY DEFINER  
AS $$  
\-- 1. check notification\_preferences for (recipient\_id, category); skip if muted  
\-- 2. rate-limit check on (recipient\_id, type)  
\-- 3. INSERT into notifications  
\-- 4. pg\_notify / Realtime broadcast to the recipient’s channel  
$$;  
  
\-- application role has EXECUTE on notify(), but no direct INSERT on notifications

4\. Migration: Campus Mart’s Notifications
==========================================

one-time migration, not an ongoing dual-write:  
INSERT INTO public.notifications (recipient\_id, type, category, payload, read\_at, created\_at)  
SELECT profile\_id,  
'mart.' || type, -- namespaced to avoid collision with future types  
'campus\_mart',  
payload, read\_at, created\_at  
FROM mart.notifications;  
  
then: repoint Campus Mart’s server actions to call notify() instead of  
inserting into mart.notifications, and drop that table

5\. Row Level Security
======================

| **Table** | **Read** | **Write** |
| --- | --- | --- |
| notifications | Owner only (recipient\_id = auth.uid()) | INSERT: only via the notify() function’s SECURITY DEFINER context — no direct grant to the application role. UPDATE (read\_at only): owner, own rows only |
| notification\_preferences | Owner only | Owner only, own rows |

6\. Core Relationships
======================

profiles 1─└1 notifications  
profiles 1─└1 notification\_preferences  
(every other feature schema) ──→ notify() (the only path in, never a direct FK)