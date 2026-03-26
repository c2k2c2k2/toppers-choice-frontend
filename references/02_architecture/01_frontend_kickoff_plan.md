# Frontend Kickoff Plan

## Summary
The frontend will be a single Next.js App Router application with three route groups:
- `/(public)` for landing and legal pages
- `/(student)` for the student web app and PWA surface
- `/(admin)` for the admin panel

The frontend must stay contract-driven against the backend, use CMS-driven content wherever possible, and avoid hardcoded business configuration.

## Route Strategy
- Public: home, exam-track pages, pricing, about/contact, legal pages
- Student: dashboard, notes, guidance, English speaking, current affairs, practice, tests, payments, profile, announcements
- Admin: dashboard, users, taxonomy, notes, guidance content, English speaking, current affairs, question bank, tests, plans, payments, CMS, analytics, audit, settings

## Shared Frontend Foundations
- Shared API client generated or aligned from OpenAPI
- Generated contract types live under `src/lib/api/generated/`, with small frontend normalization helpers at the UI edge where Swagger optional fields are looser than the runtime payloads
- Shared auth provider and permission guards
- Shared query layer and error normalization
- Shared Zustand stores for client-side cross-route state
- Shared design tokens and brand system
- Shared PWA install/provider baseline with static-shell-only caching
- Shared Marathi text rendering helpers and legacy font assets
- Shared CMS section renderer
- Shared responsive layout primitives for student and admin shells

## Design Direction From Stitch References
- The frontend design system must be derived from the delivered Stitch references in `references/stitch_topper_s_choice/`, not from generic SaaS defaults or the Dhurandhar UI.
- Primary visual source references for implementation are:
  - `references/stitch_topper_s_choice/stitch_topper_s_choice_landing_page/academic_excellence/DESIGN.md`
  - `references/stitch_topper_s_choice/stitch_topper_s_choice_landing_page/topper_s_choice_merged_neo_realistic_design/code.html`
  - `references/stitch_topper_s_choice/stitch_topper_s_choice_landing_page/student_dashboard_2/code.html`
  - `references/stitch_topper_s_choice/stitch_topper_s_choice_landing_page/practice_test_center/code.html`
- Creative north star: "Academic Atelier" with editorial spacing, premium academic tone, and interfaces that feel like a modern digital textbook rather than a boxed LMS template.
- Typography direction:
  - Manrope for headlines and display moments
  - Inter for UI and body copy
  - Devanagari-safe and legacy Marathi support layered in as shared infrastructure during F02
- Color and surface direction:
  - Canvas-led surfaces around `#f8f9fa`, `#f3f4f5`, and white cards
  - Navy authority via `#001e40` and `#003366`
  - Warm amber CTAs and highlights around `#ffb86f` and `#e18600`
  - Use tonal layering, glass surfaces, and ambient depth before introducing strong divider lines
- Component behavior direction:
  - Floating or fixed glass headers and nav bars
  - Rounded cards and modules separated by spacing and background shifts
  - Soft "ghost border" treatment only when needed for clarity
  - Mobile-first student UI with large touch targets and breathable content density
- Avoid visual drift:
  - Do not default to purple-led palettes, flat white dashboards, or generic admin-table styling
  - Do not copy the Dhurandhar implementation directly even when reusing technical patterns

## State Management Strategy
- Use TanStack Query for server state, caching, background refetching, and mutation invalidation
- Use Zustand for client-side application state that must survive route changes without forcing everything into URL params or prop drilling
- Keep auth session bootstrap, permissions, and theme or site bootstrap in dedicated providers where lifecycle and side effects matter more than raw store access
- Keep PWA installability and service-worker readiness in a lightweight shared provider plus focused Zustand store, separate from backend-backed entities
- Avoid Redux in v1 unless later requirements introduce unusually complex offline sync or event-sourcing needs

## Auth And API Proxy Rules
- The shared auth provider currently stores the token bundle in `sessionStorage`, restores the session through `GET /auth/me`, and falls back to `POST /auth/refresh` before clearing the local session on failure.
- Browser-side API calls should use the frontend's same-origin `/api/v1` path so the Next.js rewrite layer can proxy to the backend without depending on ad hoc CORS behavior.
- Server-side data fetching should continue using `NEXT_PUBLIC_API_BASE_URL` as the explicit backend base URL.
- Student and admin access entry points are `/student/login` and `/admin/login`, with `/student/forbidden` and `/admin/forbidden` reserved for access failures.

## PWA Baseline Rules
- The student surface remains the primary install target, but manifest and provider wiring live at the shared app root so public and admin surfaces boot consistently inside the same installable shell.
- Service-worker caching must stay conservative: cache static shell assets, manifest, icons, and bundled fonts only.
- Do not cache `/api` responses, route documents, or protected student/admin payloads offline by default.
- Protected note sessions must remain explicitly non-persistent: note view tokens and watermark payloads stay in memory only, and note resume should come from backend progress rather than from offline reader snapshots.

## Shared Marathi Rendering Rules
- Unicode Marathi must render through the shared Devanagari-safe fallback stack.
- Legacy encoded Marathi must use centralized helpers and shared font assets rather than ad hoc per-feature font loading.
- Support explicit hints for Shree-Dev/Shreelipi-style and Surekh/Sulekha-style encoded content, with glyph-based fallback detection only when metadata is missing.

## Planned Zustand Scope
- Student shell UI state such as sidebar, bottom-nav behavior, active exam-track context, and lightweight preferences
- Student shell currently persists the active exam-track code, active medium code, and last-opened catalog subject slug so later notes, guidance, practice, and tests can reuse discovery context
- Note reader UI state such as zoom, focus mode, and session-local reader controls
- Protected note view tokens, watermark payloads, and canonical resume position should not be persisted in Zustand; the backend note progress endpoint remains the source of truth for resume
- Practice and test session client state such as in-progress answers, timer snapshot, local draft persistence, and resume-safe interaction state
- Admin panel UI state such as table preferences, filter drawer state, and non-server draft UI controls
- Keep canonical backend-backed entities out of Zustand; fetch them through API hooks and query cache instead

## Rendering Strategy
- Public pages: server-first with revalidation
- Student dashboard and content lists: hybrid server plus client data fetching
- Note reader, practice, tests, and payments: client-heavy interactive routes
- Admin CRUD screens: client-heavy with server-filtered APIs

## State And Integration Needs
- Session and token lifecycle
- Permissions and access gating
- CMS and site configuration bootstrap
- Student entitlements and preview state
- Practice session and test attempt state
- Payment order and polling state
- Toasts, loading, optimistic updates, and empty states

## Frontend Development Order
1. App foundation, route groups, shared providers, theme tokens, and PWA shell
2. Public landing foundation with CMS-driven sections
3. Student shell, auth guards, and dashboard bootstrap
4. Notes library and protected reader with preview handling
5. Guidance, English speaking, and current affairs content flows
6. Practice engine UI
7. Test engine UI
8. Payments and entitlement UX
9. Admin shell and permissions
10. Admin CRUD modules for taxonomy, content, question bank, tests, CMS, users, and operations

## Frontend Acceptance Focus
- All three app surfaces boot from one repo cleanly
- Public landing content can change from CMS without redeploy
- Student app is mobile-first and installable
- Premium items show preview state correctly before purchase
- Admin permissions hide or block restricted actions
- Frontend contract stays aligned with backend OpenAPI
