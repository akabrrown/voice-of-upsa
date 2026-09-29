**TECHNICAL DESIGN DOCUMENT**  
**AI Assistant**  
Architecture, security, and API design — Phase 1  
**Prepared for:** Voice of UPSA  
**Prepared by:** Codey Dev — Aka Brown  
**Version:** 1.0  
**Repo structure:** Feature module inside the existing Voice of UPSA repo; reads from every prior feature’s public data, writes to none of it

Table of Contents
=================

1\. Architecture Overview
=========================

A retrieval-augmented generation (RAG) design: the assistant never answers platform-content questions from the model’s own general knowledge — it retrieves matching records from the platform’s own public data first, then has the model write an answer grounded in exactly those records. Every model named below is already part of the standing AI/ML stack.

| **Layer** | **Choice** | **Notes** |
| --- | --- | --- |
| Frontend | Next.js (App Router) + TypeScript + Tailwind + shadcn/ui | A site-wide chat widget, same shell pattern as the Notification Centre’s bell |
| Primary model | Gemini 1.5 Flash | Named in the standing AI/ML stack as the fast, multimodal option; chosen here for latency and cost over a heavier model |
| Fallback model | Groq (Llama 3 70B) | Also in the standing stack; used if the primary model is unavailable — a documented fallback tier, with Ollama as a further offline option deliberately not built in Phase 1 |
| Semantic search | pgvector on Postgres | Standing stack choice; one unified index across every in-scope content type (Section 5.1) |
| Backend | Next.js Server Actions + Supabase (Postgres, Auth) | No Realtime needed — responses stream over a standard request |
| Validation | Zod | Shared schema for assistant requests and the seller copy helper’s structured input |
| Abuse & cost protection | Arcjet | Per-user and per-IP rate limits on every assistant endpoint — the direct cost-control lever for a feature where each request costs real money (T5) |
| Audit | Shared public.audit\_logs | Log-reviewer access to stored queries writes here (Section 6) |
| Deployment | Vercel | Same project as the rest of Voice of UPSA |

2\. Roles & Permission Matrix
=============================

| **Resource** | **Visitor** | **User** | **Seller (verified)** | **Log reviewer (rare flag)** |
| --- | --- | --- | --- | --- |
| General assistant (chat) | Yes, rate-limited | Yes, rate-limited | Yes | n/a |
| Seller copy helper | No | No | Yes, inside own product form only | n/a |
| Retrieval scope | Public data only | Public data only (same RLS as a normal session) | Same | n/a |
| Read stored query logs | No | No | No | Yes, with a mandatory logged reason (Section 6) |

**\[DECISION\]** can\_review\_assistant\_logs follows the same pattern as Confessions’ can\_unmask\_anonymous\_posts: a boolean flag on the shared public.profiles table, granted out-of-band in the database (never through an Admin UI toggle), with every use writing a distinctly-typed audit\_logs entry that requires a stored reason. Reused deliberately rather than inventing a second mechanism for the same kind of sensitive, rarely-needed access.

3\. Threat Model
================

A different shape from any prior feature: the interesting risks are specific to LLM applications, not the classic web-app set.

