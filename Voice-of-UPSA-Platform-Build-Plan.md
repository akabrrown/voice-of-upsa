**BUILD PLAN**  
**Voice of UPSA Platform**  
Dependencies, build order, and open decisions across all 11 feature suites  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Covers:** Campus Mart, Campus Polls, Student Services Directory, Job/Internship Board, Campus Gallery, UPSA Campus Map, Anonymous Confessions/Opinions, Notification Centre, Podcasts, Campus Video/TV, AI Assistant  
**Basis:** The 55 Phase 1 documents already delivered (5 per suite). Sizes below are relative estimates, not time commitments

1\. The Main Recommendation
===========================

Build the shared infrastructure first, before any feature. Several suites describe migrating a feature-scoped table into a shared one (Campus Mart’s audit log, reports, and notifications; the Job Board’s job\_reports). Those migrations only exist because the documents were written in an order that discovered the shared needs one feature at a time.  
If none of those Campus Mart or Job Board tables have been created yet, skip the migrations entirely: create public.audit\_logs, public.reports, and public.notifications once in Phase 0, and amend the Campus Mart and Job Board schemas so they never create their own copies (Section 6). If any of them already exist in production, the migrations in the Notification Centre and Gallery documents still apply.

2\. Shared Infrastructure Inventory
===================================

| **Component** | **First defined in** | **Used by** | **Phase 0 action** |
| --- | --- | --- | --- |
| public.profiles (extended) | Campus Mart | Every feature | Create with is\_seller, seller\_status, whatsapp\_number, is\_admin. The two sensitive flags are added by their own features (Section 6) |
| public.audit\_logs | Directory | Every Admin-authored or moderated feature | Create once, INSERT-only for the application role |
| public.reports | Gallery | Campus Mart, Job Board, Gallery, Confessions, Video | Create once; settle the reason vocabulary first (Section 5, decision 8) |
| public.notifications + notify() | Notification Centre | Campus Mart, Job Board, Gallery, Confessions | Create table, preferences, SECURITY DEFINER function, header bell |
| Cloudinary upload preset | Campus Mart; EXIF rule set by Gallery | Mart, Gallery, Directory, Map, Podcasts, Video | Configure signed uploads with metadata stripping and per-type size caps |
| Arcjet, Upstash Redis, QStash | Campus Mart | Nearly all | Provision once; rate-limit and cache helpers reused per feature |
| Admin shell | Campus Mart (open question) | Every feature’s admin screens | Confirm whether voiceofupsa.com already has one to extend (Campus Mart PRD open question) |
| Design tokens (palette, shadcn/ui theme) | Campus Mart Design Brief | Every feature | Set up once; every later Design Brief reuses it unchanged |

3\. Dependency Map
==================

"Hard" means the feature cannot ship correctly without it. "Soft" means it works alone but a planned link or hook needs the other feature to exist.

| **Feature** | **Hard dependencies** | **Soft dependencies** |
| --- | --- | --- |
| Student Services Directory | Phase 0 | Must contain a verified Counseling listing before Confessions or the AI Assistant go live |
| Campus Polls | Phase 0 | None |
| Campus Mart | Phase 0 (audit, reports, notifications, Cloudinary, Arcjet, QStash) | AI Assistant’s seller copy helper plugs into its product form later |
| Job/Internship Board | Phase 0 (notify, reports) | Static link from the Directory’s Careers listing |
| Campus Gallery | Phase 0 (Cloudinary EXIF rule, reports, notify) | None |
| UPSA Campus Map | Directory and Gallery tables (pins hold foreign keys to both) | Alternatively add the two link columns in a later migration and build the Map earlier |
| Anonymous Confessions/Opinions | Phase 0 (reports with auto-hide reasons, notify, audit); Directory Counseling listing; policy sign-offs (Section 5) | None |
| Podcasts | Phase 0 (Cloudinary, audit) | Establishes the feed Route Handler pattern Video reuses |
| Campus Video/TV | Phase 0 (Cloudinary EXIF rule, reports, audit); upload caps decided | Podcasts (pattern reuse, not a data dependency) |
| AI Assistant | Content worth searching from the other features; Directory Counseling listing; spend ceiling decided | reindexContent() hooks added as each feature ships (Section 7) |

4\. Recommended Build Order
===========================

| **Step** | **Build** | **Size** | **Why here** |
| --- | --- | --- | --- |
| 0 | Foundations (Section 2) | M | Everything else assumes these exist; doing it first removes every migration |
| 1a | Student Services Directory | S | Simplest real feature; proves the audit-log and Admin patterns; seeds the Counseling listing that Confessions and the AI Assistant later depend on |
| 1b | Campus Polls | S | Smallest feature; exercises the vote-uniqueness and trigger patterns cheaply. Can run alongside 1a |
| 2 | Campus Mart | L | The flagship and by far the largest. It only needs Phase 0, so it can start in parallel with step 1 if there is capacity |
| 3a | Job/Internship Board | M | Reuses the moderation-queue pattern Mart just built; a small, contained place to verify notify() on approve and reject |
| 3b | Campus Gallery | M | Must precede the Map (foreign key); first use of a priority report reason (no\_consent) |
| 4a | UPSA Campus Map | S | Needs the Directory and Gallery tables to exist |
| 4b | Anonymous Confessions/Opinions | M plus policy work | Do not start until decisions 1 to 4 in Section 5 are made; the code is the smaller part of this feature |
| 5a | Podcasts | M | Builds the feed and audio pipeline once |
| 5b | Campus Video/TV | M | Reuses 5a; watch Cloudinary cost from the first upload |
| 6 | AI Assistant | L | Last on purpose: needs real content across the platform, and the hooks from Section 7 should already be in place |

