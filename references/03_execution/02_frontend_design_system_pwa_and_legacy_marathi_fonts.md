# Frontend Prompt 02: Design System, PWA, and Legacy Marathi Fonts

## Depends On
- `references/03_execution/01_frontend_foundation_routing_query_and_state.md`

## Prompt
```text
We are implementing Topper's Choice frontend step F02: design foundation, PWA baseline, and application-level legacy Marathi font support.

Read these references first:
- references/02_architecture/01_frontend_kickoff_plan.md
- references/03_execution/00_master_index.md
- /Users/raje/projects/Deulkar/Toppers Choice/toppers-choice-frontend/references/stitch_topper_s_choice/stitch_topper_s_choice_landing_page/academic_excellence/DESIGN.md
- /Users/raje/projects/Deulkar/Toppers Choice/toppers-choice-frontend/references/stitch_topper_s_choice/stitch_topper_s_choice_landing_page/topper_s_choice_merged_neo_realistic_design/code.html
- /Users/raje/projects/Deulkar/Toppers Choice/toppers-choice-frontend/references/stitch_topper_s_choice/stitch_topper_s_choice_landing_page/student_dashboard_2/code.html
- /Users/raje/projects/Deulkar/Toppers Choice/toppers-choice-frontend/references/stitch_topper_s_choice/stitch_topper_s_choice_landing_page/practice_test_center/code.html
- /Users/raje/projects/Dhurandhar/dhurandhar-web-app-frontend/references/fonts
- /Users/raje/projects/Dhurandhar/dhurandhar-web-app-frontend/src/modules/questions/marathi-fonts.ts
- /Users/raje/projects/Dhurandhar/dhurandhar-web-app-frontend/src/modules/questions/components/RichTextEditor.tsx
- /Users/raje/projects/Dhurandhar/dhurandhar-web-app-frontend/src/modules/questions/components/RichTextRenderer.tsx

Task:
- Establish the global design system and PWA baseline for Topper's Choice.
- Add app-wide font tokens, brand tokens, layout primitives, manifest/meta scaffolding, and safe installable PWA behavior.
- Implement reusable legacy Marathi font support at application level so Unicode Marathi and encoded Marathi content can both be rendered reliably across landing, student, and admin surfaces.

Must include:
- global color, spacing, typography, and surface tokens aligned to the Topper's Choice design direction
- display/body font setup and Devanagari-safe fallback stack
- manifest, icons strategy, installable PWA shell, and safe cache policy baseline
- shared legacy Marathi font assets and utilities
- reusable font classes/helpers for Unicode Marathi, Shree-dev/Shreelipi-style encoded text, and Sulekha/Surekh-style encoded text
- centralized detection/rendering helpers so later content modules can opt in without re-solving font behavior

Constraints:
- Legacy Marathi support must be shared infrastructure, not hidden inside one future question component
- Premium or protected content must not be cached unsafely for offline use
- Preserve the new Topper's Choice design language; do not port Dhurandhar's UI directly
- Treat the stitch references above as the visual source of truth for tokens, surfaces, type rhythm, glass navigation, tonal cards, and CTA behavior; do not invent a generic design kit detached from those references

Done when:
- The app has a coherent global design/PWA base
- Legacy Marathi font support exists as a shared frontend capability
- Later prompts can consume font helpers without duplicating logic
- Tracker is updated
```

## Out Of Scope
- Full question editor
- Final content pages

## Finalized Implementation Rules
- Global design tokens stay derived from the stitch references: editorial spacing, navy authority, amber CTAs, glass navigation, tonal cards, and soft ghost-border restraint.
- Display typography uses `Manrope`, body/UI copy uses `Inter`, and shared Marathi Unicode fallback uses `Noto Sans Devanagari` layered at the root app layout.
- Shared Marathi font assets are bundled under `public/fonts/` and `public/fonts/sulekha/`.
- Shared Marathi helpers live in `src/lib/marathi` and must remain the single detection/rendering path for later landing, student, and admin content modules.
- Shared Marathi font aliases should stay compatible with Dhurandhar-style pasted HTML and typing flows by recognizing both explicit `data-question-font` hints and legacy font-family names such as `Shree-Dev`, `Shree Dev 0708`, `Surekh`, and `Sulekha`.
- Explicit font hints should use `data-marathi-font="shree-dev"` or `data-marathi-font="surekh"` when content source metadata is known.
- Safe fallback detection may infer encoded legacy content from glyph patterns when explicit hints are missing, but later integrations should prefer explicit source metadata whenever available.
- Shared rich HTML rendering may decorate question-specific math nodes and legacy encoded wrappers, but those transforms must stay centralized so admin preview, student practice/tests, and CMS-style surfaces do not drift apart.
- Question-bank authoring should use the Dhurandhar-style typing-mode flow for Marathi input: Unicode as the default surface font, explicit `marathiEncodedFont` marks for Shree-Dev or Surekh spans, and MathLive + KaTeX for equation creation and rendering.
- The PWA baseline uses `src/app/manifest.ts`, shared provider registration, generated app icons, and `public/sw.js`.
- The service worker caches only static shell assets, bundled fonts, icons, and the manifest. It must not cache `/api`, student/admin route documents, or protected content payloads by default.
