**BACKEND SCHEMA**  
**UPSA Campus Map**  
Database design — Phase 1 tables, relationships, and RLS  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0  
**Engine:** PostgreSQL (Supabase) with PostGIS, schema: map  
**Note:** First feature to hold foreign keys into two other features’ schemas (directory.services, gallery.albums)

Table of Contents
=================

1\. Conventions
===============

*   Tables live in a dedicated map schema, referencing the same shared public.profiles table for identity
*   id uuid PK default gen\_random\_uuid(), created\_at/updated\_at on every table
*   Soft delete via deleted\_at on map\_pins
*   Coordinates stored as a PostGIS geography(Point) column, consistent with the standing stack’s PostGIS usage, rather than plain lat/lng floats — enables future proximity queries (e.g. "pins near me") without a schema change

2\. Tables
==========

2.1 map\_categories
-------------------

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid, PK |  |
| name, slug, icon | text, unique name/slug | icon: a stable identifier for the Section 3 marker icon set |
| sort\_order | int |  |
| is\_active | boolean, default true |  |

2.2 map\_pins
-------------

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid, PK |  |
| slug | text, unique | Server-generated from name; used in the /map/pin/\[slug\] deep link |
| category\_id | uuid, FK → map\_categories.id |  |
| name, description | text |  |
| location | geography(Point, 4326) | PostGIS; set via the Admin map-click picker |
| building\_code | text, nullable | Optional official UPSA building/room code |
| photo\_url | text, nullable | Cloudinary URL, EXIF/location stripped at upload |
| linked\_service\_id | uuid, FK → directory.services.id, nullable | Cross-link to a Student Services Directory listing (TDD §5.2) |
| linked\_album\_id | uuid, FK → gallery.albums.id, nullable | Cross-link to a Campus Gallery album (TDD §5.2) |
| is\_featured | boolean, default false |  |
| status | enum: active, inactive | Only active is publicly shown |
| created\_by | uuid, FK → profiles.id |  |
| deleted\_at | timestamptz, nullable | Soft delete |

3\. Shared Platform Table (referenced, not owned here)
======================================================

public.audit\_logs  
Map writes: "pin.created", "pin.updated", "pin.deactivated"  
  
public.reports — NOT used by this feature (TDD §5.3)  
No user-generated content here to report in Phase 1

4\. Row Level Security
======================

| **Table** | **Read** | **Write** |
| --- | --- | --- |
| map\_categories | Public, where is\_active = true; Admin sees all | Admin only |
| map\_pins | Public, where status = active and deleted\_at is null; Admin sees all | Admin only |

5\. Core Relationships
======================

map\_categories 1─└1 map\_pins ─┄1 profiles (created\_by)  
map\_pins ─┄0..1 directory.services (linked\_service\_id, status-checked at read time)  
map\_pins ─┄0..1 gallery.albums (linked\_album\_id, status-checked at read time)