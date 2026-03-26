# Frontend Execution Master Index

**Legend**
- [ ] Not started
- [~] In progress
- [x] Done

## Context Already Completed
- [x] `references/01_product/01_toppers_choice_product_understanding.md`
- [x] `references/02_architecture/01_frontend_kickoff_plan.md`

## Recommended Cross-Repo Run Order
1. `B01` Backend platform foundation and conventions
2. `B02` Backend site settings, seeds, and runtime config
3. `F01` Frontend foundation, routing, query, and Zustand
4. `F02` Frontend design system, PWA, and legacy Marathi fonts
5. `F03` Frontend public landing and CMS surface
6. `B03` Backend auth, students, admins, and sessions
7. `B04` Backend authorization, roles, permissions, and audit
8. `F04` Frontend auth session bootstrap and guards
9. `B05` Backend taxonomy, catalog, files, and asset delivery
10. `F05` Frontend student shell, dashboard, and catalog
11. `B06` Backend notes, preview, and secure streaming
12. `F06` Frontend notes library, preview, and secure reader
13. `B07` Backend structured content modules
14. `F07` Frontend guidance, English speaking, and current affairs
15. `B08` Backend question bank and media
16. `B09` Backend practice engine and progress
17. `B10` Backend test engine and attempts
18. `F08` Frontend practice and tests student experience
19. `B11` Backend plans, entitlements, and payment adapter
20. `F09` Frontend plans, payments, entitlements, and preview UX
21. `B12` Backend CMS, notifications, analytics, search, and admin ops
22. `F10` Frontend admin shell, shared CRUD, and CMS
23. `F11` Frontend admin content, assessments, users, and ops
24. `F12` Frontend gap analysis, QA, and release hardening

## Frontend Prompt Sequence
- [x] `references/03_execution/01_frontend_foundation_routing_query_and_state.md`
- [x] `references/03_execution/02_frontend_design_system_pwa_and_legacy_marathi_fonts.md`
- [x] `references/03_execution/03_frontend_public_landing_and_cms_surface.md`
- [x] `references/03_execution/04_frontend_auth_session_bootstrap_and_guards.md`
- [x] `references/03_execution/05_frontend_student_shell_dashboard_and_catalog.md`
- [x] `references/03_execution/06_frontend_notes_library_preview_and_secure_reader.md`
- [x] `references/03_execution/07_frontend_guidance_english_speaking_current_affairs.md`
- [x] `references/03_execution/08_frontend_practice_and_tests_student_experience.md`
- [x] `references/03_execution/09_frontend_plans_payments_entitlements_and_preview_ux.md`
- [x] `references/03_execution/10_frontend_admin_shell_shared_crud_and_cms.md`
- [ ] `references/03_execution/11_frontend_admin_content_assessment_users_and_ops.md`
- [ ] `references/03_execution/12_frontend_gap_analysis_qa_and_release_hardening.md`

## Tracker Rules
- Mark a prompt `[~]` when work starts and `[x]` only when implementation, verification, and any required doc updates are finished.
- Keep only one frontend prompt `[~]` at a time.
- When a step changes architecture or state-management rules, update `references/02_architecture/01_frontend_kickoff_plan.md`.
- If legacy Marathi font support evolves during implementation, capture the final rules in the prompt file that introduced the change instead of letting the behavior drift undocumented.
