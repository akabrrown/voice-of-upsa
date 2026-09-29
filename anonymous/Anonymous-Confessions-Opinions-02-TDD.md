**TECHNICAL DESIGN DOCUMENT**  
**Anonymous Confessions/Opinions**  
Architecture, security, and API design — Phase 1  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0  
**Repo structure:** Feature module inside the existing Voice of UPSA repo; reuses the shared audit log and reports table; introduces a new content-screening layer and a new shared-table column

Table of Contents
=================

1\. Architecture Overview
=========================

Reuses the platform’s established stack, plus one new piece of infrastructure this feature specifically needs: a content-screening step between submission and publish.

| **Layer** | **Choice** | **Notes** |
| --- | --- | --- |
| Frontend | Next.js (App Router) + TypeScript + Tailwind + shadcn/ui | Same design system as every prior feature, deliberately understated (Design Brief §2) |
| Data fetching | TanStack Query | Feed pagination; short/no cache TTL (Section 6) |
| Backend | Next.js Server Actions + Supabase (Postgres, Auth) | No Realtime needed for Phase 1 — feed refresh is pull-based |
| Validation | Zod | Shared client/server schema for submission, including the mandatory acknowledgment field |
| Content screening | A maintained keyword/pattern service (new, Phase 1) | Regex/keyword matching against hate speech, threat, self-harm, contact-info, and name-like patterns; built as a single pluggable function so a proper moderation API can replace it later without touching the rest of the flow (PRD §6) |
| Abuse protection | Arcjet | Rate limiting on submission, reaction, and reporting |
| Audit | Shared public.audit\_logs | Every moderation decision AND every unmask action writes here — the unmask write is the most tightly specified of any audit entry on the platform (Section 5.2) |
| Deployment | Vercel | Same project as the rest of Voice of UPSA |

2\. Roles & Permission Matrix
=============================

| **Resource** | **Visitor** | **User (poster)** | **Admin** | **Trust & Safety (rare flag)** |
| --- | --- | --- | --- | --- |
| Feed (read, published) | Yes | Yes | Yes, plus pending | Yes |
| Post (submit) | No | Yes | n/a | n/a |
| Post author identity | Never | Own only | Never, by default | Yes — only via the logged unmask action |
| Post (approve/reject/remove) | No | No | Yes | Yes |
| Reactions | No | Yes, one per post | Yes | Yes |
| Reports (create) | No | Yes | n/a | n/a |
| Reports (resolve) | No | No | Yes | Yes |
| Unmask a post’s author | No | No | No | Yes, with a mandatory reason (Section 5.2) |

**\[DECISION\]** can\_unmask\_anonymous\_posts is a boolean flag on the shared public.profiles table, granted out-of-band (directly in the database, not through any Admin UI toggle) — consistent with the two-role-plus-contextual-flags model used everywhere else, but deliberately not self-service even for existing Admins, given what the flag unlocks.

3\. Threat Model
================

The richest threat model on the roadmap so far, reflecting the feature’s risk profile rather than its technical complexity — most of these are policy-and-process mitigations as much as code.

