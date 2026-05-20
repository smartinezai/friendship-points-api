# Friendship Points API

A TypeScript backend API for tracking friendship-related events, rules, events, point changes, and eventually LLM-assisted friendship assessments.

The long-term goal of this project is to build a production-style backend where friendship-related events can be stored, evaluated, searched, and assessed with help from LangChain, PostgreSQL, retrieval pipelines, and later observability, DevOps, and security tooling.

This is primarily a learning project for practicing backend engineering, TypeScript, PostgreSQL, applied AI engineering, and production-grade AI system design.

## Learning Goals

This project is designed to practice:

- TypeScript
- Fastify
- PostgreSQL
- Prisma
- API design
- relational data modeling
- backend project structure
- LangChain.js
- structured LLM outputs
- RAG and reranking
- vector databases
- Supabase
- Docker
- DevOps workflows
- secure development practices
- observability and debugging
- LLM tracing and analytics
- document ingestion and preprocessing for retrieval
- automated evaluation and testing for LLM features

## Current Status

Day 5 is in progress.

The project currently contains:

- A Fastify server
- A health check endpoint
- PostgreSQL connection through Prisma
- A `Friend` database model
- A `Rule` database model
- An `Event` database model
- Friend API endpoints
- Rule API endpoints
- Event API endpoints

## Tech Stack

### Current

- Node.js
- TypeScript
- Fastify
- PostgreSQL
- Prisma
- dotenv
- tsx

### Planned

- Zod
- LangChain.js
- LLM provider integration
- Vitest
- Docker
- Supabase
- pgvector or another vector database
- GitHub Actions
- Observability tooling
- LLM tracing tooling

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
- Predict the possible impact of hypothetical actions
- Trace, test, and evaluate LLM behavior
- Eventually support RAG, reranking, and vector search

Example rule:

```txt
Cole dislikes unexpected phone calls.
```

Example event:

```txt
I called Cole without prior warning.
```

Example future LLM-assisted assessment:

```json
{
  "score_delta": -6,
  "confidence": 0.82,
  "reasoning_summary": "This likely violates the rule about unexpected phone calls.",
  "matched_rules": ["Unexpected calls are bad"]
}
```

## Current API Endpoints

### Health Check

```http
GET /health
```

Response:

```json
{
  "status": "ok"
}
```

This endpoint checks that the API server is running and reachable.

---

## Friends

### Get All Friends

```http
GET /friends
```

### Get Friend By ID

```http
GET /friends/:id
```

### Search Friends By Name

```http
GET /friends/search?name=Cole
```

### Create Friend

```http
POST /friends
```

Request body:

```json
{
  "displayName": "Test Friend",
  "notes": "Created through API"
}
```

---

## Rules

### Get Rules For Friend

```http
GET /friends/:friendId/rules
```

### Create Rule For Friend

```http
POST /friends/:friendId/rules
```

Request body:

```json
{
  "title": "Unexpected calls are bad",
  "description": "Cole dislikes being called without prior warning.",
  "impactDirection": "negative",
  "weight": "high"
}
```

### Update Rule Weight

```http
PATCH /rules/:ruleId/weight
```

Request body:

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

### Get Events For Friend

```http
GET /friends/:friendId/events
```

### Create Event For Friend

```http
POST /friends/:friendId/events
```

Request body:

```json
{
  "eventText": "I called Cole without prior warning.",
  "happenedAt": "2026-05-19T15:00:00.000Z"
}
```

`happenedAt` is optional.

### Get Event By ID

```http
GET /events/:eventId
```

## Database Models

### Friend

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

### Rule

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

### Event

```prisma
model Event {
  id         String    @id @default(uuid())
  friendId   String
  friend     Friend    @relation(fields: [friendId], references: [id])
  eventText  String
  happenedAt DateTime?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
}
```

## Project Structure

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
  services/
  schemas/
  types/
  utils/
