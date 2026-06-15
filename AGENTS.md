# Repository Guidelines

## Project Structure & Module Organization
This repository is a Next.js App Router project for budget tracking. Main application code lives in `src/`:
- `src/app/` routes, layouts, and API handlers
- `src/components/` reusable UI such as `BudgetForm.tsx` and `ExpenseList.tsx`
- `src/hooks/` React Query hooks and client-side state helpers
- `src/lib/` Prisma, auth, and validation utilities

Database schema and seed data live in `prisma/`. Static assets live in `public/`. Working notes, testing steps, and implementation history are in `Docs/`. Utility scripts for database setup and migration are in `scripts/`.

## Build, Test, and Development Commands
- `npm run dev` starts the local app at `http://localhost:3000`
- `npm run build` runs `prisma generate` and builds for production
- `npm run start` serves the production build
- `npm run lint` runs ESLint across the project
- `npm run seed` seeds the database from `prisma/seed.ts`

For local database work, use the repo scripts and docs in `scripts/README.md` and `SETUP_DB_README.md`.

## Coding Style & Naming Conventions
Use TypeScript with strict mode enabled. Follow the existing style: 2-space indentation, single quotes, semicolons omitted, and functional React components. Components use PascalCase (`ExpenseModal.tsx`), hooks use `useX` naming (`useBudgetData.ts`), and route handlers stay under `src/app/api/**/route.ts`.

Run `npm run lint` before opening a PR. ESLint is configured through `eslint.config.mjs`; Tailwind v4 styles are defined in `src/app/globals.css` and `src/styles/globals.css`.

## Testing Guidelines
There is no automated test suite checked in yet. Current validation is manual and documented in [Docs/TESTING_GUIDE.md](/C:/Users/Fernando/Documents/FerJuan/budget-tracker/Docs/TESTING_GUIDE.md). At minimum, verify auth, budget creation, expense CRUD, filtering, period closing, and protected routes after changes.

When adding tests later, keep them close to the feature and name them after behavior, for example `expense-form.test.tsx`.

## Commit & Pull Request Guidelines
Recent commits are short and task-focused, for example `added prisma generate to package.json`. Keep that style, but make it more specific than `fixed`. Prefer one-line imperative summaries scoped to the change.

PRs should include:
- a short description of the user-visible change
- linked issue or task reference when available
- screenshots for UI changes, especially dashboard and auth flows
- manual test notes listing the scenarios you verified

## Security & Configuration Tips
Do not commit `.env` files or secrets. This app expects `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL`. Check Prisma and auth settings before running seeds or migrations.
