# Friendship Points API

## Non-technical introduction

Friendship Points API is a backend app for tracking friendship-related events, rules, notes, and point changes over time.

In plain language, the app lets you:

- add friends or people
- define friendship rules and preferences
- record things that happened
- manually score how positive or negative an event was
- ask an LLM to suggest an assessment
- track a friendship balance
- update friend information
- append new notes without deleting older notes
- later use relationship notes, shared habits, past events, and retrieved context to make better assessments

Example:

```txt
Rule:
Cole dislikes unexpected phone calls.

Event:
I called Cole without warning.

Possible assessment:
This may negatively affect the friendship because it violates a known preference.
```

The project is primarily a learning project for practicing backend engineering, TypeScript, PostgreSQL, Prisma, Fastify, LangChain, structured LLM outputs, retrieval/RAG, testing, observability, security, deployment, and finally a simple responsive frontend.

For the detailed 30-day roadmap and future backlog, see [`ROADMAP.md`](./ROADMAP.md).

---

## Technical overview

A TypeScript backend API for tracking friendship-related events, rules, point changes, notes, and LLM-assisted friendship assessments.

The project currently supports:

- creating and searching friends
- updating friend display names and notes
- appending friend notes without replacing existing notes
- creating mock predictions for hypothetical actions without saving events or assessments
- creating real Mistral predictions for hypothetical actions without saving events or assessments
- creating rules for friends
- creating events for friends
- manually assessing events
- calculating friendship balances
- validating route input with Zod
- creating mock LLM assessments
- creating real Mistral LLM assessments through LangChain
- storing structured LLM assessment metadata
- tracking prompt/model metadata for LLM assessments

---

## Current Status

Day 13 is complete.

Implemented so far:

- Fastify server
- PostgreSQL connection through Prisma
- `Friend`, `Rule`, `Event`, and `Assessment` models
- Friend, rule, event, assessment, and prediction endpoints
- Manual assessment and balance calculation
- Mock LLM assessment endpoint
- Mistral LLM assessment endpoint
- OpenAI/LangChain assessment endpoint, currently blocked by API quota
- Zod validation for manual assessment, friend creation/update/note append, rule creation/weight update, event creation, and prediction requests
- Shared LLM prompt builder
- Shared LLM provider configuration
- Prompt version tracking
- Assessment metadata fields: `modelName` and `promptVersion`
- Prediction input builder for mock and Mistral predictions
- Friend-with-active-rules lookup helper for predictions

Not implemented yet:

- friend soft delete
- authentication/accounts
- RAG/vector search
- frontend

---

## Tech Stack

### Current

- Node.js
- TypeScript
- Fastify
- PostgreSQL
- Prisma
- dotenv
- tsx
- Zod
- LangChain.js
- Mistral via LangChain
- OpenAI via LangChain, route exists but API quota is currently unavailable

### Planned / Future Practice

- Vitest
- Docker
- Supabase
- pgvector or another vector database
- GitHub Actions
- Observability tooling
- LLM tracing tooling
- RAG and reranking tooling
- DeepEval or LangSmith evaluations
- German/EU data privacy compliance planning
- Responsive frontend/GUI as the final task

---

# Current API Endpoints

## Health Check

### `GET /health`

```json
{
  "status": "ok"
}
```

---

## Friends

### `GET /friends`

Returns all friends.

### `GET /friends/:id`

Returns one friend by ID.

### `GET /friends/search?name=Cole`

Searches friends by name.

### `POST /friends`

Creates a new friend.

```json
{
  "displayName": "Test Friend",
  "notes": "Created through API"
}
```

Validation:

- `displayName` must be at least 2 characters.
- `notes` is optional.
- `allowDuplicate` is optional and defaults to `false`.

Duplicate handling:

If a friend with the exact same `displayName` already exists, the API returns `409 Conflict` and the existing friend information.

To intentionally create a duplicate:

```json
{
  "displayName": "Cole William Bailey",
  "notes": "Another person with the same name",
  "allowDuplicate": true
}
```

### `PATCH /friends/:id`

Updates a friend's display name and/or replaces notes.