```

### `src/app.ts`

Creates and configures the Fastify app. It defines the `/health` route and registers route files.

### `src/server.ts`

Starts the Fastify server and listens on the configured port.

### `src/db/prisma.ts`

Creates and exports the Prisma client used to query PostgreSQL.

### `src/routes/`

Contains API route definitions.

Current route files:

```txt
friends.routes.ts
rules.routes.ts
events.routes.ts
```

### `src/services/`

Planned location for reusable business logic.

### `src/schemas/`

Planned location for request validation schemas.

### `src/types/`

Planned location for custom TypeScript types.

### `src/utils/`

Planned location for helper functions.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Create environment file

Create a `.env` file:

```txt
PORT=3000
DATABASE_URL="postgresql://YOUR_USERNAME@localhost:5432/friendship_points_api"
```

Use `.env.example` as a reference.

### 3. Start PostgreSQL

Example using Homebrew on macOS:

```bash
brew services start postgresql@16
```

### 4. Create the database

```bash
createdb friendship_points_api
```

### 5. Run Prisma migrations

```bash
npx prisma migrate dev
```

### 6. Generate Prisma client

```bash
npx prisma generate
```

### 7. Run the development server

```bash
npm run dev
```

The server should start on:

```txt
http://localhost:3000
```

### 8. Test the health endpoint

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok"
}
```

### 9. Open Prisma Studio

```bash
npx prisma studio
```

This opens an interactive browser view of the database.

## Available Scripts

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

## Environment Variables

Create a `.env` file in the project root.

```txt
PORT=3000
DATABASE_URL="postgresql://YOUR_USERNAME@localhost:5432/friendship_points_api"
```

Planned future variables:

