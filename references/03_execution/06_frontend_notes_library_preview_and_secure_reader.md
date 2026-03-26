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

## Implementation Notes
- Added live student notes routes at `/student/notes` and `/student/notes/[noteId]` with the notes nav entry promoted from "soon" to "live".
- The notes library combines `GET /catalog`, `GET /notes/tree`, and filtered `GET /notes` responses so it can respect the active student track while keeping medium-agnostic notes visible through client-side medium filtering.
- Note detail pages now show free, preview, and locked premium states from the backend access summary without hardcoded entitlement logic in the frontend.
- Secure reading uses `POST /notes/:noteId/view-session`, `GET /notes/view-sessions/:id/watermark`, streamed PDF content through `pdfjs-dist`, and debounced `POST /notes/:noteId/progress` updates.
- Protected reader state follows the tightened rule set:
  - note view tokens and watermark payloads stay in component memory only
  - service-worker caching still excludes `/api` traffic
  - resume position comes from backend `note.progress`, not from offline note snapshots
