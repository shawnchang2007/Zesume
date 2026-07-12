# Zesume

AI resume rewriting for Gen Z applicants.

## v1.1 Features

- Paste resume text directly in `/app`
- Upload `.txt` and `.docx` resumes
- Extract uploaded resume text without saving the original file
- Rewrite resumes for Software Engineering, Quant, and Finance / Spring Week
- Choose a separate career target and resume structure template
- Built-in Classic ATS, SWE Project-Heavy, Quant Research, Finance Spring Week,
  and One-Page Student templates
- Plus and Pro users can upload a custom `.txt` or `.docx` resume template and analyze its
  section order, content rules, density, and bullet style with DeepSeek
- Rewrite a resume with the analyzed uploaded template as its structure and
  style guide while keeping the user's resume as the only source of facts
- Generate two synchronized AI outputs: standalone professional resume text
  and structured template-document data
- Export uploaded `.docx` templates by filling their original OOXML text slots
  in place, preserving columns, colors, typography, rules, margins, and tables
- Choose Professional, Concise, or Technical tone
- Download generated results as `.txt`
- Download generated results as `.docx`
- Explicitly save generated resumes to account history and download them later
  as `.txt` or `.docx` from the Dashboard
- Pro Career Memory with editable Education, Work Experience, Project, Award,
  Skill, Certification, and Volunteering items
- Pro resume-to-Memory import with an AI draft that must be reviewed before save
- Sign in and sign out with Google through Auth.js
- Continue using the core rewriter without an account

Not included in v1.1: PDF upload, PDF export, original formatting restoration,
online resume editing, or complex resume layout.

Uploaded template files are processed in memory and are not saved to the server.
For Plus and Pro users, the sanitized template specification is stored under a
server-owned `customTemplateId` for up to 24 hours; rewrite requests never trust
client-supplied template rules. Zesume does not expose a saved template library.
Template examples are treated as untrusted reference data: names, companies,
schools, dates, metrics, and other example facts are excluded from the reusable
template specification.

For uploaded DOCX templates, the browser keeps the original file only for the
current session. Template-matched export submits that file together with the
generated structured resume and modifies only `word/document.xml`; the source
template is never persisted by the application.

## Local Setup

```bash
npm install
npm run dev
```

The app runs locally at `http://127.0.0.1:3001` when started with:

```bash
npm run dev -- --hostname 127.0.0.1 --port 3001
```

Copy `.env.example` to `.env.local` and configure the AI provider you want to use.

Google OAuth uses `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, and
`AUTH_URL`. The local callback is `/api/auth/callback/google`; production uses
`https://zesume.xyz/api/auth/callback/google`. Keep both secrets out of Git.

## Cloudflare Workers

Cloudflare credentials should stay local and must not be committed. Use the
`CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` placeholders in
`.env.example` when setting up local deployment tooling.

Zesume deploys as a full-stack Next.js app on Cloudflare Workers using
OpenNext. The app uses route handlers for resume extraction, uploaded-template
analysis, rewriting, and DOCX export, so Workers/OpenNext is preferred over
static Cloudflare Pages.

The uploaded-template flow uses:

- `POST /api/resume/template/analyze` with multipart form data
- `POST /api/resume/rewrite` with `templateId: "uploaded-template"` and the
  server-issued `customTemplateId`

Useful commands:

```bash
npm run preview
npm run deploy
```

Cloudflare runtime secrets such as `DEEPSEEK_API_KEY` should be configured in
Cloudflare, not committed to GitHub.

Production resume rewrites use a 45-second provider timeout, plan-based usage
tracking, and a Cloudflare rate-limiting binding. Workers
observability records invocation status and sanitized error codes only; resume
text and uploaded file contents must never be written to logs.

## Memory Architecture

Phase 1 adds the database and service foundation for future user memory:

- PostgreSQL + Prisma schema
- profiles, Career Items, preferences, generations, subscriptions, entitlements,
  and usage events
- profile memory service
- generation history service
- rule-based Career Item retrieval service
- optional `useMemory` support in the rewrite API

The current pasted or uploaded resume remains the primary source. Memory is only supporting context and should not be used to invent facts.

Google login is available, but anonymous rewriting remains supported. When
`useMemory` is true but there is no authenticated user, the rewrite API falls
back to the existing no-memory flow.
Production uses Auth.js database sessions, Prisma Postgres, and
`@prisma/adapter-pg` through OpenNext's official Prisma packaging flow.

## v2 Access Foundation

The v2 Phase 1 foundation adds:

- Auth.js-compatible `User`, `Account`, `Session`, and `VerificationToken` models
- Basic Profile, subscription, entitlement, usage, custom-template, history,
  Career Item, Skill, Tag, and import-draft models
- centralized plan rules in `src/lib/billing/plan-config.ts`
- server-side access resolution in `src/lib/billing/access.ts`
- `GET /api/billing/access`
- authenticated `GET/PATCH /api/profile`
- one permission-aware `/dashboard` for Free, Plus, and Pro

The generated PostgreSQL migration is stored in
`prisma/migrations/20260711_v2_access_foundation`. Do not run it against an
existing database without reviewing whether that database already contains the
legacy Phase 1 memory tables.

`DATABASE_RUNTIME_ENABLED` controls business persistence and
`AUTH_DATABASE_ENABLED` independently controls the Auth.js Prisma Adapter. Both
are enabled in production. Prisma uses the standard generated client because
OpenNext must patch it for the Workers runtime.

Useful verification commands:

```bash
npm test
npm run typecheck
npm run build:worker
TEST_DATABASE_URL=postgresql://.../zesume_test npm run test:db
PRODUCTION_BASE_URL=https://zesume.xyz npm run test:smoke
```

The database integration script refuses to run unless the database name contains
`test` and its public schema is empty. It runs both migrations and CRUD checks in
a transaction that is rolled back.