```json
{
  "displayName": "Cole Updated",
  "notes": "Replacement notes for Cole."
}
```

Notes:

- This endpoint replaces the `notes` field if `notes` is provided.
- Use `POST /friends/:id/notes/append` to append notes without deleting existing notes.
- At least one field must be provided.

### `POST /friends/:id/notes/append`

Appends a new note to an existing friend's notes without replacing old notes.

```json
{
  "note": "Cole also likes clear planning before calls."
}
```

### `DELETE /friends/:id`

Not implemented yet.

Planned approach:

- Use soft delete instead of immediate hard delete.
- Add a `deletedAt DateTime?` field to the `Friend` model.
- Set `deletedAt` when deleting.
- Filter deleted friends out of normal list/search endpoints.
- Keep related rules, events, and assessments available for audit/history unless explicitly designed otherwise.

---

## Rules

### `GET /friends/:friendId/rules`

Returns all rules for a friend.

### `POST /friends/:friendId/rules`

Creates a rule for a friend.

```json
{
  "title": "Unexpected calls are bad",
  "description": "Cole dislikes being called without prior warning.",
  "impactDirection": "negative",
  "weight": "high"
}
```

Validation:

- `title`: 2 to 100 characters
- `description`: 10 to 1000 characters
- `impactDirection`: `positive`, `negative`, `neutral`, or `mixed`
- `weight`: `minimal`, `low`, `medium`, `high`, `critical`, or `extreme`

`extreme` is reserved for rare exceptional cases and should not be used for ordinary high-impact events.

### `PATCH /rules/:ruleId/weight`

Updates a rule's weight.

```json
{
  "weight": "critical"
}
```

Allowed weights:

```txt
minimal
low
medium
high
critical
extreme
```

---

## Events

### `GET /friends/:friendId/events`

Returns all events for a friend.

### `POST /friends/:friendId/events`

Creates an event for a friend.

```json
{
  "eventText": "I called Cole without prior warning.",
  "happenedAt": "2026-05-19T15:00:00.000Z"
}
```

Validation:

- `eventText`: 10 to 2000 characters
- `happenedAt`: optional ISO datetime string

### `GET /events/:eventId`

Returns one event by ID.

---

## Assessments

### `POST /events/:eventId/manual-assessment`

Creates a manual human-written assessment for an event.

```json
{
  "scoreDelta": -3.5,
  "reason": "Testing decimal score."
}
```

Validation:

- `scoreDelta` must be a number between `-10` and `10`.
- `reason` is optional.
- `source` is stored as `manual`.

### `GET /friends/:friendId/balance`

Returns the friendship point balance for a friend by summing all `scoreDelta` values for assessments connected to that friend's events.

```json
{
  "friendId": "friend-id",
  "balance": 9.5
}
```

### `POST /events/:eventId/mock-assessment`

Creates a mock LLM-style assessment without calling a real external model.

Stored source:

```txt
mock
```

### `POST /events/:eventId/mistral-assessment`

Creates a real LLM assessment using Mistral via LangChain.

Stored source:

```txt
mistral
```

The Mistral assessment stores:

```txt
scoreDelta
reasoningSummary
impactDirection
confidence
matchedRuleIds
biasNotes
source
modelName
promptVersion
```

### `POST /events/:eventId/openai-assessment`

Creates a real LLM assessment using the OpenAI/LangChain service.

Status:

```txt
Route exists, but OpenAI API calls are currently blocked by quota.
```

Stored source:

```txt
openai
```

---

## Predictions

### `POST /friends/:friendId/predict`

Creates a mock prediction for a hypothetical action without saving an `Event` or `Assessment`.

Request body:

```json
{
  "hypotheticalAction": "I call Cole without warning tomorrow."
}
```

Response includes:

```txt
prediction
saved: false
provider: mock
```

Purpose:

- Test prediction flow without using external API quota.
- Reuse the same LLM assessment input shape as real event assessment.
- Keep hypothetical predictions separate from persisted event history.

### `POST /friends/:friendId/predict/mistral`

Creates a real Mistral prediction for a hypothetical action without saving an `Event` or `Assessment`.

Request body:

```json
{
  "hypotheticalAction": "I call Cole without warning tomorrow."
}
```

