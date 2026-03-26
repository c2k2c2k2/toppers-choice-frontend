# Frontend Prompt 07: Guidance, English Speaking, and Current Affairs

## Depends On
- `references/03_execution/06_frontend_notes_library_preview_and_secure_reader.md`
- Backend step `B07`

## Prompt
```text
We are implementing Topper's Choice frontend step F07: structured content experiences beyond notes.

Read these references first:
- references/01_product/01_toppers_choice_product_understanding.md
- references/03_execution/00_master_index.md

Task:
- Build the student-facing experiences for Career Guidance, Interview Guidance, English Speaking, and Current Affairs / Monthly Updates.
- Reuse a common content-list and content-detail rendering strategy so these modules feel cohesive instead of four separate mini-apps.
- Ensure Marathi and mixed-language content render correctly, including legacy Marathi support where needed.

Must include:
- content listing and detail templates
- category/track/medium filtering where relevant
- reusable rich content renderer
- support for mixed-language and Marathi presentation
- student dashboard entry points and content discovery patterns
- public vs authenticated behavior only where required by backend rules

Constraints:
- Do not force every content type into the note-reader experience
- Keep content rendering reusable for admin preview later

Done when:
- All non-note student learning modules have usable frontend homes
- Legacy and Unicode Marathi content can render through shared helpers
- Tracker is updated
```

## Out Of Scope
- Question authoring
- Admin CRUD