| **#** | **Threat** | **Mitigation** |
| --- | --- | --- |
| T1 | A post contains a credible self-harm disclosure and is missed or mishandled | Automated screening flags self-harm language before publish; the submitter sees support resources immediately regardless of publish decision; the post itself is held for priority human review, never auto-published (PRD §7) |
| T2 | A post names or clearly identifies another student in a harmful or accusatory way | Name-pattern screening flags the post for review; community guidelines shown at posting explicitly prohibit this; a dedicated, fast-tracked report reason exists post-publish (PRD §8) — accepted as a harm-reduction measure, not a guarantee, given the heuristic’s inherent limits |
| T3 | A post contains a credible threat of violence | Same priority-review path as self-harm content; a threat-of-violence report also immediately pulls the post from public view pending review, erring toward caution over false-positive inconvenience |
| T4 | The author identity field is exposed through a bug, a misconfigured query, or an over-broad Admin view | author\_id is excluded from every standard SELECT the application issues for Admin or public views by construction — it is only ever readable through the single, separately-audited unmask query path (Section 5.2), not a permission check bolted onto the general read path |
| T5 | The rare unmask permission is granted too broadly, or used without real justification | Granting the flag is a manual, out-of-band database action — never exposed in the Admin UI; every use of it requires a non-empty, stored justification and writes a distinctly-typed audit\_logs entry, making the action itself auditable independent of its outcome |
| T6 | Report-brigading used to get a legitimate, non-violating post pulled | Reports do not auto-hide a post except for the two priority reasons (self-harm, threat) where erring toward caution is the deliberate policy — every other report reason requires Admin review before any action |
| T7 | Reaction/vote manipulation (a single user inflating a post’s visibility) | Unique constraint on (post\_id, user\_id) for reactions, same integrity pattern as Campus Polls’ vote uniqueness |
| T8 | Submission flooding / spam | Per-user daily posting cap, enforced server-side; Arcjet rate limiting on submit/react/report |
| T9 | A published post is screenshotted and shared outside the platform, or a reader infers identity from writing style without a name being used | Accepted residual risk, stated plainly rather than papered over (PRD §8) — mitigated only indirectly, by the short character limit and the absence of comment threads that would otherwise let a callout escalate |
| T10 | SQL injection or pattern-matching abuse via submitted text | Screening and search both use parameterized queries; the keyword/pattern matcher runs against sanitized input, never raw string interpolation into a query |

4\. API Surface (Phase 1)
=========================

| **Action** | **Input** | **Notes** |
| --- | --- | --- |
| getFeed | type, category, cursor | Public; only status = published and not archived; author fields never included |
| getMyPosts | — | Caller’s own submissions and their status; author identity implicit to the caller, not exposed to anyone else |
| submitPost | type, category, body\_text, acknowledgment\_confirmed | Runs content screening synchronously before insert; acknowledgment\_confirmed must be true (T2, PRD §5.1) |
| reactToPost | post\_id, reaction\_type | Enforces one reaction per (post, user) |
| reportPost | post\_id, reason, details | self\_harm and threat reasons trigger immediate visibility pull (T3, T6) |
| reviewPost (Admin) | post\_id, decision, note | Approve/reject a screened-and-held post; writes audit log |
| resolveReport (Admin) | report\_id, resolution, note | Writes audit log |
| unmaskPost (Trust & Safety only) | post\_id, reason (mandatory, freetext) | The single most tightly audited action on the platform (Section 5.2) — rejected outright if reason is empty |

5\. Data Integrity
==================

### 5.1 Post status transitions

allowed edges:  
pending\_review -> published, rejected (screening or Admin decision)  
published -> hidden\_pending\_review (self-harm/threat report only, T3/T6)  
hidden\_pending\_review -> published, removed (Admin decision)  
published -> archived (automatic, 14 days after publish)  
published -> removed (Admin, any other resolved report)

### 5.2 Unmask action — the strictest write path on the platform

unmaskPost(post\_id, reason):  
requires: caller.can\_unmask\_anonymous\_posts = true  
requires: reason is non-empty  
writes public.audit\_logs with:  
action = "post.unmasked"  
actor\_id, resource\_id = post\_id, metadata = { reason }  
returns author\_id to the caller only after the audit write succeeds  
— no unmask read ever happens without a corresponding audit row

### 5.3 Reports — shared table, feature-specific priority reasons

Writes into the same public.reports table promoted during Campus Gallery, with entity\_type = "confession\_post". The self\_harm and threat reason values are the first report reasons on the platform to trigger an automatic state change (hiding the post) rather than purely queuing for review — a deliberate, narrow exception to the "reports never auto-act" rule used everywhere else (Campus Mart, Job Board, Gallery), justified by the asymmetry of harm if this specific category is left live pending review.

6\. Performance Strategy
========================

*   The feed intentionally favors freshness over caching — little to no Redis TTL on the main feed query, unlike the Directory and Map’s aggressive caching, because a confession wall that lags behind real posting activity undermines the entire premise of the feature
*   Cursor-based pagination on the feed
*   Content screening runs synchronously at submission time (a single-digit-millisecond regex pass, not a network call in Phase 1), so it doesn’t introduce a noticeable delay before publish
*   Archived posts are excluded from the main feed query via a simple indexed status filter, not a scheduled sweep job