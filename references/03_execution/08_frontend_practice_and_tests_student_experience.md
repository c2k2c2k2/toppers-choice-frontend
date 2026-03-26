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
