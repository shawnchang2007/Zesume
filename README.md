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
- Upload a custom `.txt` or `.docx` resume template and analyze its reusable
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
- Sign in and sign out with Google through Auth.js
- Continue using the core rewriter without an account

Not included in v1.1: PDF upload, PDF export, original formatting restoration,
online resume editing, or complex resume layout.

Uploaded templates are processed in memory and are not saved to the server.
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
  validated `uploadedTemplateSpec`

Useful commands:

```bash
npm run preview
npm run deploy
```

Cloudflare runtime secrets such as `DEEPSEEK_API_KEY` should be configured in
Cloudflare, not committed to GitHub.

Production resume rewrites use a 45-second provider timeout and a Cloudflare
rate-limiting binding. Until user authentication is available, the rewrite
limit is 10 requests per minute per anonymous network source. Workers
observability records invocation status and sanitized error codes only; resume
text and uploaded file contents must never be written to logs.

## Memory Architecture

Phase 1 adds the database and service foundation for future user memory:

- PostgreSQL + Prisma schema
- `users`, `user_profiles`, `experiences`, `experience_bullets`, `user_preferences`, and `resume_generations`
- profile memory service
- generation history service
- rule-based experience retrieval service
- optional `useMemory` support in the rewrite API

The current pasted or uploaded resume remains the primary source. Memory is only supporting context and should not be used to invent facts.

Google login is available, but anonymous rewriting remains supported. When
`useMemory` is true but there is no authenticated user, the rewrite API falls
back to the existing no-memory flow.
Before enabling real profile/history reads in production, connect an auth
provider and configure a real PostgreSQL `DATABASE_URL`.
This project currently uses Prisma 7, so the first production database hookup
should also add the appropriate PostgreSQL driver adapter before real queries are
enabled.

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

Production currently keeps database-backed profile and history features in a
safe disabled state while `DATABASE_URL` is a placeholder. Connect a real
PostgreSQL database and apply the migration before enabling persistence. Google
login and the resume tools continue to work during this transition.

`DATABASE_RUNTIME_ENABLED=false` keeps Prisma out of local or transitional
Cloudflare builds while persistence is unavailable. The production deploy
script builds with the database runtime enabled and uses Prisma 7's Cloudflare
runtime with `@prisma/adapter-pg`. Apply the migration before deploying that
mode so Auth.js never points at an empty schema.
