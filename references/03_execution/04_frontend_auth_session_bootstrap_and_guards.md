# Frontend Prompt 04: Auth Session Bootstrap and Guards

## Depends On
- `references/03_execution/03_frontend_public_landing_and_cms_surface.md`
- Backend steps `B03` and `B04`

## Prompt
```text
We are implementing Topper's Choice frontend step F04: auth session bootstrap, guards, and access-aware routing.

Read these references first:
- references/02_architecture/01_frontend_kickoff_plan.md
- references/03_execution/00_master_index.md
- /Users/raje/projects/Dhurandhar/dhurandhar-web-app-frontend/references/frontend/admin_panel/codex_01_admin_panel_foundation.md
- /Users/raje/projects/Dhurandhar/dhurandhar-web-app-frontend/references/frontend/student_app/codex_01_student_app_foundation.md

Task:
- Wire the shared auth session layer to backend auth endpoints.
- Implement token storage, `/auth/me` bootstrap, login/logout flows, route guards, permission checks, and user-type-aware redirects for student and admin surfaces.

Must include:
- shared auth API layer
- auth provider/session bootstrap
- student and admin guards
- permission or policy-aware UI gates
- login entry points and redirect handling
- session failure handling with a clean logout path

Constraints:
- Keep session rules shared where possible, but separate student/admin UX as needed
- Do not couple auth guards to specific feature pages

Done when:
- Student and admin routes enforce access rules correctly
- Session bootstrap and refresh behavior are stable
- Tracker is updated
```

## Out Of Scope
- Full student feature pages
- Full admin CRUD modules

## Implementation Notes
- The shared auth provider uses `sessionStorage` for the token bundle, restores sessions through `GET /auth/me`, refreshes with `POST /auth/refresh` when access tokens are stale, and clears the local session if refresh or bootstrap fails.
- Browser-side auth and future client-heavy student/admin API calls should target same-origin `/api/v1` so the Next.js rewrite layer can proxy to the backend. Server-side fetches still use `NEXT_PUBLIC_API_BASE_URL` directly.
- Route-group auth entry points are now mounted at `/student/login`, `/student/forbidden`, `/admin/login`, and `/admin/forbidden`.
- Student self-signup is available from the student login surface because the backend `POST /auth/signup` contract already exists and the local verification environment did not start with seeded student users.
- Admin UI gating should stay permission-aware and backend-driven. The frontend may hide or show modules with shared permission helpers, but it must not become the source of truth for authorization policy.
