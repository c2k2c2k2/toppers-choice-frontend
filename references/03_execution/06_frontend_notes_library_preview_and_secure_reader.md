# Frontend Prompt 06: Notes Library, Preview, and Secure Reader

## Depends On
- `references/03_execution/05_frontend_student_shell_dashboard_and_catalog.md`
- Backend step `B06`

## Prompt
```text
We are implementing Topper's Choice frontend step F06: notes library, premium preview UX, and secure note reader.

Read these references first:
- references/01_product/01_toppers_choice_product_understanding.md
- references/02_architecture/01_frontend_kickoff_plan.md
- references/03_execution/00_master_index.md
- /Users/raje/projects/Dhurandhar/dhurandhar-web-app-frontend/references/frontend/student_app/codex_04_student_app_notes.md
- /Users/raje/projects/Dhurandhar/dhurandhar-web-app-frontend/src/modules/student-notes/viewer/PdfCanvasViewer.tsx
- /Users/raje/projects/Dhurandhar/dhurandhar-web-app-frontend/src/modules/student-notes/viewer/WatermarkOverlay.tsx

Task:
- Build the student note discovery and reading experience.
- Support free, preview, and premium states cleanly in the UI.
- Implement secure note session handling, watermark overlay display, and PDF reading controls without breaking the mobile-first experience.

Must include:
- notes list/tree/filtering UI
- note detail summary and entitlement/paywall states
- preview-friendly calls to note session APIs
- secure PDF reader flow with watermark overlay
- progress tracking and resume behavior
- graceful handling for expired or revoked sessions

Constraints:
- Do not cache protected note assets unsafely
- The reader must work well on both mobile and desktop

Done when:
- Students can discover and read notes according to access tier
- Preview behavior is clear and polished
- Tracker is updated
```

## Out Of Scope
- Practice and test flows