```txt
OPENAI_API_KEY=
LANGCHAIN_API_KEY=
LANGSMITH_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

---

# Detailed Roadmap

## Phase 1: Core TypeScript API and PostgreSQL Foundations

### Day 1: TypeScript + Fastify Setup

Goals:

- Create the Node.js project
- Add TypeScript
- Add Fastify
- Add a basic server
- Add `.env` support
- Add a `/health` endpoint
- Add GitHub repository setup

Endpoints:

```http
GET /health
```

Learning focus:

- TypeScript project structure
- `app.ts` vs `server.ts`
- Fastify basics
- environment variables
- Git/GitHub workflow

---

### Day 2: PostgreSQL + Prisma Setup

Goals:

- Install and start PostgreSQL locally
- Add Prisma
- Configure `DATABASE_URL`
- Create the first Prisma model
- Run the first migration
- Generate Prisma Client
- Use Prisma Studio
- Connect the Fastify app to PostgreSQL

Database model:

```txt
Friend
```

Learning focus:

- PostgreSQL basics
- Prisma schema
- migrations
- generated Prisma client
- database connection from TypeScript
- Prisma Studio

---

### Day 3: Friends API

Goals:

- Add real friend endpoints
- Move friend routes into `friends.routes.ts`
- Add basic request body handling
- Add friend lookup by ID
- Add friend search by name
- Add friend creation
- Validate required `displayName`

Endpoints:

```http
GET /friends
GET /friends/:id
GET /friends/search?name=...
POST /friends
```

Learning focus:

- route files
- Fastify route generics
- `request.params`
- `request.query`
- `request.body`
- Prisma `findMany`
- Prisma `findUnique`
- Prisma `create`
- basic HTTP status codes

---

### Day 4: Friendship Rules

Goals:

- Add `Rule` model
- Relate rules to friends
- Add endpoints to create and list rules
- Add endpoint to update rule weight
- Practice one-to-many relationships

Database model:

```txt
Rule
```

Endpoints:

```http
GET /friends/:friendId/rules
POST /friends/:friendId/rules
PATCH /rules/:ruleId/weight
```

Learning focus:

- foreign keys
- Prisma relations
- route nesting
- checking whether parent records exist
- updating records
- `createdAt` and `updatedAt`

---

### Day 5: Friendship Events

Goals:

- Add `Event` model
- Relate events to friends
- Add endpoints to create and list events
- Add endpoint to get one event by ID
- Handle optional event dates

Database model:

```txt
Event
```

Endpoints:

```http
GET /friends/:friendId/events
POST /friends/:friendId/events
GET /events/:eventId
```

Learning focus:

- optional fields
- date strings from HTTP requests
- converting strings to `Date`
- event history modeling
- separating event routes from rule routes

---

### Day 6: Manual Scoring and Balance

Goals:

- Add manual scoring before LLM scoring
- Create an assessment or score model
- Store score changes for events
- Calculate friendship balance
- Keep the system useful without AI first

Possible database model:

```txt
Assessment
```

Possible fields:

```txt
id
eventId
scoreDelta
reason
source
createdAt
updatedAt
```

Possible endpoints:

```http
POST /events/:eventId/manual-assessment
GET /friends/:friendId/balance
```

Learning focus:

- numeric fields
- aggregations
- `SUM`
- keeping deterministic logic separate from AI logic
- modeling event assessments

---

### Day 7: Refactor, Validation, and Duplicate Handling

Goals:

- Move repeated database logic into services
- Add validation schemas
- Improve error responses
- Add duplicate friend-name handling
- Clean up route files
- Make the project easier to extend before adding AI

Planned service files:

```txt
src/services/friends.service.ts
src/services/rules.service.ts
src/services/events.service.ts
```

Repeated logic to move:

```txt
friend existence checks
friend lookup by ID
friend creation
friend search by name
```

Duplicate friend-name behavior:

If `POST /friends` receives a `displayName` that exactly matches an existing friend, the API should return `409 Conflict` with the existing friend information.

The duplicate should only be created if the user explicitly confirms it, for example:

```json
{
  "displayName": "Cole William Bailey",
  "notes": "Another person with the same name",
  "allowDuplicate": true
}
```

Learning focus:

- service layer
- cleaner route handlers
- avoiding duplication
- validation design
- conflict responses
- API ergonomics

---

## Phase 2: LangChain and LLM-Assisted Scoring

### Day 8: LLM Assessment Design

Goals:

- Design the LLM assessment flow before coding it
- Decide what data comes from PostgreSQL
- Decide what data goes into the LangChain prompt
- Define expected structured output
- Keep LLM logic separate from database writes

Planned flow:

```txt
event
→ fetch friend
→ fetch active rules
→ build prompt
→ call LLM
→ validate structured output
→ store assessment
```

Learning focus:

- applied AI architecture
- deterministic backend vs LLM logic
- prompt input design
- output contracts

---

### Day 9: Mock LLM Service

Goals:

- Create a mock assessment service
- Avoid real API calls while testing backend logic
- Define an interface for assessment services
- Make it easy to swap mock LLM for LangChain later

Possible files:

```txt
src/ai/mockAssessment.service.ts
src/ai/assessment.types.ts
src/ai/assessment.schema.ts
```

Learning focus:

- dependency separation
- testing without real LLM calls
- interface-driven design
- mocking external services

---

### Day 10: LangChain Integration

Goals:

- Add LangChain.js
- Add an LLM provider
- Create a LangChain assessment chain
- Use prompt templates
- Request structured output

Possible files:

```txt
src/ai/langchainAssessment.service.ts
src/ai/prompts/friendshipAssessment.prompt.ts
```

Learning focus:

- LangChain basics
- prompt templates
- structured output
- model configuration
- safe LLM boundaries

---

### Day 11: LLM Assessment Endpoint

Goals:

- Add endpoint for assessing an existing event
- Fetch event and related friend rules
- Call LangChain assessment service
- Validate LLM output
- Store assessment in PostgreSQL

Possible endpoint:

```http
POST /events/:eventId/assess
```

Learning focus:

- LLM orchestration
- validating model output
- storing model metadata
- separating suggestion from truth

---

### Day 12: Prediction Endpoint

Goals:

- Add endpoint for hypothetical actions
- Use rules and context without saving an event
- Return predicted score impact
- Keep prediction separate from persisted event history

Possible endpoint:

```http
POST /friends/:friendId/predict
```

Request body:

```json
{
  "hypotheticalAction": "I send Cole a long voice message without warning."
}
```

Learning focus:

- temporary inference
- prediction vs saved facts
- API design for AI features

---

### Day 13: Testing

Goals:

- Add Vitest
- Test friends, rules, events, and balance logic
- Test validation behavior
- Test mock LLM behavior
- Avoid testing real LLM calls at first

Learning focus:

- unit tests
- integration-ish route tests
- mocking
- regression prevention

---

### Day 14: Polish and Documentation

Goals:

- Update README
- Add `.env.example`
- Document endpoints
- Document architecture
- Clean up route files
- Commit a stable two-week project version

Learning focus:

- technical documentation
- project presentation
- portfolio readiness

---

## Phase 3: Retrieval, RAG, Vector Search, and Document Pipelines

### Future Task: RAG and Reranking

Goals:

- Retrieve relevant rules, events, and notes for a new event
- Use semantic search instead of only direct rule fetching
- Add reranking to prioritize the most relevant retrieved context
- Pass reranked context into LangChain scoring

Possible flow:

```txt
new event text
→ embedding search
→ retrieve candidate rules/events/notes
→ rerank candidates
→ pass best context to LangChain
→ generate assessment
```

Learning focus:

- retrieval-augmented generation
- semantic search
- reranking
- context selection
- RAG evaluation

---

### Future Task: Vector Database

Goals:

- Store embeddings for rules, events, and longer notes
- Retrieve semantically similar context
- Compare vector database options

Possible tools:

```txt
pgvector
Supabase Vector
Qdrant
Chroma
Weaviate
Pinecone
```

Recommended starting point:

```txt
pgvector / Supabase Vector
```

Reason:

- The project already uses PostgreSQL
- Supabase is also planned
- pgvector fits naturally with relational data

Learning focus:

- embeddings
- vector similarity
- metadata filtering
- hybrid retrieval
- vector database tradeoffs

---

### Future Task: Document Analysis and Preprocessing for Retrieval

Goals:

- Upload or ingest documents
- Extract text from messy files
- Clean and normalize text
- Split documents into chunks
- Add metadata
- Store chunks
- Create embeddings
- Index for retrieval
- Evaluate retrieval quality

Possible file types:

```txt
PDF
DOCX
TXT
CSV
Markdown
chat exports
personal notes
```

Possible flow:

```txt
uploaded document
→ text extraction
→ cleaning
→ chunking
→ metadata enrichment
→ embeddings
→ vector storage
→ retrieval
→ reranking
→ LangChain assessment
```

Learning focus:

- document ingestion
- preprocessing
- chunking strategies
- metadata design
- retrieval quality

---

## Phase 4: Supabase and Deployment-Oriented Database Practice

### Future Task: Supabase

Goals:

- Move from local PostgreSQL to Supabase-hosted Postgres
- Update `DATABASE_URL`
- Run Prisma migrations against Supabase
- Use Supabase dashboard to inspect tables
- Optionally explore Supabase Auth later
- Optionally use Supabase Vector / pgvector

Learning focus:

- hosted Postgres
- cloud database connection strings
- database migrations in hosted environments
- Supabase dashboard
- Supabase Vector

---

### Future Task: Data Model Refactor to Support Multiple People

Current model:

```txt
event = me ↔ friend
```

Future model idea:

```txt
event = person A ↔ person B
```

Goals:

- Model the user as a person entry too
- Consider renaming `Friend` to `Person`
- Allow events between any two people
- Avoid hardcoding the user as the implicit source of all events

Possible future models:

```txt
Person
Relationship
EventParticipant
Event
```

Learning focus:

- data modeling
- many-to-many relationships
- refactoring schemas
- migration planning

---

## Phase 5: DevOps, Docker, and Production Readiness

### Future Task: Docker

Goals:

- Containerise the API
- Containerise PostgreSQL
- Add `Dockerfile`
- Add `docker-compose.yml`
- Run the full app locally with Docker

Possible services:

```txt
api
postgres
```

Learning focus:

- Docker basics
- Dockerfile
- docker-compose
- environment variables in containers
- local development environments

---

### Future Task: DevOps

Goals:

- Add GitHub Actions CI
- Run build checks on push
- Run tests in CI
- Add deployment workflow later
- Manage production environment variables
- Handle Prisma migrations during deployment
- Add health checks
- Separate development and production configs

Possible tools/platforms:

```txt
GitHub Actions
Render
Railway
Fly.io
VPS
Docker
```

Learning focus:

- CI pipelines
- deployment
- environment management
- production readiness
- migration safety

---

## Phase 6: Security

### Future Task: Secure Development Practices

Goals:

- Add stronger input validation
- Add authentication and authorization
- Protect private friendship data
- Improve secret management
- Add dependency vulnerability scanning
- Add rate limiting
- Avoid raw internal error exposure
- Add audit logging
- Add safe LLM usage patterns
- Add prompt-injection awareness
- Add security checks in CI

Possible security examples:

```txt
Do not commit .env
Validate all request bodies
Avoid exposing stack traces
Rate-limit LLM endpoints
Scan dependencies
Protect private endpoints
Check retrieved context for prompt injection risks
```

Learning focus:

- secure API development
- secret handling
- auth basics
- rate limiting
- secure LLM application design

---

## Phase 7: Observability, Debugging, and LLM Analytics

### Future Task: Observability Tooling

Goals:

- Add structured logging
- Log API requests and errors
- Track endpoint latency
- Track endpoint usage
- Capture exceptions
- Add metrics
- Add tracing
- Visualize behavior in dashboards

Possible tools:

```txt
Grafana
Sentry
PostHog
OpenTelemetry
custom logging dashboards
```

Learning focus:

- debugging production systems
- logs
- metrics
- traces
- error monitoring
- performance diagnosis

---

### Future Task: LLM Tracing and Analytics

Goals:

- Trace LangChain/LLM calls
- Inspect prompts and responses
- Track token usage
- Track latency and cost
- Monitor invalid structured outputs
- Compare prompt versions
- Analyze retrieved context quality
- Debug RAG/reranking behavior

Possible tools:

```txt
LangSmith
Langfuse
Helicone
OpenTelemetry
custom logging dashboards
```

Example data to track:

```txt
event input
matched rules
retrieved context
reranked context
prompt version
model name
token usage
latency
cost
structured output validity
final score_delta
```

Learning focus:

- LLM observability
- prompt debugging
- cost tracking
- latency tracking
- RAG debugging
- production AI monitoring

---

## Phase 8: Automated Evaluation for LLM Features

### Future Task: LLM Evaluation and Testing

Goals:

- Create golden test cases for event assessments
- Test structured output validity
- Evaluate scoring consistency
- Check whether relevant rules are matched
- Regression test prompt changes
- Add CI checks for mocked LLM flows
- Explore LLM evaluation tools

Possible tools:

```txt
DeepEval
LangSmith evaluations
Vitest
custom evaluation scripts
```

Example test case:

```txt
Input event:
I called Cole without warning.

Expected matched rule:
Unexpected calls are bad.

Expected score direction:
negative.

Expected output:
valid JSON with score_delta, confidence, reasoning_summary, and matched_rules.
```

Learning focus:

- automated AI evaluation
- prompt regression testing
- deterministic tests around nondeterministic systems
- structured output validation
- scoring quality checks

---

## Notes

This is a private learning project meant to be social commentary on government surveillance.

The LLM will be used as an assistant for generating structured suggestions, but the backend will remain responsible for validation, storage, and final business logic.
