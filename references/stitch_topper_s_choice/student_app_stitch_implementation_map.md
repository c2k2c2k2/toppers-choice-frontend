# Student App Stitch Implementation Map

## Purpose
Use the Stitch project as the visual and UX source of truth for cleaning up the student app. The goal is not to copy generated HTML directly. The goal is to extract the layout intent, interaction priority, typography, surfaces, and student-friendly flow decisions, then implement them through the existing Next.js routes, shared components, TanStack Query contracts, and Zustand student context.

## Stitch Source
- Project: `projects/2639104318785550832`
- Title: `Toppers' Choice Landing Page`
- Stitch URL: `https://stitch.withgoogle.com/projects/2639104318785550832`
- Design source: `Academic Atelier`
- Local exported references: `references/stitch_topper_s_choice/stitch_topper_s_choice_landing_page/`

## Student-Friendly UX Rule
Every student screen should answer three questions without explanation text:
- Where am I?
- What should I do next?
- What progress or access status matters right now?

This means one dominant action per screen, fewer competing chips, clear labels, large touch targets, and empty states that tell the student the next action.

## Design Translation Rules
- Use Manrope for display and section headings, Inter for UI/body text.
- Keep the canvas near `#f8f9fa`; group large areas with `#f3f4f5`; use white for interactive cards.
- Prefer tonal layering and spacing over hard borders. Ghost borders should stay subtle.
- Use navy for authority and amber for action. Primary student CTAs should look deliberate, not generic.
- Student mobile screens should prioritize a bottom-nav path to Home, Courses, Notes, and Practice/Tests.
- Avoid admin language in student surfaces. Use "Start", "Continue", "Read", "Practice", "Review", and "Buy plan" instead of operational labels.
- Keep protected/premium state visible early so students do not hit surprise dead ends.

## Stitch Screen Inventory For Student App
| Stitch title | Stitch screen id | Local reference | Frontend target |
| --- | --- | --- | --- |
| Student Dashboard | `6d7ded091d8341f7b08a29426bd1c83b` | `student_dashboard_2/` | `/student`, `StudentDashboardScreen`, `StudentShell` |
| Student Dashboard | `9a082e79d8c34acb88318d26bfdf4aa7` | `student_dashboard_1/` | Secondary dashboard/mobile patterns |
| Course Library | `1e71683544e0487ba6db19b7ba82eb0c` | `course_library/` | `/student/catalog`, top-level course discovery |
| Course & Subject Library | `62a4168a0d0e4134be261ed6a01c5897` | `course_subject_library/` | `/student/catalog`, `/student/catalog/[subjectSlug]` |
| Notes Library Container | `29ac8601e9504d5e96111c970f072d77` | `notes_library_container/` | `/student/notes`, `StudentNotesLibraryScreen` |
| Reels-Style Notes Reader | `e8eda03690ae429b87b569cffab6d6c0` | `reels_style_notes_reader/` | `/student/notes/[noteId]`, reader mode pattern |
| Practice Test Center | `7613f57b085d4d19b5795ac260ebe118` | `practice_test_center/` | `/student/practice`, `/student/tests` hub structure |
| Practice Tests | `d0ae14778d9c4d95802bb25b3a68a278` | `practice_tests/` | `/student/practice`, daily quiz, streak, mock CTA patterns |
| Performance Analytics | `a0ee43a36f9b435d8f3b06f8e9f5223f` | `performance_analytics/` | dashboard analytics, practice/test result summaries |

Admin Stitch screens such as Super Admin Dashboard, Content Management Panel, Test & Analytics Controller, and User & Support Management should not drive student UI decisions except for shared token consistency.

## Route-Level Implementation Map

### `/student` Dashboard
Stitch source: `student_dashboard_2`, secondary `student_dashboard_1`.

Current implementation: `src/components/student/student-dashboard-screen.tsx`.

Desired student flow:
- Top hero should answer "continue where I left off" before showing broad metrics.
- Primary CTA: `Continue learning` or `Explore catalog` depending on available resume data.
- Secondary CTAs: `Open notes`, `Start practice`, `View tests`.
- Keep track and medium selection, but make it feel like setup, not a dashboard centerpiece.
- Replace dense metric blocks with action-linked cards: notes progress, practice accuracy, tests, unread updates.
- Keep announcements and notifications, but move them below the action launchpad unless urgent.

Component targets:
- `ContinueLearningPanel`
- `StudentQuickActionGrid`
- `StudentMetricSummaryCard`
- `StudentAnnouncementList`
- `StudentContextSelector`

Backend/API needs:
- Dashboard resume target: last note, last subject, active practice session, active test attempt.
- Existing analytics can continue to power progress cards.

### `/student/catalog`
Stitch source: `course_library`, `course_subject_library`.

Current implementation: `src/components/student/student-catalog-screen.tsx`, `src/components/student/student-subject-catalog-screen.tsx`.