Response includes:

```txt
prediction
saved: false
provider: mistral
```

Important behavior:

- This endpoint should not create a new `Event`.
- This endpoint should not create a new `Assessment`.
- It uses the friend, the friend's notes, and the friend's active rules as context.

---

# Database Models

## Friend

```prisma
model Friend {
  id          String   @id @default(uuid())
  displayName String
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  rules       Rule[]
  events      Event[]
}
```

Planned future extensions:

```prisma
pronouns  String?
deletedAt DateTime?
```

Notes:

- `pronouns` should be optional, user-provided, editable, and privacy-aware.
- In the future multi-user version, pronoun visibility should be controlled by the person the pronouns belong to.
- `deletedAt` is planned for soft delete.

## Rule

```prisma
model Rule {
  id              String   @id @default(uuid())
  friendId        String
  friend          Friend   @relation(fields: [friendId], references: [id])
  title           String
  description     String
  impactDirection String
  weight          String
  active          Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

## Event

```prisma
model Event {
  id          String       @id @default(uuid())
  friendId    String
  friend      Friend       @relation(fields: [friendId], references: [id])
  eventText   String
  happenedAt  DateTime?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  assessments Assessment[]
}
```

## Assessment

```prisma
model Assessment {
  id              String   @id @default(uuid())
  eventId         String
  event           Event    @relation(fields: [eventId], references: [id])
  scoreDelta      Float
  reason          String?
  source          String
  impactDirection String?
  biasNotes       String?
  confidence      Float?
  matchedRuleIds  String[] @default([])
  modelName       String?
  promptVersion   String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

---

# Project Structure

```txt
src/
  app.ts
  server.ts
  db/
    prisma.ts
  routes/
    friends.routes.ts
    rules.routes.ts
    events.routes.ts
    assessments.routes.ts
    predictions.routes.ts
  services/
    friends.service.ts
    assessments.service.ts
    predictions.service.ts
  schemas/
    assessments.schema.ts
    friends.schema.ts
    rules.schema.ts
    events.schema.ts
    predictions.schema.ts
  ai/
    providers.ts
    assessment.types.ts
    assessment.schema.ts
    mockAssessment.service.ts
    langchainAssessment.service.ts
    mistralAssessment.service.ts
    prompts/
      friendshipAssessment.prompt.ts
  types/
  utils/
```

---

# Getting Started

## 1. Install dependencies

```bash
npm install
```

## 2. Create environment file

Create a `.env` file:

```txt
PORT=3000
DATABASE_URL="postgresql://YOUR_USERNAME@localhost:5432/friendship_points_api"
MISTRAL_API_KEY=
OPENAI_API_KEY=
```

Use `.env.example` as a reference. Do not commit `.env`.

## 3. Start PostgreSQL

```bash
brew services start postgresql@16
```

## 4. Create the database

```bash
createdb friendship_points_api
```

## 5. Run Prisma migrations

```bash
npx prisma migrate dev
```

## 6. Generate Prisma client

```bash
npx prisma generate
```

## 7. Run the development server

```bash
npm run dev
```

## 8. Test the health endpoint

```bash
curl http://localhost:3000/health
```

## 9. Open Prisma Studio

```bash
npx prisma studio
```

Usually opens at:

```txt
http://localhost:5555
```

---

# Available Scripts

```bash
npm run dev
npm run build
npm start
```

---

# Development Workflow

Use small commits.

Preferred pattern:

```txt
one logical change = one commit
```

Examples:

```bash
git commit -m "Validate event creation requests with Zod"
git commit -m "Add friend update endpoint"
git commit -m "Add friend note append endpoint"
git commit -m "Add mock prediction endpoint"
git commit -m "Add Mistral prediction endpoint"
git commit -m "Document soft delete plan"
```

---

# Roadmap

The detailed project roadmap has been moved to [`ROADMAP.md`](./ROADMAP.md).

---

# Notes

This is a private learning project meant to be social commentary on government surveillance and the social credit score system imposed by the CCP.

The LLM will be used as an assistant for generating structured suggestions, but the backend will remain responsible for validation, storage, and final business logic.
