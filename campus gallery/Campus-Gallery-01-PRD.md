**PRODUCT REQUIREMENTS DOCUMENT**  
**Campus Gallery**  
Photo albums for voiceofupsa.com  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0 — Phase 1 (MVP) scope  
**Sequence:** Wave 2, item 1 of 3 (Gallery → Campus Map → Anonymous Confessions/Opinions)  
**Related docs:** TDD · Design Brief · App Flow · Backend Schema

Table of Contents
=================

1\. Overview
============

Campus Gallery is a photo album feature organized around events and campus life — matches, orientation week, club activities, graduation, everyday campus moments. Voice of UPSA editorial staff curate official albums, and students can submit their own photos to albums the editorial team opens for submission, giving the gallery a community feel without losing editorial control over what’s published.  
Video is explicitly out of scope here — that’s the separate Campus Video & Voice of UPSA TV feature (Wave 3). Keeping that line clean avoids two features half-solving the same problem.

2\. Goals
=========

1.  Give Voice of UPSA a simple way to publish event photo albums without a separate media tool.
2.  Let students contribute photos to open albums, with every submission reviewed before it’s public — same discipline as every user-generated content path built so far.
3.  Protect student privacy by default — strip location metadata from every uploaded photo, and give anyone shown in a photo a fast way to request its removal.
4.  Reuse the Cloudinary pipeline, moderation pattern, and (new this cycle) a shared reports table rather than building gallery-specific versions of infrastructure that already exists.

3\. User Roles
==============

| **Role** | **Capabilities** |
| --- | --- |
| Visitor / User | Browse and view published albums and approved photos — no login required to view |
| User (submitter, contextual) | Signed-in student submits photos to an album open for submissions; can withdraw their own pending submission; can report a published photo |
| Admin (editorial) | Create/edit/feature albums, upload photos directly, moderate submissions, resolve reports, remove any photo or album |

4\. Phase 1 Feature Scope
=========================

4.1 Visitor / Student (viewing)
-------------------------------

*   Browse albums, filtered by category (Events, Sports, Academics, Campus Life, Clubs & Societies) and sorted newest-first or featured-first
*   Open an album → view photos in a grid, with a full-screen lightbox view
*   Report a photo — including "I’m in this photo and didn’t consent to it being shown"

4.2 Student (submitting)
------------------------

*   On an album marked "Open for submissions," upload one or more photos with an optional caption
*   Must confirm a consent statement before submitting: "I took this photo (or have the right to share it) and everyone clearly identifiable in it is okay with it being shown publicly"
*   Submission enters Pending Review; submitter can see their own submission’s status and withdraw it while still pending
*   Daily submission cap per student per album, to keep the review queue manageable (Section 6)

4.3 Admin
---------

*   Create/edit an album — title, description, category, event date, cover photo, featured flag, and whether it’s currently open for student submissions
*   Upload photos directly into any album — published immediately, no review needed for Admin-sourced content
*   Moderation queue — approve or reject a submitted photo, with a required reason on rejection
*   Resolve reports filed against a published photo, including fast-tracked consent-related reports
*   Remove any photo or album (soft delete)

5\. Non-Functional Requirements
===============================

| **Area** | **Requirement** |
| --- | --- |
| Privacy | Location and device metadata (EXIF) is stripped from every uploaded photo before it’s stored or served — no photo should ever leak where a student lives or was standing when it was taken |
| Trust & safety | No student-submitted photo is publicly visible before Admin approval; a consent-related report is treated as higher priority than a general report |
| Performance | Album and photo grids load progressively with responsive, optimized images — never the original full-resolution file on a listing view |
| Abuse resistance | Submission and reporting are rate-limited; a per-student, per-album daily submission cap prevents queue flooding |
| Mobile | Browsing and the lightbox viewer are the primary mobile experience; submitting is a simple camera-roll picker, not a multi-step wizard |

6\. Trust & Privacy Design
==========================

A photo gallery carries a different risk profile than the text-based Wave 1 features — images can expose people, locations, and moments without their consent, and can’t always be "fixed" after publication the way a piece of text can. Three mechanisms carry the weight here:

*   Mandatory moderation for every submitted photo — no auto-publish path
*   EXIF/location metadata stripped on upload, unconditionally, including for Admin-sourced photos
*   A fast, clearly-labeled consent-based report path, reviewed with priority over general reports

_Deliberately out of scope for Phase 1: automated content moderation (e.g. an AI image-moderation pass before human review) and facial-recognition-based "you appear in this photo" detection — both are real Phase 2 candidates once real submission volume shows whether manual review alone keeps up._

7\. Out of Scope for Phase 1
============================

**Cut** Video/reels — owned entirely by Campus Video & Voice of UPSA TV (Wave 3); Gallery stays photo-only to keep that boundary clean  
**Phase 2** Automated image moderation pass, likes/reactions on photos, downloadable/shareable album exports, student-created (not just Admin-created) albums  
**Later** Face-tagging or any identity-matching feature — deliberately avoided given the consent risks already present in a plain photo gallery

8\. Success Metrics
===================

*   Participation: student submissions per open album
*   Trust: consent-related report volume and resolution time, tracked separately from general reports
*   Editorial output: albums published per month