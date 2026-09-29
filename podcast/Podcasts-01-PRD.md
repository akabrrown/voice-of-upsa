**PRODUCT REQUIREMENTS DOCUMENT**  
**Podcasts**  
Audio shows and episodes for voiceofupsa.com  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0 — Phase 1 (MVP) scope  
**Sequence:** Wave 3, item 1 of 3 (Podcasts → Campus Video/TV → AI assistant)  
**Related docs:** TDD · Design Brief · App Flow · Backend Schema

Table of Contents
=================

1\. Overview
============

Podcasts gives Voice of UPSA a home for audio shows — interviews, campus discussions, student spotlights — with in-browser listening and a standards-compliant RSS feed per show so episodes can also be found on Spotify, Apple Podcasts, and any other podcast app. It is entirely Admin-authored content in Phase 1, the same trust posture as the Campus Map: no student submissions, no moderation queue.  
This is deliberately the first Wave 3 feature, ahead of Campus Video/TV, because audio hosting is the simpler version of the same underlying problem — getting the media pipeline, streaming, and public feed pattern right here means Video/TV can reuse it rather than solving it twice.

2\. Goals
=========

1.  Give Voice of UPSA a simple way to publish episodes under one or more shows, each behaving like a real, independent podcast.
2.  Produce a valid RSS feed per show that Spotify for Podcasters, Apple Podcasts, and other directories will actually accept — this is a hard technical requirement, not a nice-to-have (Section 6).
3.  Let students listen in-browser without friction, with working scrub/seek on the audio player.
4.  Reuse Cloudinary for audio hosting rather than introducing a second media provider, extending the pipeline this platform already relies on.
5.  Keep this feature’s trust-and-safety footprint minimal, consistent with its Admin-only content model — the effort here goes into media and feed correctness, not moderation.

3\. User Roles
==============

| **Role** | **Capabilities** |
| --- | --- |
| Visitor / User | Browse shows and episodes, listen in-browser, subscribe via RSS or an external podcast app link — no login required |
| Admin (editorial) | Create/edit shows, upload and publish episodes, add show notes and an optional transcript |

4\. Phase 1 Feature Scope
=========================

4.1 Public (no login required)
------------------------------

*   Browse shows, each with its own category, cover art, and description
*   Browse a show’s episodes, newest first, with episode number/season shown where set
*   Play an episode in-browser — a simple player with working seek/scrub
*   Read show notes per episode, and a transcript where the Admin has provided one
*   Subscribe via a copyable RSS URL, or tap through to "Listen on Spotify" / "Listen on Apple Podcasts" once the show is submitted to those directories (Section 6)

4.2 Admin
---------

*   Create/edit a show — title, description, cover art, category, and the iTunes-specific metadata directories require (author name, explicit-content flag)
*   Upload an episode — audio file, title, show notes, episode/season number, optional transcript
*   Publish/unpublish an episode; feature a show or episode
*   Deactivate a show (hides it and its feed) or soft-delete an episode

5\. Non-Functional Requirements
===============================

| **Area** | **Requirement** |
| --- | --- |
| Feed correctness | Every show’s RSS feed validates against standard podcast RSS requirements (the iTunes namespace tags directories expect) — a feed that fails validation is effectively invisible to the platforms it’s meant to reach |
| Streaming quality | Audio is served in a way that supports byte-range requests, so a listener can seek/scrub without downloading the whole episode first |
| Performance | Show and episode listings are cached, since this content changes on the order of a publish schedule, not minutes — same posture as the Directory and Map |
| Accessibility | A transcript field is supported (optional in Phase 1, Section 7) so episodes aren’t audio-only for students who are deaf or hard of hearing, or who simply prefer reading |
| Content hygiene | Show notes support basic formatting but are sanitized before render — no raw HTML/script execution from an Admin-entered field |

6\. RSS & Podcast Directory Requirements
========================================

This is the one place in the whole roadmap where "shipped" means passing an external validator, not just working in our own UI. A podcast RSS feed that’s merely well-formed XML but missing the right namespace and tags will be silently rejected or poorly displayed by Spotify and Apple Podcasts.

*   Each show gets its own feed at a stable, public URL — one show is one podcast, matching how every directory expects to ingest them
*   Feed includes the standard RSS 2.0 fields plus the iTunes podcast namespace: itunes:author, itunes:image, itunes:category, itunes:explicit, itunes:duration per episode, and a valid enclosure tag pointing at the actual audio file
*   Feed is regenerated (or served dynamically) on every request from the same published-episode data students see in-browser — never a separately maintained copy that can drift out of sync
*   Submitting each show’s feed URL to Spotify for Podcasters and Apple Podcasts Connect is a one-time manual operational step per show, outside this document’s scope, but the feed itself must be correct before that submission will succeed

7\. Out of Scope for Phase 1
============================

**Phase 2** Auto-transcription (a natural fit for Gemini 1.5 Flash, already named in the standing AI/ML stack, once this feature and the eventual AI assistant both exist), a persistent mini-player that survives page navigation, "follow this show" with a Notification Centre integration for new-episode alerts  
**Later** Listener comments or reactions on an episode — deliberately not added; this is Admin-authored content and doesn’t need the moderation surface a comments feature would introduce

8\. Success Metrics
===================

*   Reach: episode plays in-browser vs. RSS/external-app subscribers, tracked separately since they represent different distribution channels
*   Feed health: successful validation against podcast RSS requirements for every published show, checked before each directory submission
*   Output: episodes published per month, per show