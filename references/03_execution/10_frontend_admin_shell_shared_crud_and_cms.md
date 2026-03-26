# Frontend Prompt 10: Admin Shell, Shared CRUD, and CMS

## Depends On
- `references/03_execution/09_frontend_plans_payments_entitlements_and_preview_ux.md`
- Backend step `B12`

## Prompt
```text
We are implementing Topper's Choice frontend step F10: admin shell, shared CRUD patterns, and CMS management foundation.

Read these references first:
- references/02_architecture/01_frontend_kickoff_plan.md
- references/03_execution/00_master_index.md
- /Users/raje/projects/Dhurandhar/dhurandhar-web-app-frontend/references/frontend/admin_panel/codex_01_admin_panel_foundation.md
- /Users/raje/projects/Dhurandhar/dhurandhar-web-app-frontend/references/frontend/admin_panel/codex_03_admin_panel_shared_components.md
- /Users/raje/projects/Dhurandhar/dhurandhar-web-app-frontend/references/frontend/admin_panel/codex_10_admin_panel_cms.md

Task:
- Build the admin panel shell and the reusable foundations used by the rest of the admin app.
- Add admin navigation, permission-aware UI, shared table/form/filter components, file upload helper integration, and CMS management surfaces.

Must include:
- admin shell, sidebar/topbar, and permission-aware navigation
- shared admin table/filter/form primitives
- upload UI integration for the backend file asset flow
- CMS pages, banners, announcements, and section-management screens
- admin settings bootstrap and role-aware page protection

Constraints:
- Keep CRUD patterns reusable so later admin modules do not reinvent scaffolding
- Avoid hardcoding CMS schemas into one-off components where a generic editor can help

Done when:
- Admin users can manage the dynamic public/student content surfaces
- Shared admin foundations are ready for the remaining domain modules
- Tracker is updated
```

## Out Of Scope
- Full question/test authoring UX
- Detailed analytics dashboards
