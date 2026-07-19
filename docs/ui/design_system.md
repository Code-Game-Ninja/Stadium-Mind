---
title: "Design System"
project: "StadiumMind AI"
area: "UI"
status: "Draft for hackathon implementation"
last_updated: "2026-07-12"
---


        # Design System

        Defines the visual language for a serious operational platform with polished fan-facing surfaces.

        ## Role In The Product

        StadiumMind AI is intentionally designed as a multi-role platform rather than a single chatbot. This document defines how the design system part of the system should behave, what it depends on, and how an AI coding agent should implement it without guessing missing product decisions.

        The implementation should optimize for a polished five-day hackathon build: reliable demo behavior, realistic data flows, credible AI reasoning, and a clear story for judges. Where a real FIFA integration would be unavailable, the repository uses simulated but well-structured data so that the prototype still behaves like a production concept.

        ## Core Capabilities

        - Color roles.
- Typography.
- Cards.
- Controls.
- Charts.
- Maps.
- Timelines.

        ## Functional Requirements

        - Avoid playful clutter.
- Use clear hierarchy and dense operational layout for admin.

        ## Data Inputs

        - Supabase seed data
- Backend API responses
- Socket.IO events
- Gemini validated outputs
- User input scoped to the active role

        ## Product And Engineering Decisions

        - Keep MVP demo quality above raw feature count.
- Prefer deterministic simulation over unreliable live dependencies.
- Log important operational decisions.

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

        - [color_typography.md](color_typography.md)
- [components.md](components.md)