5\. Decisions Needed Before Building
====================================

Most of these are policy or operational questions rather than technical ones. The \[DECISION\] tags in the Confessions and AI Assistant PRDs cover the ones I made provisionally; nothing there is locked until you confirm it.

| **#** | **Decision** | **Blocks** |
| --- | --- | --- |
| 1 | Confirm the pseudo-anonymous model for Confessions, and the exact wording students see about it | Confessions |
| 2 | Who staffs the moderation queue, including priority self-harm and threat items, and whether a live person responds to those escalations | Confessions go-live; also the AI Assistant’s crisis path |
| 3 | Which named individuals hold can\_unmask\_anonymous\_posts, under what written policy | Confessions |
| 4 | Counseling Service listing: verified contact details and who keeps them current | Confessions and AI Assistant go-live |
| 5 | AI Assistant: daily spend ceiling, 30-day log retention, and the Gallery exclusion | AI Assistant |
| 6 | Video: maximum duration and file size, and the Cloudinary usage level that triggers an upgrade | Campus Video/TV |
| 7 | Campus Mart PRD open questions: existing Admin shell, where reports route, the campus delivery location list | Campus Mart, and Phase 0 for the Admin shell |
| 8 | public.reports vocabulary: one shared list of entity types and reasons, stored as text with an application-level registry (as notifications does) or as extended enums | Phase 0 |
| 9 | Mapbox public token restricted to the Voice of UPSA domains before launch | UPSA Campus Map |
| 10 | Terms, privacy notice, and consent wording for photos, video, anonymous posting, and AI query logging | Gallery, Video, Confessions, AI Assistant |

_On decision 10: several features collect or expose personal data (phone numbers, student index numbers, photos, video, anonymous-post identity records, AI query logs). It is worth confirming with someone qualified whether Ghana’s Data Protection Act, 2012 (Act 843) creates registration or consent obligations for the platform. This plan does not assess that, and I am not a lawyer._

6\. Document Reconciliation
===========================

Small edits to already-delivered documents so they agree with each other, assuming the Section 1 recommendation is adopted.

| **Document** | **Change** |
| --- | --- |
| Campus Mart Backend Schema | Remove the notifications, reports, and audit\_logs tables from the mart schema; reference the shared public tables instead |
| Job Board Backend Schema | Replace jobs.job\_reports with public.reports, entity\_type "job\_posting" |
| Campus Mart and Job Board TDDs | Point their audit and report references at the shared tables |
| public.reports across suites | Align the reason lists used by Mart, Job Board, Gallery, Video, and Confessions into the single vocabulary from decision 8 |
| public.profiles | Final column list: is\_seller, seller\_status, whatsapp\_number, is\_admin, plus can\_unmask\_anonymous\_posts (added when Confessions ships) and can\_review\_assistant\_logs (added when the AI Assistant ships) |
| Campus Map Backend Schema | If built before the Gallery, make linked\_album\_id a plain nullable column and add the foreign key in a later migration |

7\. Integration Hooks: Add Them As Each Feature Is Built
========================================================

Two suites describe follow-up wiring in features that already exist. That wiring is cheaper if it is written in when each feature is built rather than retrofitted at the end.

### 7.1 notify() calls

| **Feature** | **Action that should call notify()** | **Payload note** |
| --- | --- | --- |
| Campus Mart | Order status change, product approved/rejected, low stock | Replaces its own notification inserts |
| Job Board | reviewPosting (approve or reject) | Include the rejection reason |
| Campus Gallery | reviewSubmission (approve or reject) | Include the rejection reason |
| Confessions | reviewPost (approve or reject) | Decision and reason only; nothing that helps correlate a post to its author |

### 7.2 reindexContent() calls

| **Feature** | **Trigger** |
| --- | --- |
| Campus Mart | Product approved, edited, or unpublished |
| Student Services Directory | Service created, edited, or deactivated |
| Job Board | Posting approved or closed |
| Campus Polls | Poll published or closed |
| Podcasts and Video/TV | Episode or video published or unpublished |
| Campus Map | Pin created, edited, or deactivated |

Two details worth knowing. First, the Job Board treats "expired" as computed at read time, so no event fires when a posting expires — but the assistant’s retrieval joins back to each source table under the caller’s access rules, so a stale index row for an expired posting simply returns nothing. Second, Confessions and Campus Gallery deliberately have no reindexContent() call.

8\. Cost Watch-List
===================

| **Service** | **What drives cost** | **Control already designed** |
| --- | --- | --- |
| Cloudinary | Video bandwidth and storage (Video/TV), then audio and images | Upload caps at signature time; documented upgrade trigger (decision 6) |
| Gemini / Groq | Every AI Assistant request | Per-user rate limits and a global daily spend ceiling (decision 5) |
| Mapbox | Map loads | Domain-restricted token; MapLibre as the open-source fallback |
| Supabase, Upstash, Vercel | Free-tier limits across all features combined | Free-tier-first with upgrade triggers; worth reviewing after each step in Section 4 rather than only at the end |