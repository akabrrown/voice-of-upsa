**PRODUCT REQUIREMENTS DOCUMENT**  
**Anonymous Confessions/Opinions**  
Anonymous student posting for voiceofupsa.com  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0 — Phase 1 (MVP) scope, drafted with explicit judgment calls flagged for review  
**Sequence:** Wave 2, item 3 of 3 — closes out Wave 2  
**Related docs:** TDD · Design Brief · App Flow · Backend Schema

Table of Contents
=================

0\. How to Read This Document
=============================

This is the highest trust-and-safety-risk feature on the whole roadmap, and several scope decisions below are judgment calls made in the absence of a policy discussion — not settled facts. Each one is marked  
**\[DECISION\]** inline so they’re easy to find and challenge before this becomes a TDD commitment. The single most important one is Section 1’s anonymity model — read that first.

1\. Overview
============

Anonymous Confessions/Opinions lets students post short, anonymous text — confessions, opinions, questions — to a campus-wide feed, and react to others’ posts. It is the closest thing on this roadmap to a Yik Yak / campus confession page, and it carries that format’s well-documented risks: harassment, doxxing, self-harm disclosures, and defamation, all amplified by anonymity.  
**\[DECISION\]** This PRD scopes Phase 1 as narrowly as it can while still being recognizably the feature that was asked for: text only, no comments/threads, auto-archiving posts after a set window, and a hybrid moderation model (Section 4). Every one of those is a deliberate risk-reduction cut, not a corner cut for speed — see Section 7 for what’s deferred and why.

2\. Anonymity Model — Read This First
=====================================

**\[DECISION\]** This platform is pseudo-anonymous, not untraceable, and students must be told that plainly rather than left to assume otherwise. A post’s author is hidden from every other student and from ordinary Admin moderation views. The author\_id is still stored server-side, because full untraceability would mean zero recourse against a credible threat, targeted harassment campaign, or content that requires legal escalation — an unacceptable trade-off for a platform tied to real student accounts. Section 6 defines exactly who can ever unmask a post, under what conditions, and how that action is logged.

*   This is standard practice for every real "anonymous" social platform that has survived contact with legal reality (Yik Yak, Whisper, and similar all retained backend identity despite anonymous branding) — Phase 1 follows that precedent rather than promising something the platform can’t safely deliver
*   The UI must say this in plain language at the point of posting, not bury it in a terms-of-service page nobody reads

3\. Goals
=========

1.  Give students a genuine outlet for anonymous expression without turning the platform into an unmoderated liability.
2.  Never let a credible self-harm disclosure or threat pass through silently — flag it for priority review and surface support resources immediately, regardless of the post’s ultimate publish decision.
3.  Make it hard to use this feature to target a specific, identifiable student.
4.  Be honest with students about what "anonymous" does and doesn’t mean here.
5.  Reuse the platform’s existing shared infrastructure (audit log, reports table, Admin shell) rather than inventing feature-specific versions.

4\. User Roles
==============

| **Role** | **Capabilities** |
| --- | --- |
| Visitor | View the public feed — posting requires a signed-in UPSA account, same identity requirement as every other feature |
| User (poster, contextual) | Submit a post anonymously; react to posts; report a post; see the status of their own submissions privately |
| Admin | Moderate the queue, resolve reports, remove posts — sees post content but never the author identity by default |
| Trust & Safety (rare, contextual flag) | The only role that can ever unmask a post’s author, and only with a mandatory logged reason (Section 6) |

5\. Phase 1 Feature Scope
=========================

5.1 Posting
-----------

*   Text only — no images or video (Section 7 explains why)
*   Type: Confession or Opinion; Category: Academics, Campus Life, Relationships, Humor, Serious/Support, Other
*   Character limit kept short (target: 500 characters) — encourages a single thought, discourages long targeted essays about another person
*   A mandatory, unskippable acknowledgment at submission: "This is not fully anonymous — Voice of UPSA can trace serious violations. Don’t name or clearly identify another person."

5.2 Viewing & Reacting
----------------------

*   Public feed, filterable by type and category, sorted newest-first
*   One reaction per user per post (a small fixed set: e.g. Relate, Support, Funny — deliberately not an upvote/downvote pair, to avoid a visible "losing" score on a post that might be a genuine, vulnerable disclosure)
*   No comments or replies in Phase 1 (Section 7)
*   A post auto-archives from the public feed after 14 days — still resolvable by direct link/audit purposes internally, but no longer part of the live, browsable feed

5.3 Reporting
-------------

*   Report reasons: harassment/bullying, identifies a specific person, hate speech, self-harm/crisis content, threat of violence, spam, other
*   self-harm/crisis and threat-of-violence reports route to priority review, ahead of the general queue

