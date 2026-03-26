# Frontend Prompt 05: Student Shell, Dashboard, and Catalog

## Depends On
- `references/03_execution/04_frontend_auth_session_bootstrap_and_guards.md`
- Backend step `B05`

## Prompt
```text
We are implementing Topper's Choice frontend step F05: student shell, dashboard bootstrap, and catalog navigation.

Read these references first:
- references/02_architecture/01_frontend_kickoff_plan.md
- references/03_execution/00_master_index.md
- /Users/raje/projects/Dhurandhar/dhurandhar-web-app-frontend/references/frontend/student_app/codex_02_student_app_home.md
- /Users/raje/projects/Dhurandhar/dhurandhar-web-app-frontend/references/frontend/student_app/codex_03_student_app_subjects_topics.md

Task:
- Build the mobile-first student app shell and dashboard foundation.
- Add student navigation, dashboard summaries, track/medium selection, announcements area, and content catalog navigation for exam tracks, subjects, and topics.

Must include:
- student layout shell with mobile and desktop behavior
- dashboard/home scaffold
- announcement and quick-action areas
- exam-track, medium, subject, and topic navigation flows
- reusable student cards, lists, filters, and empty states
- Zustand-backed UI state where cross-route behavior matters

Constraints:
- Keep student shell reusable across notes, guidance, practice, and tests
- Avoid hardcoded sample taxonomy once real APIs are available

Done when:
- Student users can navigate the app foundation meaningfully
- Catalog navigation is ready for notes and content modules
- Tracker is updated
```

## Out Of Scope
- Note reader
- Practice and tests
