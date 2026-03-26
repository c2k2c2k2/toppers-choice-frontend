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
