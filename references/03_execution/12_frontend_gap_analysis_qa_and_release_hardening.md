# Frontend Prompt 12: Gap Analysis, QA, and Release Hardening

## Depends On
- `references/03_execution/11_frontend_admin_content_assessment_users_and_ops.md`

## Prompt
```text
We are implementing Topper's Choice frontend step F12: final integration gap analysis, QA, and release hardening.

Read these references first:
- references/02_architecture/01_frontend_kickoff_plan.md
- references/03_execution/00_master_index.md
- /Users/raje/projects/Dhurandhar/dhurandhar-web-app-frontend/references/frontend/codex_02_frontend_api_map.md
- /Users/raje/projects/Dhurandhar/dhurandhar-web-app-frontend/references/frontend/codex_90_backend_api_gap_analysis.md

Task:
- Perform the final frontend integration and quality pass.
- Close backend/frontend contract gaps, verify route coverage, review responsiveness, accessibility, loading/error states, and ensure the most important flows are polished for release.
- Confirm that legacy Marathi support, PWA behavior, auth handling, and premium preview UX all behave consistently across the application.

Must include:
- backend API gap review and follow-up fixes
- route and permission smoke coverage
- responsive and accessibility review
- loading, error, and empty-state polish
- final cleanup of shared state and query invalidation behavior
- reference doc updates if architecture or execution docs drifted during implementation

Constraints:
- Favor fixing the biggest launch risks over endless cosmetic tuning
- Do not leave undocumented contract mismatches

Done when:
- The frontend is launch-shaped across landing, student, and admin surfaces
- Major contract, UX, and stability gaps are closed
- Tracker is updated with all frontend steps complete
```

## Out Of Scope
- Major new feature additions

## Implementation Notes
- F12 closed the highest-risk integration gaps rather than adding new feature scope. The biggest contract blocker was a backend Swagger mismatch that emitted taxonomy topic `parentId` as an empty object instead of a nullable string. The backend DTO was corrected and the frontend generated schema was refreshed from the live `/docs-json` contract.
- Backend local release ergonomics were also tightened by correcting the backend `start:prod` script to use the actual Nest build output path `dist/src/main`.
- Shared feedback primitives were hardened for accessibility: loading and empty states now announce politely, error states and warning notices now announce assertively, and decorative loading visuals are hidden from assistive tech.
- The shared admin data table now supports keyboard row selection and exposes proper table-header semantics, which removes a launch-risk accessibility gap across the new admin modules without duplicating fixes in each screen.

## Verification Notes
- Verified frontend with `pnpm lint` and `pnpm build` after the contract regeneration and hardening changes.
- Verified admin route coverage by checking live `200` responses for `/admin`, `/admin/taxonomy`, `/admin/notes`, `/admin/content`, `/admin/questions`, `/admin/tests`, `/admin/plans`, `/admin/payments`, `/admin/users`, `/admin/audit`, `/admin/notifications`, `/admin/analytics`, `/admin/ops`, `/admin/cms/pages`, and `/admin/login`.
- Verified rendered entry surfaces with headless Chrome against `http://localhost:3000/`, `http://localhost:3000/student`, and `http://localhost:3000/admin/login`.
- Verified live backend admin contracts with an authenticated admin token across access, taxonomy, notes, content, questions, tests, plans, payments, users, audit, notifications, analytics, search, and ops endpoints.
- Attempted an `axe-core` CLI accessibility pass, but local execution was blocked by a missing packaged `chromedriver` binary. Shared semantic/accessibility improvements were still applied directly in the UI primitives during this step.
