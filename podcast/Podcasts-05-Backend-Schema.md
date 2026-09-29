**BACKEND SCHEMA**  
**Podcasts**  
Database design — Phase 1 tables, relationships, and RLS  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0  
**Engine:** PostgreSQL (Supabase), schema: podcasts  
**Note:** The RSS feed is a rendering of these tables at request time, not a separately stored document (TDD §5.1)

Table of Contents
=================

1\. Conventions
===============

*   Tables live in a dedicated podcasts schema, referencing the same shared public.profiles table for identity
*   id uuid PK default gen\_random\_uuid(), created\_at/updated\_at on every table
*   Soft delete via deleted\_at on shows and episodes

2\. Tables
==========

2.1 shows
---------

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid, PK |  |
| slug | text, unique | Server-generated from title; forms the feed URL path |
| title, description | text |  |
| category | enum: campus\_life, academics, interviews, student\_voices, sports, other |  |
| cover\_image\_url | text | Cloudinary URL, square format (Design Brief §2) |
| itunes\_author | text | Required by the iTunes namespace (PRD §6) |
| itunes\_explicit | boolean, default false | Required by the iTunes namespace |
| status | enum: active, inactive | Only active shows (and their feeds) are publicly reachable |
| created\_by | uuid, FK → profiles.id |  |
| deleted\_at | timestamptz, nullable | Soft delete |

2.2 episodes
------------

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid, PK |  |
| show\_id | uuid, FK → shows.id |  |
| slug | text, unique per show | Server-generated from title |
| title, description | text | description = show notes, sanitized before render (TDD T2) |
| episode\_number, season\_number | int, season nullable |  |
| audio\_url | text | Cloudinary URL (video resource type), byte-range capable |
| duration\_seconds | int | Required by the iTunes namespace’s itunes:duration tag |
| transcript | text, nullable | Optional in Phase 1 (PRD §7) |
| status | enum: draft, published |  |
| published\_at | timestamptz, nullable |  |
| deleted\_at | timestamptz, nullable | Soft delete |

3\. Shared Platform Table (referenced, not owned here)
======================================================

public.audit\_logs  
Podcasts writes: "show.created", "show.updated",  
"episode.published", "episode.unpublished"  
  
public.reports — NOT used by this feature  
public.notifications — NOT integrated yet (App Flow §3.3)

4\. Feed Rendering (not a stored table)
=======================================

GET /podcasts/\[show\_slug\]/feed.xml  
SELECT episodes WHERE show\_id = :show AND status = 'published'  
ORDER BY published\_at DESC  
render RSS 2.0 + itunes: namespace directly from the query result  
— no feed\_documents table; the feed cannot drift from published data  
because there is nothing else for it to drift from

5\. Row Level Security
======================

| **Table** | **Read** | **Write** |
| --- | --- | --- |
| shows | Public, where status = active; Admin sees all | Admin only |
| episodes | Public, where status = published (and parent show is active); Admin sees all | Admin only |

6\. Core Relationships
======================

shows 1─└1 episodes ─┄1 profiles (created\_by)  
shows, episodes ──┄1 public.audit\_logs