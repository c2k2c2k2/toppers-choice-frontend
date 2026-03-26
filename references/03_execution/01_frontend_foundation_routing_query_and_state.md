# Frontend Prompt 01: Foundation, Routing, Query, and State

## Depends On
- `references/01_product/01_toppers_choice_product_understanding.md`
- `references/02_architecture/01_frontend_kickoff_plan.md`

## Prompt
```text
We are implementing Topper's Choice frontend step F01: shared application foundation.

Read these references first:
- references/01_product/01_toppers_choice_product_understanding.md
- references/02_architecture/01_frontend_kickoff_plan.md
- references/03_execution/00_master_index.md
- /Users/raje/projects/Dhurandhar/dhurandhar-web-app-frontend/references/frontend/codex_01_frontend_foundation.md

Task:
- Turn the current Next.js scaffold into the shared frontend foundation for public, student, and admin surfaces.
- Add route groups, shared layouts, API client structure, TanStack Query setup, Zustand store structure, shared providers, and basic placeholder shells.
- Use the state-management decision already locked in: TanStack Query for server state, Zustand for focused client-side cross-route state.

Must include:
- App Router route groups for `/(public)`, `/(student)`, and `/(admin)`
- shared `src/lib/api`, `src/lib/auth`, `src/lib/cms`, and `src/stores` structure
- TanStack Query dependency/setup and query provider
- Zustand store pattern and at least one starter store
- shared layout/provider composition in `src/app/layout.tsx`
- basic loading/error/empty primitives or placeholders

Constraints:
- Do not build final feature pages yet
- Keep the API layer contract-driven and backend-ready
- Do not add Redux

Done when:
- The app boots cleanly with the three route groups
- Query and Zustand are both wired in as intended
- Folder structure is ready for the later prompts
- Tracker is updated
```

## Out Of Scope
- Final visual design
- Auth workflows
- Feature-specific pages
