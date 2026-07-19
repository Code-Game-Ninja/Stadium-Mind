---
title: "System Context Diagram"
project: "StadiumMind AI"
area: "Diagrams"
status: "Draft for hackathon implementation"
last_updated: "2026-07-12"
---


        # System Context Diagram

        ```mermaid
        flowchart LR
  Fan --> App[StadiumMind AI]
  Volunteer --> App
  Organizer --> App
  App --> Supabase[(Supabase)]
  App --> Gemini[Gemini API]
  App --> Sim[Simulation Engine]
  App --> Socket[Socket.IO]
        ```

        ## Notes

        This diagram is intended for GitHub Markdown rendering and can be pasted into presentation slides. Keep names aligned with the rest of the repository so AI coding agents do not create competing terminology.

        ## Cross References

        - [01_system_architecture.md](../architecture/01_system_architecture.md)
- [02_prd.md](../product/02_prd.md)
