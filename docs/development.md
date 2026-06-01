# Development Guide

## Install dependencies

```bash
npm install
```

## Environment variables

Create a `.env` file:

```txt
PORT=3000
DATABASE_URL="postgresql://YOUR_USERNAME@localhost:5432/friendship_points_api"
MISTRAL_API_KEY=
OPENAI_API_KEY=
```

Do not commit `.env`.

## Local database setup

Start PostgreSQL:

```bash
brew services start postgresql@16
```

Create the database:

```bash
createdb friendship_points_api
```

Run migrations:

```bash
npx prisma migrate dev
```

Generate Prisma client:

```bash
npx prisma generate
```

Open Prisma Studio:

```bash
npx prisma studio
```

## Run the app

Development server:

```bash
npm run dev
```

Health check:

```bash
curl http://localhost:3000/health
```

## Available scripts

```bash
npm run dev
npm run build
npm start
npm test
npm run lint
```

Meaning:

```txt
npm run dev
→ starts the development server with tsx watch

npm run build
→ runs the TypeScript compiler

npm start
→ runs compiled JavaScript from dist

npm test
→ runs Vitest

npm run lint
→ runs ESLint
```

## Manual quality checks

Run before committing substantial changes:

```bash
npm run lint
npm test
npm run build
```

## Husky pre-push checks

Current pre-push hook:

```bash
echo "Running pre-push hook..."
npm run lint
npm test
npm run build
```

This means:

```txt
git push
→ run lint
→ run tests
→ run TypeScript build
→ push only if all checks pass
```

## GitHub Actions CI

CI runs on:

```txt
push
pull_request
```

Current CI flow:

```txt
checkout repository
→ set up Node.js
→ npm ci
→ npx prisma generate
→ npm run lint
→ npm test
→ npm run build
```

CI includes a dummy `DATABASE_URL` so Prisma can generate the client in the clean GitHub runner environment.

## Commit workflow

Use small commits.

Preferred pattern:

```txt
one logical change = one commit
```

Preferred commit-message style:

```bash
git commit -m "Add test for prediction input builder"
git commit -m "Add bad request helper for query errors"
git commit -m "Use shared error helpers in event routes"
git commit -m "Document testing foundation"
```

Avoid vague commit messages like:

```bash
git commit -m "Test prediction input builder"
```

## Current near-term work

```txt
Day 21: Data Model Hardening
Day 22: Friend Management Route Tests
Day 23: Documentation and Portfolio Polish
Day 24: Keyword Search over Rules, Notes, and Events
```