Desired student flow:
- First show available learning paths as big readable cards: MPSC, Banking/Staff/Railway, English Speaking, Guidance.
- Track/medium filters should be compact and persistent, not visually louder than the courses.
- Subject cards should show: subject name, topics count, unlocked/locked state, and the best next action.
- Subject detail should become a clear topic tree with direct entry points to notes, practice, and tests.

Component targets:
- `CoursePathCard`
- `SubjectCard`
- `TopicTreePanel`
- `StudentAccessBadge`

Backend/API needs:
- Catalog should expose enough entitlement/access status per subject or content family to avoid click-through surprises.

### `/student/notes`
Stitch source: `notes_library_container`.

Current implementation: `src/components/student/student-notes-library-screen.tsx`, `StudentNoteCard`, `StudentNotesTree`.

Desired student flow:
- Prioritize "Resume reading" and "Recently added" before deep filtering.
- Keep the tree for power users, but on mobile default to simple subject/topic chips.
- Note cards should show preview/full access, language/script hints, and time/progress.
- Empty states should suggest changing subject, clearing search, or buying a plan.

Component targets:
- `ResumeReadingCard`
- `NoteCollectionTabs`
- `StudentNoteCard` refinement
- `MobileNotesFilterSheet`

Backend/API needs:
- Last read note and progress position.
- Note duration/page count where available.

### `/student/notes/[noteId]`
Stitch source: `reels_style_notes_reader`.

Current implementation: `src/components/student/student-note-detail-screen.tsx`, `SecureNoteReader`.

Desired student flow:
- Reader chrome should be minimal and obvious: back, progress, zoom, focus, next.
- For long content, use a scroll-friendly reading rail rather than dashboard-style panels.
- Locked content should show preview and one clear unlock action.
- Watermark/security controls must remain, but should not visually dominate the reading experience.

Component targets:
- `StudentReaderShell`
- `ReaderProgressHeader`
- `ReaderControlBar`
- `LockedNotePreview`

Backend/API needs:
- Existing secure reader token and progress APIs remain source of truth.

### `/student/practice`
Stitch source: `practice_test_center`, `practice_tests`.

Current implementation: `src/components/student/student-practice-hub-screen.tsx`, `StudentPracticeSessionScreen`.

Desired student flow:
- First action should be `Continue practice` if an active session exists, otherwise `Start quick practice`.
- Keep subject-wise mastery and weak-area practice visible as simple cards.
- Move diagnostic/history details lower, after the start action.
- Use streak/daily quiz pattern only if backend data supports it; otherwise call it "Quick practice".

Component targets:
- `PracticeStartPanel`
- `PracticeModeCard`
- `WeakAreaCard`
- `RecentPracticeList`

Backend/API needs:
- Active session, weak-area signals, recent sessions already appear to exist.
- Daily quiz/streak should wait until backend supports a reliable signal.

### `/student/tests`
Stitch source: `practice_test_center`, `practice_tests`.

Current implementation: `src/components/student/student-tests-hub-screen.tsx`, `StudentTestDetailScreen`, `StudentTestAttemptScreen`.

Desired student flow:
- First action should be active attempt resume or next recommended test.
- Test cards should show duration, questions, access, and one CTA.
- History should be visible but not compete with starting/resuming a test.
- Attempt pages should remain immersive and suppress bottom navigation.

Component targets:
- `RecommendedTestPanel`
- `TestCard`
- `AttemptHistorySummary`
- `AssessmentResumeBanner`

Backend/API needs:
- Active attempt resume and history already exist.
- Recommended test can be derived client-side initially from published tests and history.

### Analytics And Results
Stitch source: `performance_analytics`.

Current implementation: dashboard metrics, practice/test result components.

Desired student flow:
- Analytics should be motivating and specific, not admin-like.
- Show "focus next" guidance: weak subject, accuracy trend, next practice/test action.
- Keep charts sparse. Use progress rings and small trend cards before tables.

Component targets:
- `StudentFocusPlan`
- `ProgressRing`
- `ResultInsightCard`

Backend/API needs:
- Existing analytics summary can seed v1.
- Later add backend-generated focus recommendations if needed.

## Priority Order
1. Student shell and bottom navigation cleanup: reduce labels, keep topbar lighter, make mobile first.
2. Dashboard simplification: continue action, quick actions, context selector, then updates.
3. Catalog cards: make path/subject discovery obvious and access-aware.
4. Notes library and reader: make resume and reading experience cleaner.
5. Practice/tests hubs: start/resume-first flow, then history and analytics.
6. Analytics/focus plan: add after practice/test data is stable.

## Implementation Guardrails
- Do not paste Stitch HTML into React components. Rebuild with existing app patterns.
- Keep API access in `src/lib/*` modules; do not add route-local fetch logic.
- Use TanStack Query for backend data and Zustand only for cross-route student UI state.
- Preserve protected-content and PWA cache rules from the frontend kickoff plan.
- Reuse `ProgressRing`, `EmptyState`, `LoadingState`, and `ErrorState` before adding variants.
- When a Stitch pattern needs new data, document the backend contract need before faking it.

