**PRODUCT REQUIREMENTS DOCUMENT**  
**AI Assistant**  
Platform-wide assistant for voiceofupsa.com  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0 — Phase 1 (MVP) scope, drafted with explicit judgment calls flagged for review  
**Sequence:** Wave 3, item 3 of 3 — closes the full original roadmap  
**Related docs:** TDD · Design Brief · App Flow · Backend Schema

Table of Contents
=================

0\. How to Read This Document
=============================

Like Anonymous Confessions/Opinions, this feature has several scope decisions made without a policy discussion — marked  
**\[DECISION\]** inline. The two that matter most: what the assistant is allowed to touch (Section 2) and what it’s explicitly not allowed to do (Sections 1 and 7).

1\. Overview
============

The AI Assistant is a platform-wide, conversational way to find things across everything already built — Campus Mart products, Student Services Directory listings, Job/Internship postings, Campus Polls, Podcasts, and Campus Video/TV — plus a narrower writing helper for Campus Mart sellers drafting product descriptions. It is the last item on the original feature list, and deliberately the last one built: it is only useful once there is real content across the platform for it to search and help with.  
**\[DECISION\]** This ships as a retrieval and assistance tool, never an agent that takes action on a student’s behalf. It can help someone find a product, a service, or a job posting, and it can help a seller word a description — it never places an order, submits a posting, casts a vote, or posts a confession for anyone. Agentic actions are a meaningfully bigger trust surface and are deliberately out of scope here, not merely deferred by default.

2\. What the Assistant Can See
==============================

**\[DECISION\]** The assistant’s data access mirrors what a signed-in student could already see themselves — the same Row Level Security scope as a normal session, never an elevated or service-role view. It is a faster way to find public, already-approved content, not a new privilege.

*   In scope: approved Campus Mart products, active Student Services Directory listings, approved Job/Internship postings, published Campus Polls (questions and results, not individual votes), published Podcasts and Campus Video/TV episodes, active Campus Map pins

**\[DECISION\]** Explicitly excluded: Anonymous Confessions/Opinions, in full, even though the feed is nominally public. Confessions was deliberately designed with a short archive window and no algorithmic amplification specifically to limit how discoverable and compilable any one post becomes — an AI assistant that can search and summarize that feed works directly against that design. This exclusion should be revisited only as its own deliberate decision, not folded in here by default.

*   Also excluded: any private data — other students’ orders, private messages, another seller’s draft listings, wallet/financial information once that exists

3\. Goals
=========

1.  Help a student find something across the whole platform in one place, in plain language, instead of knowing which of seven features to search.
2.  Help a Campus Mart seller word a product description from facts they supply, without ever inventing a claim they didn’t give it.
3.  Never present a fabricated answer as fact — ground every platform-content answer in what’s actually stored, and say plainly when it doesn’t know rather than guess.
4.  Handle a self-harm or crisis-adjacent message the same way Confessions does — surface real support resources immediately, never attempt to counsel.
5.  Keep cost and data exposure bounded from day one, not discovered after launch.

4\. User Roles
==============

| **Role** | **Capabilities** |
| --- | --- |
| Visitor | Can chat with the assistant about public platform content — no login required for basic search/Q&A |
| User (student) | Same as Visitor; a verified seller additionally gets the product-description helper inside their own Campus Mart seller dashboard |
| Admin | No special assistant capabilities in Phase 1 (Section 7) |
| Log reviewer (rare, contextual flag) | The only role that can read stored assistant query logs, and only for abuse investigation (Section 6 of the TDD) |

5\. Phase 1 Feature Scope
=========================

5.1 General Assistant
---------------------

*   A site-wide chat entry point, available on every page
*   Answers questions grounded in the in-scope content from Section 2 — "where can I get counseling," "any internships in marketing," "what’s the cheapest laptop bag on Campus Mart," "when does the housing poll close"
*   Returns real links to the relevant page(s) alongside its answer, not just prose — the answer should always be checkable against the actual listing
*   Declines, plainly, when a question falls outside what it can see or verify — rather than guessing at UPSA policy, deadlines, or facts it has no record of

5.2 Seller Copy Helper
----------------------

*   Available inside the Campus Mart seller product form only
*   Seller supplies the facts (what the product is, condition, key features, price) and the assistant drafts a description and a short marketing caption from exactly those facts

**\[DECISION\]** Directly carrying forward Campus Mart’s own original concept brief: "AI should not be allowed to invent important factual product information." The helper wordsmiths what the seller gives it; it never adds a spec, a claim, or a comparison the seller didn’t supply.

6\. Crisis-Adjacent Messages
============================

This is a general chat surface, not the Confessions moderation pipeline — but the same possibility exists here that someone types something indicating real distress.

*   The same keyword-based detection Confessions uses triggers here too: a self-harm/crisis-flagged message immediately gets the UPSA Counseling Service contact information, pulled live from its Student Services Directory listing — the same cross-link, reused rather than reinvented
*   The assistant does not attempt to continue a counseling-style conversation afterward — it surfaces the resource and stops, consistent with how Confessions describes its own support message

7\. Out of Scope for Phase 1
============================

**Cut** Any agentic action on the student’s behalf (placing an order, submitting a job posting, voting, posting a confession) — see Section 1  
**Cut** Anonymous Confessions/Opinions as a retrieval source — see Section 2  
**Phase 2** Persistent, cross-session chat history tied to a student’s account (Phase 1 keeps conversation context for the current session only — Section 5 of the TDD), an Admin-facing moderation-assistant mode, voice input, non-English language support  
**Later** Personalized recommendations based on a student’s browsing/order history — deliberately not built into Phase 1 given the extra data-use question it would raise on top of everything else here

8\. Success Metrics
===================

*   Usefulness: proportion of assistant answers that link to a real, relevant result, versus a "I don’t have information about that" decline
*   Safety: zero incidents of a fabricated factual claim presented as authoritative; zero incidents of a crisis-flagged message going unhandled
*   Cost: average and peak per-student query cost tracked against a set budget ceiling, not discovered after the bill arrives
*   Adoption: query volume, and seller adoption of the copy helper