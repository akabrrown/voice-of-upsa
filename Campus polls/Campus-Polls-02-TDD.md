**TECHNICAL DESIGN DOCUMENT**  
**Campus Polls**  
Architecture, security, and API design — Phase 1  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0  
**Repo structure:** Feature module inside the existing Voice of UPSA repo; reuses Campus Mart’s auth, design system, and Arcjet setup

Table of Contents
=================

1\. Architecture Overview
=========================

Polls is deliberately the thinnest feature in the Wave 1 set — no media pipeline, no payment logic, no multi-party fulfillment. It reuses Campus Mart’s stack wholesale rather than introducing anything new.

| **Layer** | **Choice** | **Notes** |
| --- | --- | --- |
| Frontend | Next.js (App Router) + TypeScript + Tailwind + shadcn/ui | Same design system as Campus Mart |
| Data fetching | TanStack Query | Poll listing and result caching |
| Backend | Next.js Server Actions + Supabase (Postgres, Auth, Realtime) | No Cloudinary, no QStash needed — no media, no async rollups |
| Validation | Zod | Shared client/server schema for poll creation and vote submission |
| Realtime | Supabase Realtime (optional, Phase 1 nice-to-have) | Live-updating result bars as votes arrive on a poll someone is currently viewing |
| Abuse protection | Arcjet | Rate limit on vote submission and poll creation |
| Deployment | Vercel | Same project as the rest of Voice of UPSA |

2\. Roles & Permission Matrix
=============================

| **Resource** | **Visitor** | **User (student)** | **Admin** |
| --- | --- | --- | --- |
| Poll (read) | Yes, if visibility allows | Yes, if visibility allows | Always |
| Poll (create/edit) | No | No | Yes |
| Poll (close/delete) | No | No | Yes |
| Vote (cast) | No | Yes, once per poll | Yes, once per poll (as a student, if desired) |
| Vote (read own) | n/a | Own only — to show "you voted" state | Any (aggregate only, never per-voter identity via public API) |
| Result counts | Per visibility setting | Per visibility setting | Always visible |

3\. Threat Model
================

| **#** | **Threat** | **Mitigation** |
| --- | --- | --- |
| T1 | Student votes twice on the same poll (resubmit, multiple tabs, retry) | Unique constraint on (poll\_id, voter\_id) at the database level; server re-checks before insert regardless of client state |
| T2 | Client submits a fabricated vote count or a vote for an option that doesn’t belong to the poll | Server validates option\_id belongs to poll\_id before insert; counts are never accepted from the client — only a single (poll\_id, option\_id) vote intent |
| T3 | Result tampering by directly updating an option’s vote\_count | vote\_count is mutated only by a DB trigger on poll\_votes insert; the application role has no direct UPDATE grant on that column |
| T4 | Admin edits option text after voting has started, changing what earlier votes meant | Option text is locked once a poll has ≥1 vote or is published; changes require closing the poll and creating a new one |
| T5 | Voter identity exposed, undermining the anonymous-to-peers positioning | poll\_votes.voter\_id exists only to enforce the uniqueness constraint; no read policy ever exposes it outside the voter’s own row (needed only for their own "you voted" state) |
| T6 | Scripted / bot mass-voting to skew a result | Arcjet rate limit on the vote-submission action per user and per IP |
| T7 | Premature result exposure biasing later voters on an "after voting" poll | Visibility rule enforced server-side on the read query itself, not hidden client-side — a visitor’s or not-yet-voted student’s request simply omits the counts |
| T8 | Poll creation spam | Creation restricted to Admin in Phase 1; Arcjet rate limit kept as defense in depth for when Phase 2 opens creation to students |

4\. API Surface (Phase 1)
=========================

| **Action** | **Input** | **Notes** |
| --- | --- | --- |
| getPolls | category, status (active/closed), cursor | Public read; result counts included only where visibility allows for the requesting user |
| getPoll | poll\_id | Includes the caller’s own vote state if signed in |
| castVote | poll\_id, option\_id | Server validates: poll is open, option belongs to poll, no prior vote from this voter\_id (T1, T2) |
| createPoll (Admin) | question, options\[\], category, expires\_at, results\_visibility | Options array length 2–6 |
| closePoll (Admin) | poll\_id | Sets status = closed; also auto-applied by a scheduled check against expires\_at |
| deletePoll (Admin) | poll\_id | Soft delete only — vote history preserved |

5\. Data Integrity
==================

### 5.1 Vote uniqueness

Enforced by a unique constraint on (poll\_id, voter\_id) — the database rejects a second vote even if two requests race each other, not just the application logic.

### 5.2 Derived, trigger-maintained counts

poll\_options.vote\_count is incremented by an AFTER INSERT trigger on poll\_votes. No code path outside that trigger writes to vote\_count.

### 5.3 Poll status

allowed edges:  
draft -> published  
published -> closed (manual, by Admin)  
published -> closed (automatic, when now() > expires\_at)  
closed is terminal — no reopening in Phase 1

6\. Performance Strategy
========================

*   Result rendering reads pre-aggregated vote\_count columns — never a COUNT(\*) over poll\_votes at request time
*   Poll listing cached briefly (same Redis pattern as Campus Mart categories), invalidated on publish/close
*   Optional Supabase Realtime subscription only on the single poll page currently open, not a global listener