6\. Moderation Model
====================

**\[DECISION\]** A hybrid model, not pure pre-publish moderation: a fully pre-moderated "confession wall" tends to feel dead (posting expects to feel close to instant), while fully auto-published-with-only-reactive-reports is too slow to catch the worst content before real harm happens. Phase 1 splits the difference.

*   Every submission passes through automated screening at the moment of posting (Section 5 of the TDD) — a keyword/pattern check for hate speech, threats, self-harm language, contact information (phone numbers, socials — often used to redirect harassment off-platform), and name-like patterns
*   Clears screening → published immediately
*   Flagged by screening → held as Pending Review, with the submitter told plainly "your post is under review" rather than silently vanishing
*   Published posts remain reportable at any time; a report does not immediately hide a post (to prevent report-brigading a legitimate post) except for self-harm/threat reasons, which pull the post from public view immediately pending Admin review, erring toward caution
*   Phase 1’s automated screening is a maintained keyword/pattern list, not a machine-learning moderation model — explicitly scoped as an upgrade path once real volume shows what a keyword list misses (Section 7)

7\. Crisis & Self-Harm Content Handling
=======================================

Anonymous campus platforms are a documented channel through which students disclose real distress, sometimes for the first time. This gets first-class product treatment, not a footnote.

*   A post flagged by the self-harm keyword screen immediately shows the submitter a calm, non-judgmental message with UPSA Counseling Service contact information — pulled live from that service’s Student Services Directory listing (a concrete, working cross-link, not a hardcoded phone number that can go stale)
*   This support message displays regardless of whether the post is ultimately published, rejected, or still pending — the person is never left waiting on a moderation decision to see it
*   The flagged post itself routes to priority human review, never auto-published, given the stakes of getting this wrong in either direction

**\[DECISION\]** This platform surfaces resources and escalates for human review — it does not attempt to be a crisis intervention tool itself, and the product should never be described to students as one. Whether Voice of UPSA wants a live human on the other end of that Admin escalation (and who) is an operational decision outside this document’s scope, but it should be resolved before this feature ships, not after.

8\. Harassment & Identification Safeguards
==========================================

*   Automated name-pattern detection (capitalized multi-word sequences not matching a common-phrase allowlist) flags a post for review rather than blocking submission outright — heuristic and imperfect by nature, treated as a first line of defense, not a guarantee
*   Community guidelines, shown at posting, explicitly prohibit naming or clearly identifying another person in a negative or accusatory way
*   A dedicated report reason — "identifies a specific person" — is fast-tracked, mirroring Campus Gallery’s consent-based report priority
*   Accepted residual risk, stated plainly rather than glossed over: a determined reader can sometimes infer identity from writing style or specific details even without a name, and a published post can always be screenshotted and shared outside the platform. Neither is fully solvable by product design — the response is a short character limit, no comment threads to escalate a callout, and fast, prioritized moderation, not a claim that this is fully prevented

9\. Non-Functional Requirements
===============================

| **Area** | **Requirement** |
| --- | --- |
| Anonymity handling | Author identity is never exposed via any public or standard-Admin query — only the narrow, logged unmask path in Section 6 of the TDD can ever surface it |
| Trust & safety | Self-harm and threat-of-violence flags are treated as priority-one across the whole moderation queue, always reviewed ahead of routine content |
| Honesty | The platform never represents itself as fully anonymous or as a crisis-support service |
| Performance | The feed favors freshness over aggressive caching — a confession wall that feels 10 minutes stale defeats the point of the feature |
| Abuse resistance | Per-user daily posting cap; reaction and report actions rate-limited |

10\. Out of Scope for Phase 1
=============================

**Phase 2** Comments/replies (deferred deliberately — threaded discussion is where pile-on harassment concentrates; revisit once moderation tooling and community norms are established), images/video, a proper ML-based moderation pass replacing the Phase 1 keyword screen  
**Phase 2** "Post of the day" featuring or any algorithmic amplification — amplifying anonymous content editorially raises its own judgment questions better addressed once the moderation model has real operating data behind it  
**Later** Direct messaging between students off the back of a post — explicitly avoided; it would reintroduce exactly the traceable-contact risk the platform is trying to keep out of anonymous interactions

11\. Success Metrics
====================

*   Safety, not just engagement: flag rate, report rate, and time-to-resolution for priority (self-harm/threat) items, tracked separately from routine moderation
*   Crisis flow reach: how often the support-resource message is shown (never tied to or reported alongside any specific student or post, to avoid creating a de facto surveillance metric)
*   Participation: posts and reactions per week, once the above are healthy — deliberately listed last