| **#** | **Threat** | **Mitigation** |
| --- | --- | --- |
| T1 | Prompt injection through retrieved content — a product description, job posting, or show note crafted to contain instructions ("ignore previous instructions and…") that the assistant then follows when it retrieves that record as context | Retrieved records are always framed to the model as untrusted reference data, never as instructions; the system prompt explicitly tells the model to ignore any instruction-like text inside retrieved content; the assistant has no write or action capability to abuse even if an injection partly succeeded (PRD §1) |
| T2 | The assistant surfaces data a student shouldn’t be able to see, because retrieval bypassed Row Level Security | Retrieval queries execute under the caller’s own authenticated context, never a service-role connection — the assistant can only ever return what that user could already query directly (PRD §2) |
| T3 | The assistant states a plausible-sounding but false fact about UPSA as if authoritative (a wrong deadline, a wrong contact number) | Answers to platform-content questions are grounded only in retrieved records; when retrieval returns nothing relevant, the response is a plain "I don’t have information about that," never a model-generated guess |
| T4 | A self-harm or crisis-adjacent message is mishandled or answered with improvised advice | A deterministic keyword/pattern check runs on every incoming message before the model is called; a match short-circuits the normal flow and returns the live-linked Counseling Service resource directly — the model is not asked to improvise a response to a crisis (PRD §6) |
| T5 | Query flooding or scripted abuse runs up model API cost | Arcjet per-user and per-IP rate limits; a global daily spend ceiling that disables the assistant gracefully ("temporarily unavailable") rather than silently overspending |
| T6 | The seller copy helper invents specifications, claims, or comparisons the seller never provided, misleading buyers | The helper’s prompt is constrained to the seller’s structured input fields only, and instructed never to add facts; output is shown to the seller for review and edit before it is saved, never auto-published (PRD §5.2) |
| T7 | Someone tries to use the assistant to search or compile Anonymous Confessions/Opinions posts, or otherwise defeat that feature’s anonymity design | Confessions content is not in the retrieval index at all (PRD §2) — there is nothing for such a query to find, not merely a filter that could be bypassed |
| T8 | Attempts to extract the assistant’s system prompt or internal configuration | Treated honestly: prompt secrecy is not a reliable security boundary, so no credential, key, or sensitive rule is ever placed in the prompt — anything that must stay secret stays server-side, outside what the model can see |
| T9 | Stored query logs become a new sensitive dataset (students asking personal questions, tied to their identity) | Short fixed retention window and access restricted to the audited log-reviewer path (Section 6) — minimizing what exists and who can reach it, rather than relying on policy alone |

4\. API Surface (Phase 1)
=========================

| **Action** | **Input** | **Notes** |
| --- | --- | --- |
| askAssistant | message, session context (recent turns, current session only) | Runs the crisis check first (T4), then retrieval, then generation; rate-limited (T5) |
| generateSellerCopy | structured product facts (name, condition, features, price) | Verified sellers only; returns a draft for the seller to review, never auto-saves (T6) |
| reindexContent (internal) | source\_type, source\_id | Called by each in-scope feature when its content is published or changed; refreshes that item’s row in the shared index |
| reviewAssistantLogs (log reviewer only) | filters, mandatory reason | Refused without a reason; writes a distinct audit\_logs entry (Section 6) |

5\. Data Integrity
==================

### 5.1 One unified retrieval index

assistant.content\_index:  
source\_type: product | service | posting | poll |  
podcast\_episode | video | map\_pin  
source\_id, indexed\_text, embedding vector, updated\_at  
  
NOT indexed, by design: confessions posts (PRD §2), anything private  
refreshed by reindexContent() on publish/update, not a nightly rebuild  
only rows for currently-public content exist — unpublishing removes the row

### 5.2 Session-scoped context only

Conversation context is held for the current session and discarded when it ends — no persistent per-student chat history in Phase 1 (PRD §7). This avoids creating a durable store of what individual students asked, on top of the query-log retention already covered in Section 6.

### 5.3 Retrieval flow

askAssistant(message):  
1\. crisis pattern check -> match: return counseling resource, stop  
2\. embed the message  
3\. pgvector search over content\_index, run as the caller (RLS applies)  
4\. build prompt: instructions + retrieved records marked as untrusted data  
5\. call Gemini 1.5 Flash (Groq Llama 3 70B if unavailable)  
6\. return answer + links to the source records used  
no relevant records found -> "I don’t have information about that"

6\. Query Logs & Access
=======================

*   Each request stores a minimal log entry (user id where signed in, the message, timestamp, which model answered, token usage) for abuse investigation and cost tracking

**\[DECISION\]** Logs are retained for 30 days and then deleted, and are readable only through the separately-audited log-reviewer path — not through any general Admin screen. Thirty days is a judgment call balancing abuse investigation against minimizing a sensitive dataset; it should be revisited once real usage shows how long investigations actually take.

7\. Performance & Cost Strategy
===============================

*   Gemini 1.5 Flash chosen specifically as the fast, lower-cost option; a target of a few seconds for a typical answer, streamed so the student sees text appearing rather than waiting on a blank screen
*   Retrieval is a single indexed pgvector query — the retrieval step should be a small fraction of total latency, not the bottleneck
*   A global daily spend ceiling and per-user rate limits (T5) are treated as core requirements, not later hardening — consistent with the free-tier-first philosophy the platform already applies to Cloudinary video costs
*   If both models are unavailable, the widget degrades to a plain "assistant temporarily unavailable" state rather than hanging or erroring