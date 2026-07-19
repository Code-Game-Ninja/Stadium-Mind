---
title: "Realtime Events Diagram"
project: "StadiumMind AI"
area: "Diagrams"
status: "Draft for hackathon implementation"
last_updated: "2026-07-12"
---


        # Realtime Events Diagram

        ```mermaid
        sequenceDiagram
  participant Admin
  participant API
  participant Sim as Simulation
  participant AI as Gemini Service
  participant Socket
  Admin->>API: POST /simulation/scenario
  API->>Sim: apply scenario
  Sim->>Socket: simulation:scenario_applied
  API->>AI: generate recommendation
  AI-->>API: structured recommendation
  API->>Socket: recommendation:new
  Socket-->>Admin: update dashboard
        ```

        ## Notes

        This diagram is intended for GitHub Markdown rendering and can be pasted into presentation slides. Keep names aligned with the rest of the repository so AI coding agents do not create competing terminology.

        ## Cross References

        - [01_system_architecture.md](../architecture/01_system_architecture.md)
- [02_prd.md](../product/02_prd.md)
