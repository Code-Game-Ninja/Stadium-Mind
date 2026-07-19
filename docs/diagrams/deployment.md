---
title: "Deployment Diagram"
project: "StadiumMind AI"
area: "Diagrams"
status: "Draft for hackathon implementation"
last_updated: "2026-07-12"
---


        # Deployment Diagram

        ```mermaid
        flowchart LR
  Browser --> Vercel[Next.js on Vercel]
  Vercel --> Backend[Express on Railway/Render]
  Backend --> Supabase[(Supabase)]
  Backend --> Gemini[Gemini API]
  Backend <--> Socket[Socket.IO]
        ```

        ## Notes

        This diagram is intended for GitHub Markdown rendering and can be pasted into presentation slides. Keep names aligned with the rest of the repository so AI coding agents do not create competing terminology.

        ## Cross References

        - [01_system_architecture.md](../architecture/01_system_architecture.md)
- [02_prd.md](../product/02_prd.md)
