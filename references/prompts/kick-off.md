We are starting a new production-grade web application called “Toppers Choice”.

Architecture:
- Multi-repo setup
- Frontend repo: Next.js + TypeScript
- Backend repo: NestJS + TypeScript
- Frontend and backend will be developed independently but must remain contract-driven
- This project is similar in structure to Dhurandhar, but this is a new client, so do not copy UI or code blindly
- The product must feel more modern, dynamic, modular, and maintainable

Product surfaces:
1. Landing page
2. Student web app / PWA
3. Admin panel

Primary goal:
Build a scalable, dynamic, admin-driven education platform for competitive exam preparation.

Core business areas from client requirements:
- Notes related to MPSC and allied exams
- Notes related to Bank, Staff, Railway and allied exams
- Career Guidance
- Practice Papers
- Interview Guidance
- English Speaking
- Monthly updates / current affairs style updates
- Multi-medium / multi-track content in some modules (Marathi / English / Hindi-English / Marathi-English where applicable)

High-level product expectations:
- Highly dynamic system, not hardcoded pages
- Admin should control taxonomy, content, ordering, visibility, publishing, featured sections, and most landing page content
- Student side should be mobile-first and PWA-ready
- Clean, premium, academic, trustworthy UI
- Strong backend architecture with future extensibility
- Role-based admin access from day one
- Contract-first development between frontend and backend

What I want from you in this task:
I do NOT want code immediately.
First, I want you to act like a senior solution architect and produce a complete implementation kickoff plan for this project.

Deliverables required in this exact order:

1. Product understanding
- Summarize the product in a clear way
- Identify major modules
- Identify all user types
- Identify what should be dynamic/admin-managed
- Identify possible risks or ambiguities in requirements

2. Recommended architecture
- Frontend architecture for Next.js app
- Backend architecture for NestJS app
- API design approach
- Suggested folder structure for frontend repo
- Suggested folder structure for backend repo
- Shared contract strategy between repos

3. Data model planning
- Identify core entities/modules
- Separate master data, content data, transactional data, and access-control data
- Suggest normalized schema structure conceptually
- Especially cover:
  - notes
  - subjects/topics/subtopics
  - exam categories
  - practice papers
  - question bank
  - career guidance
  - interview guidance
  - english speaking
  - landing page cms
  - admin users/roles/permissions
  - student attempts/results

4. Backend module breakdown
- Give step-by-step backend development order
- For each module, explain:
  - purpose
  - key entities
  - major APIs
  - dependencies
  - edge cases
- Prefer production-oriented NestJS module boundaries

5. Frontend module breakdown
- Separate:
  - landing page
  - student app
  - admin panel
- For each one, list:
  - routes/pages
  - reusable components
  - state needs
  - API integration needs
  - rendering strategy if relevant

6. Dynamic CMS/admin strategy
- Explain how to make this project highly dynamic
- Clearly define what should never be hardcoded
- Suggest reusable admin patterns for CRUD, publishing, filters, ordering, featured content, visibility, and access control

7. Development roadmap
- Break the project into practical implementation phases
- Suggest the best order to start development
- Mention what should be built first so frontend and backend can move in parallel

8. Codex execution plan
- Break the work into small prompts/tasks that can be given to Codex incrementally
- Do not generate 1 giant task
- Give me a sequence of implementation prompts I can run one by one

Important constraints:
- Think in a real production mindset
- Prefer maintainability over shortcuts
- Avoid unnecessary overengineering
- Keep future scale in mind
- Do not assume vague things silently; call them out explicitly
- Do not generate code in this response unless absolutely required for explanation
- Be concrete, structured, and implementation-friendly

Technical assumptions:
- Frontend: Next.js, TypeScript, likely App Router
- Backend: NestJS, TypeScript
- DB: recommend the best practical SQL option and ORM
- PWA support is required for student-facing experience
- Admin panel may live inside the same Next.js frontend repo as a route group or clearly separated app sections if justified
- Authentication and authorization must be robust and extensible

Output format:
Use proper headings.
Be detailed.
Be actionable.
Avoid fluff.