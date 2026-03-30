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
- Shared admin authoring now includes `AdminFontTextField`, `AdminRichHtmlField`, `TextContent`, and row-based object editors so non-technical admins can manage Marathi-capable content, metadata, question lineups, attachments, and access overrides without editing raw JSON blobs in the main F11 workflows.
- Plans, structured content, tests, and taxonomy now follow list-first CRUD routing with dedicated `/new` and `/:id` admin editor pages instead of split half-table and half-form workspaces.
- The dedicated `/admin/questions/new` and `/admin/questions/[questionId]` editor now matches the richer Dhurandhar-style authoring flow at the capability level: per-language rich text blocks, Marathi typing-mode support, shared statement/option/explanation image uploads, save-and-publish actions, and an inline render preview that stays contract-driven against the Topper's Choice backend question/media payloads.
- The shared admin rich HTML editor was upgraded from a lightweight `contentEditable` toolbar to a Tiptap-based authoring surface with Marathi-aware paste normalization, explicit legacy font marks, KaTeX-backed equation nodes, MathLive-assisted equation entry, and table tooling so mathematical question authoring stays reliable in admin, preview, and student rendering.
- Question authoring and question consumption now share a Dhurandhar-style question-rich renderer path instead of the generic structured-content renderer for assessment surfaces. The admin question editor, admin preview, and student practice/test cards all resolve the same `data-question-font` and `data-question-math-*` markup contract before rendering.
- During verification, the backend Swagger contract for taxonomy topic `parentId` was found to be incorrectly emitted as an empty object. The source DTO was corrected in the backend, and the frontend `src/lib/api/generated/backend-schema.d.ts` file was regenerated from the live `/docs-json` document.

## Verification Notes
- Verified with `pnpm lint` and `pnpm build` in the frontend repo after the schema regeneration.
- Re-verified with `pnpm lint` and `pnpm build` after the admin authoring refresh, rich Marathi text field rollout, and the new `/admin/content/*` and `/admin/tests/*` CRUD routes.
- Re-verified with `pnpm lint` and `pnpm build` after the CMS CRUD split, public CMS rendering refresh, and the new `/admin/taxonomy/[entity]/*` routes.
- Re-verified with `pnpm lint` and `pnpm build` after the question-bank parity upgrade for multilingual rich-text authoring, shared question media uploads, and save-and-publish question actions.
- Re-verified with `pnpm lint` and `pnpm build` after the Marathi font-alias hardening, shared math rendering support, and the Tiptap + MathLive question editor upgrade for equation authoring.
- Re-verified with `pnpm lint` and `pnpm build` after replacing the question-bank editor with the Dhurandhar-style Marathi/math field and switching question preview plus student assessment rendering onto the shared question-rich renderer path.
- Verified production route boot on `next start --port 3111` for `/admin`, `/admin/taxonomy`, `/admin/notes`, `/admin/content`, `/admin/questions`, `/admin/tests`, `/admin/plans`, `/admin/payments`, `/admin/users`, `/admin/audit`, `/admin/notifications`, `/admin/analytics`, `/admin/ops`, `/admin/cms/pages`, and `/admin/login`.
- Verified live admin backend contracts with an authenticated admin token across access, taxonomy, notes, content, questions, tests, plans, payments, users, audit, notifications, analytics, search, and ops endpoints.
