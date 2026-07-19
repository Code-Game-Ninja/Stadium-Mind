---
title: "Database ER Diagram"
project: "StadiumMind AI"
area: "Diagrams"
status: "Draft for hackathon implementation"
last_updated: "2026-07-12"
---


        # Database ER Diagram

        ```mermaid
        erDiagram
  STADIUMS ||--o{ MATCHES : hosts
  STADIUMS ||--o{ STADIUM_ZONES : contains
  MATCHES ||--o{ TICKETS : has
  MATCHES ||--o{ INCIDENTS : has
  MATCHES ||--o{ RECOMMENDATIONS : has
  RECOMMENDATIONS ||--o{ ACTION_HISTORY : records
  MATCHES ||--o{ SIMULATION_EVENTS : emits
  MATCHES ||--o{ AI_LOGS : logs
  PROFILES ||--o{ INCIDENTS : creates
        ```

        ## Notes

        This diagram is intended for GitHub Markdown rendering and can be pasted into presentation slides. Keep names aligned with the rest of the repository so AI coding agents do not create competing terminology.

        ## Cross References

        - [01_system_architecture.md](../architecture/01_system_architecture.md)
- [02_prd.md](../product/02_prd.md)
