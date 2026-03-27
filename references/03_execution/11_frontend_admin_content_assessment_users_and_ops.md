# Frontend Prompt 11: Admin Content, Assessment, Users, and Ops

## Depends On
- `references/03_execution/10_frontend_admin_shell_shared_crud_and_cms.md`
- Backend steps `B05` through `B12`

## Prompt
```text
We are implementing Topper's Choice frontend step F11: the main admin product modules.

Read these references first:
- references/03_execution/00_master_index.md
- /Users/raje/projects/Dhurandhar/dhurandhar-web-app-frontend/references/frontend/admin_panel/codex_05_admin_panel_taxonomy.md
- /Users/raje/projects/Dhurandhar/dhurandhar-web-app-frontend/references/frontend/admin_panel/codex_06_admin_panel_notes.md
- /Users/raje/projects/Dhurandhar/dhurandhar-web-app-frontend/references/frontend/admin_panel/codex_07_admin_panel_questions.md
- /Users/raje/projects/Dhurandhar/dhurandhar-web-app-frontend/references/frontend/admin_panel/codex_08_admin_panel_tests.md
- /Users/raje/projects/Dhurandhar/dhurandhar-web-app-frontend/references/frontend/admin_panel/codex_11_admin_panel_payments.md
- /Users/raje/projects/Dhurandhar/dhurandhar-web-app-frontend/references/frontend/admin_panel/codex_12_admin_panel_users.md
- /Users/raje/projects/Dhurandhar/dhurandhar-web-app-frontend/references/frontend/admin_panel/codex_14_admin_panel_audit.md
- /Users/raje/projects/Dhurandhar/dhurandhar-web-app-frontend/references/frontend/admin_panel/codex_15_admin_panel_analytics.md
- /Users/raje/projects/Dhurandhar/dhurandhar-web-app-frontend/references/frontend/admin_panel/codex_16_admin_panel_notifications.md

Task:
- Build the domain-heavy admin modules on top of the shared admin foundation.
- Cover taxonomy, notes, structured content, question bank, tests, plans/payments, users/access, audit, notifications, analytics, and operational pages.

Must include:
- admin CRUD screens for taxonomy and all main content modules
- authoring workflows for questions and tests
- plans/payments management and support actions
- user management, access grants, and audit visibility
- notifications and analytics screens aligned to backend scope
- role-aware action gating across admin modules

Constraints:
- Keep domain screens consistent with the shared CRUD system
- Do not rebuild shared components inside feature modules

Done when:
- Admin panel is feature-complete enough to operate the product
- Major admin workflows are contract-driven and verified
- Tracker is updated
```

## Out Of Scope
- Final polishing and release hardening

## Implementation Notes
- F11 now includes the main admin product workspaces for taxonomy, notes, structured content, questions, tests, plans/payments, users/access, audit, notifications, analytics, and ops, all mounted under the shared admin shell and gated by backend permissions.
- Shared admin contracts were expanded under `src/lib/admin` so the feature screens stay contract-driven instead of embedding ad hoc fetch logic in route files.
- Notification template and broadcast editors now use selection-scoped draft state rather than effect-synced form resets, which keeps the admin editor behavior lint-clean and more predictable.
- During verification, the backend Swagger contract for taxonomy topic `parentId` was found to be incorrectly emitted as an empty object. The source DTO was corrected in the backend, and the frontend `src/lib/api/generated/backend-schema.d.ts` file was regenerated from the live `/docs-json` document.

## Verification Notes
- Verified with `pnpm lint` and `pnpm build` in the frontend repo after the schema regeneration.
- Verified production route boot on `next start --port 3111` for `/admin`, `/admin/taxonomy`, `/admin/notes`, `/admin/content`, `/admin/questions`, `/admin/tests`, `/admin/plans`, `/admin/payments`, `/admin/users`, `/admin/audit`, `/admin/notifications`, `/admin/analytics`, `/admin/ops`, `/admin/cms/pages`, and `/admin/login`.
- Verified live admin backend contracts with an authenticated admin token across access, taxonomy, notes, content, questions, tests, plans, payments, users, audit, notifications, analytics, search, and ops endpoints.
