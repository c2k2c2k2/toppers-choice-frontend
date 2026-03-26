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
