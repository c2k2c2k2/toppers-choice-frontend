# Frontend Prompt 09: Plans, Payments, Entitlements, and Preview UX

## Depends On
- `references/03_execution/08_frontend_practice_and_tests_student_experience.md`
- Backend step `B11`

## Prompt
```text
We are implementing Topper's Choice frontend step F09: plans, checkout, entitlements, and premium-preview UX.

Read these references first:
- references/01_product/01_toppers_choice_product_understanding.md
- references/02_architecture/01_frontend_kickoff_plan.md
- references/03_execution/00_master_index.md

Task:
- Build the student-facing pricing and purchase experience around the provider-agnostic backend contract.
- Support free, preview, and premium access messaging cleanly across content.
- Add plan listing, checkout launch, payment status polling, entitlement refresh, and manual-access-aware UI states.

Must include:
- pricing/plan UI for public and student surfaces
- checkout launch and return/status handling
- entitlement-aware buttons and paywall cards
- purchase success, pending, failed, and manual-access states
- consistent preview messaging across notes, practice, tests, and structured content

Constraints:
- Do not bake provider-specific assumptions into the frontend
- Respect the hybrid freemium model consistently

Done when:
- Students can move from preview to purchase cleanly
- Access refreshes correctly after successful payment or admin grant
- Tracker is updated
```

## Out Of Scope
- Admin payment operations

## Implementation Notes
- Public pricing now renders live backend plans and hands purchase intent into `/student/plans` instead of keeping checkout copy as future-only placeholder text.
- Student payments and entitlements are implemented through a shared `src/lib/payments` layer, a focused checkout Zustand store, the new `/student/plans` route, and the public `/payments/result` return route.
- Locked notes, structured content, practice access-denied states, and locked tests now use shared paywall/upgrade messaging that routes into the student plans surface with `intent`, `source`, and `returnTo` context.
- Successful payment polling invalidates entitlement-backed student queries so notes, content, practice, tests, and dashboard surfaces can refresh without a full reload.
- Local verification was performed against a backend with public plans seeded through existing admin APIs and an unconfigured PhonePe provider. Direct backend checkout calls returned `PAYMENT_PROVIDER_NOT_CONFIGURED`, while repeated browser attempts can surface the backend's duplicate-idempotency follow-up error; the frontend treats both as recoverable checkout failures and keeps the student inside the plans flow.
