**BACKEND SCHEMA**  
**Campus Gallery**  
Database design — Phase 1 tables, relationships, and RLS  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0  
**Engine:** PostgreSQL (Supabase), schema: gallery  
**Note:** Introduces public.reports — the new shared platform table for all report-a-thing flows (see TDD §5.3)

Table of Contents
=================

1\. Conventions
===============

*   Tables live in a dedicated gallery schema, referencing the same shared public.profiles table for identity
*   id uuid PK default gen\_random\_uuid(), created\_at/updated\_at on every table
*   Soft delete via deleted\_at on albums and photos

2\. Tables
==========

2.1 albums
----------

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid, PK |  |
| slug | text, unique | Server-generated from title |
| title, description | text |  |
| category | enum: events, sports, academics, campus\_life, clubs\_societies |  |
| event\_date | date, nullable |  |
| cover\_photo\_id | uuid, FK → photos.id, nullable |  |
| submissions\_open | boolean, default false | Admin toggles per album |
| status | enum: draft, published |  |
| is\_featured | boolean, default false |  |
| created\_by | uuid, FK → profiles.id |  |
| deleted\_at | timestamptz, nullable | Soft delete |

2.2 photos
----------

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid, PK |  |
| album\_id | uuid, FK → albums.id |  |
| image\_url | text | Cloudinary URL, EXIF/location stripped at upload (TDD §5.1) |
| caption | text, nullable |  |
| source | enum: admin, submission |  |
| submitted\_by | uuid, FK → profiles.id, nullable | Null for admin-sourced photos |
| consent\_confirmed | boolean, default false | Required true for any submission (T4); irrelevant/true for admin uploads |
| status | enum: pending\_review, approved, rejected, withdrawn | Admin uploads are created directly as approved |
| sort\_order | int |  |
| deleted\_at | timestamptz, nullable | Soft delete, used for Admin removal of a published photo |

3\. Shared Platform Tables (referenced, not owned here)
=======================================================

public.audit\_logs  
Gallery writes: "photo.approved", "photo.rejected",  
"photo.removed", "album.created", "report.resolved"  
  
public.reports (new — promoted from per-feature report tables)  
id, entity\_type, entity\_id, reporter\_id, reason, details,  
status, resolution\_note, resolved\_by, resolved\_at, created\_at  
Gallery entity\_type: "gallery\_photo"  
reason enum includes: inappropriate, no\_consent, copyright, other

4\. Row Level Security
======================

| **Table** | **Read** | **Write** |
| --- | --- | --- |
| albums | Public, where status = published; Admin sees all | Admin only |
| photos | Public, where status = approved; submitter reads own regardless of status; Admin sees all | Insert: any signed-in user, only when the parent album has submissions\_open = true, and only into pending\_review. Approve/reject/remove: Admin only. Withdraw: submitter, own row, pending\_review only |
| public.reports | Reporter reads own; Admin reads all | Insert: any signed-in user (rate-limited). Resolve: Admin only |

5\. Core Relationships
======================

albums 1─└1 photos ─┄1 profiles (submitted\_by, nullable)  
albums ─┄1 profiles (created\_by, Admin)  
photos ──┄1 public.reports (entity\_type = gallery\_photo)  
photos, albums ──┄1 public.audit\_logs