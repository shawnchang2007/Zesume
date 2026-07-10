# Zesume

AI resume rewriting for Gen Z applicants.

## v1.1 Features

- Paste resume text directly in `/app`
- Upload `.txt` and `.docx` resumes
- Extract uploaded resume text without saving the original file
- Rewrite resumes for Software Engineering, Quant, and Finance / Spring Week
- Choose Professional, Concise, or Technical tone
- Download generated results as `.txt`
- Download generated results as `.docx`

Not included in v1.1: PDF upload, PDF export, original formatting restoration,
online resume editing, or complex resume layout.

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

## Cloudflare Workers

Cloudflare credentials should stay local and must not be committed. Use the
`CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` placeholders in
`.env.example` when setting up local deployment tooling.

Zesume deploys as a full-stack Next.js app on Cloudflare Workers using
OpenNext. The app uses route handlers for resume extraction, rewriting, and
DOCX export, so Workers/OpenNext is preferred over static Cloudflare Pages.

Useful commands:

```bash
npm run preview
npm run deploy
```

Cloudflare runtime secrets such as `DEEPSEEK_API_KEY` should be configured in
Cloudflare, not committed to GitHub.

## Memory Architecture

Phase 1 adds the database and service foundation for future user memory:

- PostgreSQL + Prisma schema
- `users`, `user_profiles`, `experiences`, `experience_bullets`, `user_preferences`, and `resume_generations`
- profile memory service
- generation history service
- rule-based experience retrieval service
- optional `useMemory` support in the rewrite API

The current pasted or uploaded resume remains the primary source. Memory is only supporting context and should not be used to invent facts.

Phase 1 does not add login UI yet. When `useMemory` is true but there is no
authenticated user, the rewrite API falls back to the existing no-memory flow.
Before enabling real profile/history reads in production, connect an auth
provider and configure a real PostgreSQL `DATABASE_URL`.
This project currently uses Prisma 7, so the first production database hookup
should also add the appropriate PostgreSQL driver adapter before real queries are
enabled.
