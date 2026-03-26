---
name: toppers-choice-frontend-dev
description: Execution workflow and project conventions for the Topper's Choice Next.js frontend repo. Use when working in this frontend on route groups, shared providers, TanStack Query, Zustand, design system, PWA setup, legacy Marathi font support, landing pages, student app, admin panel, API wiring, or tracker/doc updates.
---

# Toppers Choice Frontend Dev

## Overview
Use the frontend execution pack and repo conventions before changing UI code. Keep implementation aligned with the staged prompt sequence, the approved state-management strategy, and the shared Marathi and PWA foundations for this repo.

## Quick Start
- Read `../../../references/00_master_index.md`.
- Read `../../../references/01_product/01_toppers_choice_product_understanding.md`.
- Read `../../../references/02_architecture/01_frontend_kickoff_plan.md`.
- Read `../../../references/03_execution/00_master_index.md`.
- Open the current prompt file from `../../../references/03_execution/`.
- Check `../../../AGENTS.md` before touching Next.js-specific code.

## Workflow
1. Identify the active frontend step in `../../../references/03_execution/00_master_index.md`.
2. Open the matching prompt file and use it as the implementation boundary.
3. Inspect the live frontend structure before editing; do not assume the scaffold still matches the prompt.
4. Implement the step end to end, including verification commands that materially prove it works.
5. Update the frontend execution tracker:
   - mark the current item `[~]` when starting real implementation
   - mark it `[x]` only after code, verification, and required doc updates are complete
6. If implementation changes architecture or state rules, update `../../../references/02_architecture/01_frontend_kickoff_plan.md` in the same round.

## Frontend Guardrails
- Keep the repo split by route groups: `/(public)`, `/(student)`, `/(admin)`.
- Use TanStack Query for server state and Zustand only for focused client-side cross-route state.
- Preserve the Topper's Choice design direction; do not port Dhurandhar's UI directly.
- Build mobile-first for student flows.
- Keep premium or protected content out of unsafe offline caches.
- Treat legacy Marathi font support as shared application infrastructure, not a one-off inside a single editor or page.
- Keep backend contracts centralized and typed; avoid ad hoc fetch logic scattered across pages.

## Verification
- Run the narrowest meaningful checks for the step you touched, then broaden only if needed.
- Prefer repo scripts such as `pnpm lint`, `pnpm build`, and focused route or component checks when available.
- Report what you verified, what you did not verify, and any assumptions that remain.

## Key References
- Execution tracker: `../../../references/03_execution/00_master_index.md`
- Step prompts: `../../../references/03_execution/*.md`
- Product context: `../../../references/01_product/01_toppers_choice_product_understanding.md`
- Frontend architecture: `../../../references/02_architecture/01_frontend_kickoff_plan.md`
- Design references: `../../../references/stitch_topper_s_choice/`
- Dhurandhar frontend reference repo: `/Users/raje/projects/Dhurandhar/dhurandhar-web-app-frontend`
