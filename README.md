# Friendship Points API

A TypeScript backend API for tracking friendship-related events, rules, point changes, and LLM-assisted friendship assessments.

The long-term goal of this project is to build a production-style backend where friendship-related events can be stored, evaluated, searched, and assessed with help from LangChain, PostgreSQL, retrieval pipelines, and later observability, DevOps, security, evaluation tooling, and finally a responsive frontend.

This is primarily a learning project for practicing backend engineering, TypeScript, PostgreSQL, applied AI engineering, and production-grade AI system design.

For the detailed 21-day roadmap and future backlog, see [`ROADMAP.md`](./ROADMAP.md).

---

## Learning Goals

This project is designed to practice:

- TypeScript
- Fastify
- PostgreSQL
- Prisma
- API design
- relational data modeling
- backend project structure
- service-layer refactoring
- Zod validation
- LangChain.js
- structured LLM outputs
- Mistral and OpenAI-style LLM provider integrations
- prompt design
- bias-aware LLM assessment
- RAG and reranking
- vector databases
- Supabase
- Docker
- DevOps workflows
- secure development practices
- observability and debugging
- logging and monitoring
- LLM tracing and analytics
- document ingestion and preprocessing for retrieval
- automated evaluation and testing for LLM features
- eventually, a responsive GUI/frontend as the final task

---

## Current Status

Day 10 is in progress.

The project currently contains:

- A Fastify server
- A health check endpoint
- PostgreSQL connection through Prisma
- A `Friend` database model
- A `Rule` database model
- An `Event` database model
- An `Assessment` database model
- Friend API endpoints
- Rule API endpoints
- Event API endpoints
- Manual assessment endpoint
- Balance calculation endpoint
- Mock LLM assessment endpoint
- Mistral LLM assessment endpoint
- OpenAI/LangChain assessment endpoint, currently blocked by API quota
- Zod schema validation for structured LLM output
- Service helpers for repeated assessment logic
- Shared friendship assessment prompt builder
- Shared LLM provider configuration
- Prompt version tracking
- Assessment metadata fields for `modelName` and `promptVersion`

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
- Evaluation frameworks such as DeepEval or LangSmith evaluations
- A responsive frontend/GUI as the final task

---

## Project Goal

The final API should allow me to:

- Create friend profiles
- Define friendship rules for a specific friend
- Add friendship-related events
- Store subjective friendship events in PostgreSQL
- Add manual point assessments
- Query friendship point balances
- Use LangChain to assess event impact
- Use rules and retrieved context to support LLM assessments
- Classify events as positive, negative, mixed, or neutral
- Account for narrator bias and missing context
- Predict the possible impact of hypothetical actions
- Trace, test, and evaluate LLM behavior
- Eventually support RAG, reranking, vector search, document ingestion, and production-style monitoring
- Eventually offer a responsive GUI/frontend after the backend and AI system are mature

Example LLM-assisted assessment:

```json
{
  "scoreDelta": -6.5,
  "impactDirection": "negative",
  "confidence": 0.82,
  "reasoningSummary": "This likely violates the rule about unexpected phone calls.",
  "matchedRuleIds": ["rule-id-1"],
  "biasNotes": "The event is described from one perspective, so missing context may affect the assessment."
}
```

---

# Current API Endpoints

## Health Check

### `GET /health`

Checks whether the API server is running.

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

### `PATCH /rules/:ruleId/weight`

Updates a rule's weight.

```json
{
  "weight": "medium"
}
```

Allowed weights currently include:

```txt
minimal
low
medium
high
critical
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

`happenedAt` is optional.

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
  services/
    friends.service.ts
    assessments.service.ts
  ai/
    providers.ts
    assessment.types.ts
    assessment.schema.ts
    mockAssessment.service.ts
    langchainAssessment.service.ts
    mistralAssessment.service.ts
    prompts/
      friendshipAssessment.prompt.ts
  schemas/
  types/
  utils/
```

## Important Files

### `src/services/`

Contains reusable application/database logic.

Current service helpers include:

```txt
getFriendById
getEventWithFriendAndActiveRules
buildLlmAssessmentInput
saveLlmAssessment
assessEventWithProvider
```

### `src/ai/`

Contains LLM-related types, schemas, shared provider config, prompts/services, and provider-specific assessment logic.

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

Use `.env.example` as a reference.

Do not commit `.env`.

## 3. Start PostgreSQL

Example using Homebrew on macOS:

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

The server should start on:

```txt
http://localhost:3000
```

## 8. Test the health endpoint

```bash
curl http://localhost:3000/health
```

## 9. Open Prisma Studio

```bash
npx prisma studio
```

This opens an interactive browser view of the database, usually at:

```txt
http://localhost:5555
```

---

# Available Scripts

```bash
npm run dev
```

Runs the server in development mode with automatic reload using `tsx watch`.

```bash
npm run build
```

Compiles the TypeScript code.

```bash
npm start
```

Runs the compiled JavaScript code from the `dist` folder.

---

# Environment Variables

Create a `.env` file in the project root.

```txt
PORT=3000
DATABASE_URL="postgresql://YOUR_USERNAME@localhost:5432/friendship_points_api"
MISTRAL_API_KEY=
OPENAI_API_KEY=
```

Planned future variables:

```txt
LANGCHAIN_API_KEY=
LANGSMITH_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

---

# Development Workflow

Going forward, this project should use small commits.

Preferred pattern:

```txt
one logical change = one commit
```

Examples:

```bash
git commit -m "Add Mistral assessment service"
git commit -m "Add Mistral assessment route"
git commit -m "Improve LLM rule matching prompt"
git commit -m "Extract assessment provider orchestration helper"
```

---

# Hosting Direction

A good future deployment path is:

```txt
API backend: Render, Railway, or Fly.io
Database: Supabase or Neon Postgres
Frontend later: Vercel, Netlify, Render static site, or similar
```

Streamlit is not a natural fit for this backend because this project is a Node.js/Fastify API, while Streamlit is primarily a Python data-app framework.

---

# Roadmap

The detailed project roadmap has been moved to [`ROADMAP.md`](./ROADMAP.md).

---

# Notes

This is a private learning project meant to be social commentary on government surveillance and the social credit score system imposed by the CCP.

The LLM will be used as an assistant for generating structured suggestions, but the backend will remain responsible for validation, storage, and final business logic.
