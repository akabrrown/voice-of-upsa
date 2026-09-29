**TECHNICAL DESIGN DOCUMENT**  
**Notification Centre**  
Architecture, security, and API design — Phase 1  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0  
**Repo structure:** Lives directly in the shared platform layer, not a feature schema (Section 1) — every existing feature becomes a caller, not an owner

Table of Contents
=================

1\. Architecture Overview
=========================

Unlike every feature so far, this has no meaningful feature-local tables of its own — it is the shared table. There is exactly one write path: a single server-side function, notify(), that every other feature calls. No feature ever inserts into the notifications table directly.

| **Layer** | **Choice** | **Notes** |
| --- | --- | --- |
| Frontend | Next.js (App Router) + TypeScript + Tailwind + shadcn/ui | Bell icon + panel in the shared header, available on every page |
| Data fetching | TanStack Query | Notification list and unread count |
| Backend | Next.js Server Actions + Supabase (Postgres, Auth, Realtime) | Realtime pushes new notifications and unread-count updates to an open session |
| Validation | Zod | Shared schema for the notify() function’s payload shape per type |
| Caching | None (deliberate) | Unread count is solved with a well-indexed query, not Redis — this is private per-user data checked on nearly every page load, and a cache layer here would add invalidation complexity for a query that’s already cheap (Section 6) |
| Abuse protection | Arcjet | Rate limiting on the internal notify() call path itself, not just user-facing endpoints — a bug in a calling feature should not be able to flood a student with notifications |
| Deployment | Vercel | Same project as the rest of Voice of UPSA |

2\. Roles & Permission Matrix
=============================

| **Resource** | **User** | **Admin** | **Feature server code** |
| --- | --- | --- | --- |
| Own notifications (read) | Yes | No special access | n/a |
| Any other user’s notifications | No | No | n/a |
| Mark read / mark all read | Own only | n/a | n/a |
| Notification preferences (mute) | Own only | n/a | n/a |
| Trigger a notification (notify()) | No | No | Yes — the only write path into the table (Section 4) |

3\. Threat Model
================

| **#** | **Threat** | **Mitigation** |
| --- | --- | --- |
| T1 | A student reads or marks-read another student’s notifications (IDOR) | RLS keyed to recipient\_id = auth.uid() for every read and update; enforced at the database layer, not just hidden in the UI |
| T2 | A buggy or malicious feature floods a student with notifications | notify() itself is rate-limited per (recipient, type) — the abuse control lives in the shared function every feature must go through, not something each caller has to remember to add |
| T3 | An unrecognized or malformed notification type crashes or breaks the shared panel for every feature, not just the one that sent it | The panel renders via a type→component registry with a mandatory generic fallback — an unknown type always renders as plain text with a timestamp rather than failing (PRD §4.1) |
| T4 | A notification payload leaks more than the recipient should see — most sensitively, anything that could help deanonymize an Anonymous Confessions/Opinions post | Each feature’s Zod payload schema for its own notification types is reviewed at the point that feature integrates — Confessions’ schema is deliberately minimal (decision + reason only, no author-identifying data, no post body echoed back) as a concrete, already-applied example |
| T5 | A feature writes directly to the notifications table, bypassing notify() and its rate limiting/validation | INSERT grant on public.notifications exists only for the notify() function’s execution context (a Postgres function with SECURITY DEFINER), not for the general application role — there is no other path in |

4\. API Surface (Phase 1)
=========================

| **Action** | **Input** | **Notes** |
| --- | --- | --- |
| getNotifications | cursor, unread\_only | Own notifications only (T1) |
| getUnreadCount | — | Indexed, not cached (Section 6) |
| markRead | notification\_id | Owner only |
| markAllRead | — | Owner only |
| updatePreference | category, muted | Owner only |
| notify() (internal, server-only) | recipient\_id, type, payload | The only write path (T5); called by Campus Mart, the Job Board, Gallery, and Confessions’ own server actions — never called from the client |

5\. Data Integrity
==================

### 5.1 notify() is the sole write path

notify(recipient\_id, type, payload):  
validate payload against the Zod schema registered for \`type\`  
check recipient category-mute preference — skip insert if muted  
rate-limit check on (recipient\_id, type)  
INSERT into public.notifications  
push via Supabase Realtime to the recipient’s open session, if any

### 5.2 Read state

read\_at is set once and never cleared — there is no "mark unread" action in Phase 1, keeping the state machine trivial (unread → read, one direction only).

### 5.3 Retention

Unlike audit\_logs and reports, notifications are not part of the trust-and-safety trail — the underlying moderation action already lives in audit\_logs; a notification is just a courtesy copy to the recipient. A Phase 2 cleanup job removing read notifications older than 90 days is a reasonable addition later; Phase 1 simply accumulates, which is fine at current scale.

6\. Performance Strategy
========================

*   Unread count: a single indexed query (WHERE recipient\_id = ? AND read\_at IS NULL), fast enough on every page load without a cache layer — deliberately not using Redis here, in contrast to the Directory and Map’s public-data caching, because this is private per-user data where cache invalidation would cost more than the query itself
*   Cursor-based pagination on the notification list
*   Realtime push for new notifications avoids polling entirely for an open session