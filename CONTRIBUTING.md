---
title: "Contribution Guide"
project: "StadiumMind AI"
area: "Repository"
status: "Draft for hackathon implementation"
last_updated: "2026-07-12"
---


        # Contribution Guide

        This guide explains how contributors and AI coding agents should use the documentation repository without drifting from the agreed StadiumMind AI scope.

        ## Role In The Product

        StadiumMind AI is intentionally designed as a multi-role platform rather than a single chatbot. This document defines how the contribution guide part of the system should behave, what it depends on, and how an AI coding agent should implement it without guessing missing product decisions.

        The implementation should optimize for a polished five-day hackathon build: reliable demo behavior, realistic data flows, credible AI reasoning, and a clear story for judges. Where a real FIFA integration would be unavailable, the repository uses simulated but well-structured data so that the prototype still behaves like a production concept.

        ## Core Capabilities

        - Use the PRD and SRS as the source of truth.
- Keep feature changes tied to user roles and demo goals.
- Update prompts, schemas, and API docs together when AI contracts change.
- Document decisions in the relevant architecture or product file.

        ## Functional Requirements

        - Every implemented feature must map to a requirement ID or documented MVP capability.
- All new AI outputs that affect state must have a schema.
- All new protected endpoints must document required role.
- Do not add paid providers unless explicitly approved.

        ## Data Inputs

        - Product docs
- OpenAPI contract
- Supabase schema and RLS policies
- Prompt library

        ## Product And Engineering Decisions

        - Small changes may update one document; cross-cutting changes must update at least PRD, SRS, API, and prompts.
- Demo reliability has priority over speculative production integrations.
- Terminology must stay consistent: Match Hub, Fan Journey Planner, Volunteer Workspace, Organizer Command Center.

        ## Interaction Model

        Each screen or service must expose a clear current state, the next useful action, and the reason behind AI recommendations. The product should never make the user inspect raw telemetry before understanding what matters. For fans, the system should speak in practical match-day terms: gate, route, queue, seat, time to kickoff, and accessibility. For volunteers, the system should speak in SOP steps. For organizers, the system should speak in operational risk, confidence, action, and expected outcome.

        ## States

        | State | Expected Behavior |
| --- | --- |
| Empty | Show the minimum inputs needed to begin and use demo examples where helpful. |
| Loading | Use compact skeletons or progress indicators; do not block the whole page unless authentication is being checked. |
| Ready | Show live data, AI summary, recommended actions, and relevant context. |
| Error | Explain what failed and offer a deterministic fallback or demo data reset. |
| Offline/Demo | Continue with seeded simulated data and mark the source clearly in developer-facing docs. |

        ## Acceptance Criteria

        - [ ] The feature can be demonstrated without external FIFA systems.
- [ ] The UI makes the user role clear within five seconds.
- [ ] AI output includes context and avoids unsupported claims.
- [ ] Demo seed data produces at least one meaningful recommendation.
- [ ] The feature degrades gracefully if Gemini is unavailable.
- [ ] All important actions are captured in the action history or incident timeline when relevant.

        ## Implementation Notes For AI Coding Agents

        - Prefer the patterns in `docs/frontend/components.md`, `docs/backend/services.md`, and `docs/ai/prompt_contracts.md`.
        - Keep demo data deterministic enough for rehearsal, but allow simulation controls to change the state during presentation.
        - Treat Gemini responses as advisory. The backend should validate, normalize, and log every AI response before showing it as an operational recommendation.
        - Do not require fan login. Use ticket verification and match selection to create fan context.
        - Require Supabase Auth and role-based access for volunteers and organizers.

        ## Cross References

        - [README.md](README.md)
- [02_prd.md](docs/product/02_prd.md)
- [06_requirements_traceability.md](docs/product/06_requirements_traceability.md)
