---
title: "System Architecture"
project: "StadiumMind AI"
area: "Architecture"
status: "Draft for hackathon implementation"
last_updated: "2026-07-12"
---


        # System Architecture

        ## Overview

        StadiumMind AI uses a conventional web architecture with a clearly separated AI orchestration layer. The frontend should never call Gemini directly. All AI calls go through backend services that assemble trusted context, apply prompt contracts, validate JSON, persist logs, and publish realtime updates.

        ```mermaid
        flowchart LR
          Fan[Fan Browser] --> Web[Next.js Frontend]
          Volunteer[Volunteer Browser] --> Web
          Admin[Organizer Browser] --> Web
          Web --> API[Node/Express API]
          Web <--> Socket[Socket.IO Gateway]
          API --> Supabase[(Supabase Postgres + Auth)]
          API --> AI[Gemini AI Service]
          API --> Sim[Simulation Engine]
          Sim --> Socket
          AI --> API
          API --> Socket
        ```

        ## Key Architectural Decisions

        - Supabase owns authentication and relational storage.
        - Backend owns authorization checks in addition to Supabase RLS.
        - Gemini is used for reasoning and language generation, not as a source of truth.
        - Simulation data replaces real stadium sensors for the hackathon.
        - Socket.IO creates the command-center feel without complex event infrastructure.
        - The system supports deterministic fallback content for demo reliability.

        ## Runtime Components

        | Component | Responsibility |
| --- | --- |
| Next.js Frontend | Public Match Hub, Fan Journey Planner, Volunteer Workspace, Organizer Command Center. |
| Express API | REST endpoints for matches, tickets, incidents, recommendations, simulation, reports, and AI requests. |
| Socket.IO Gateway | Realtime updates for dashboards, alerts, recommendations, and simulation scenarios. |
| Supabase | Postgres, Auth, RLS, seed data, user profiles, tickets, incidents, action history. |
| Gemini Service | Prompt execution, structured output generation, summaries, explanations, reports, translations. |
| Simulation Engine | Generates and mutates crowd, transport, incident, and sustainability signals. |

        ## Data Flow

        1. The fan selects a match from the Match Hub.
        2. The fan enters a ticket ID or scans a demo QR payload.
        3. The backend verifies the ticket against Supabase and returns fan context.
        4. The fan selects preferences and accessibility needs.
        5. The backend builds a trusted context packet and calls Gemini Fan Journey Planner.
        6. The response is validated, persisted to AI logs, and returned to the frontend.
        7. Organizer dashboards subscribe to Socket.IO for live stadium state.
        8. Simulation events update metrics and trigger AI decision workflows.
        9. Recommendations are stored and shown with confidence and explanations.
        10. Admin actions update action history and feed back into simulation state.

        ## Security Boundaries

        Public endpoints may read match, stadium, zone, and selected live summary data. Ticket verification should reveal only the ticket fields needed for planning. Volunteer and admin endpoints require authenticated JWTs and role checks. AI prompts should receive minimized, sanitized data.

        ## Cross References

        - [03_srs.md](../product/03_srs.md)
- [04_realtime_architecture.md](04_realtime_architecture.md)
- [05_security_architecture.md](05_security_architecture.md)
- [services.md](../backend/services.md)
- [01_ai_overview.md](../ai/01_ai_overview.md)
