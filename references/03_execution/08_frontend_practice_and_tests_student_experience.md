# Frontend Prompt 08: Practice and Tests Student Experience

## Depends On
- `references/03_execution/07_frontend_guidance_english_speaking_current_affairs.md`
- Backend steps `B08`, `B09`, and `B10`

## Prompt
```text
We are implementing Topper's Choice frontend step F08: student practice and test experiences.

Read these references first:
- references/01_product/01_toppers_choice_product_understanding.md
- references/03_execution/00_master_index.md
- /Users/raje/projects/Dhurandhar/dhurandhar-web-app-frontend/references/frontend/student_app/codex_05_student_app_practice.md
- /Users/raje/projects/Dhurandhar/dhurandhar-web-app-frontend/references/frontend/student_app/codex_06_student_app_tests.md

Task:
- Build the student flows for practice sessions and timed tests.
- Use Zustand for in-progress local interaction state where it helps with resume safety, timers, and draft answers.
- Make the experience mobile-first, reliable, and privacy-safe.

Must include:
- practice start, answer, reveal, progress, and summary flows
- test listing, instructions, start, save, submit, and result flows
- timer handling and draft persistence where needed
- question rendering and answer controls
- weak-area or performance summary entry points
- clear empty/error/session-expired states

Constraints:
- Do not leak correct answers before intended backend stages
- Keep practice and test UX distinct

Done when:
- Students can complete practice and timed test flows end to end
- State survives common refresh or navigation edge cases appropriately
- Tracker is updated
```

## Out Of Scope
- Payments and checkout
- Admin authoring

## Implementation Notes
- Student assessment routes now live at:
  - `/student/practice`
  - `/student/practice/session/[sessionId]`
  - `/student/tests`
  - `/student/tests/[testId]`
  - `/student/tests/attempts/[attemptId]`
- Shared assessment foundations now live under:
  - `src/lib/assessment` for normalized student question rendering, locale preference, draft normalization, and review helpers
  - `src/lib/practice` for practice-session contracts and progress analytics
  - `src/lib/tests` for published-test, attempt-history, save, and submit contracts
  - `src/components/assessment` for reusable question, review, and result UI
- Zustand now persists focused interactive state for:
  - practice session drafts, current question selection, and revealed review payloads
  - timed-test attempt drafts, synced answers, and resume-safe current question state
- Practice and tests stay intentionally distinct:
  - practice gives immediate submit correctness plus explicit reveal controls
  - timed tests keep correctness hidden until submission and rely on saved drafts plus timer-driven attempt state
- Practice session routes now auto-request the first batch of questions when the backend returns an `ACTIVE` session with zero served questions.
- The student mobile bottom navigation is intentionally hidden on immersive assessment routes so the fixed shell chrome does not block save, submit, or question navigation controls.
- Timed test attempt history is wired against the backend's dedicated `/tests/attempts/history` contract instead of overloading the published-test detail route.
- Verified assessment seed data now includes:
  - published free and premium student tests
  - four representative backend questions spanning the assessment renderer
  - a disposable student verification account with a real `PRACTICE_PREMIUM` admin grant so the end-to-end browser smoke can exercise fresh practice and test flows safely
