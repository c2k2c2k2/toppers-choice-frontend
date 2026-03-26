# Frontend Prompt 03: Public Landing and CMS Surface

## Depends On
- `references/03_execution/02_frontend_design_system_pwa_and_legacy_marathi_fonts.md`

## Prompt
```text
We are implementing Topper's Choice frontend step F03: public landing experience and CMS-driven public surface.

Read these references first:
- references/01_product/01_toppers_choice_product_understanding.md
- references/02_architecture/01_frontend_kickoff_plan.md
- references/03_execution/00_master_index.md
- references/prompts/kick-off.md
- references/stitch_topper_s_choice/topper_s_choice_prd.html
- /Users/raje/projects/Dhurandhar/dhurandhar-web-app-frontend/references/frontend/landing/codex_01_landing_page_plan.md

Task:
- Build the public landing surface with a strong, modern Topper's Choice identity.
- Use CMS-ready section rendering so landing content can later come from backend configuration without rewrites.
- Cover the main public routes needed early: home, track highlights, pricing, contact/about, and legal page placeholders.

Must include:
- public home page architecture with section renderer
- reusable landing sections and motion patterns
- public navigation/footer and SEO baseline
- pricing and CTA components designed for future backend data
- server-first rendering with revalidation-friendly structure
- clear placeholder strategy for legal/public pages not fully authored yet

Constraints:
- Avoid hardcoding long-term business content into component logic
- Keep the landing page visually distinct from Dhurandhar

Done when:
- The public landing surface is production-shaped and CMS-ready
- Public routes have a clean foundation for later backend wiring
- Tracker is updated
```

## Out Of Scope
- Student auth
- Admin panel

## Implementation Notes
- Public routes are mounted as server-first App Router pages for `/`, `/pricing`, `/tracks/[trackSlug]`, and `/[slug]` so authored CMS pages such as `about`, `contact`, `terms`, and `privacy` can resolve without route rewrites.
- Shared public data loading should stay contract-driven against the backend endpoints already implemented in the platform:
  - `GET /public/bootstrap`
  - `GET /cms/public/resolve`
  - `GET /cms/public/pages/:slug`
  - `GET /public/plans`
- Revalidation is currently aligned at `300` seconds through the shared public content layer.
- Fallback content in `src/lib/public/fallback-content.ts` is only a resilience layer for safe public placeholders. It is not a replacement for backend-owned business configuration or CMS-authored content.
- CMS section rendering currently supports `RICH_TEXT`, `CONTENT_FEED`, `PLAN_HIGHLIGHTS`, and `CTA_GROUP`, with an explicit placeholder branch for future section types so the public routes fail softly instead of breaking at runtime.
