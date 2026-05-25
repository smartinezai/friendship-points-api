# Friendship Points API Roadmap

This file contains the detailed 21-day roadmap and future backlog for the Friendship Points API project.

The main project README is in [`README.md`](./README.md).

---

# Detailed 21-Day Roadmap

## Phase 1: Core TypeScript API and PostgreSQL Foundations

## Day 1: TypeScript + Fastify Setup

Status: Done.

Goals:

- Create the Node.js project
- Add TypeScript
- Add Fastify
- Add a basic server
- Add `.env` support
- Add a `/health` endpoint
- Add GitHub repository setup

Endpoint:

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

## Day 2: PostgreSQL + Prisma Setup

Status: Done.

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

## Day 3: Friends API

Status: Done.

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

## Day 4: Friendship Rules

Status: Done.

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

## Day 5: Friendship Events

Status: Done.

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

## Day 6: Manual Scoring and Balance

Status: Done.

Goals:

- Add manual scoring before LLM scoring
- Create `Assessment` model
- Store score changes for events
- Calculate friendship balance
- Keep the system useful without AI first
- Change `scoreDelta` from `Int` to `Float` to support decimal scores

Database model:

```txt
Assessment
```

Endpoints:

```http
POST /events/:eventId/manual-assessment
GET /friends/:friendId/balance
```

Learning focus:

- numeric fields
- decimal scores
- aggregations
- `SUM`
- keeping deterministic logic separate from AI logic
- modeling event assessments

---

## Day 7: Refactor, Validation, and Duplicate Handling

Status: Done.

Goals:

- Move repeated database logic into services
- Add duplicate friend-name handling
- Clean up route files
- Improve validation/error responses
- Make the project easier to extend before adding AI

Implemented service files:

```txt
src/services/friends.service.ts
```

Duplicate friend-name behavior:

If `POST /friends` receives a `displayName` that exactly matches an existing friend, the API returns `409 Conflict` with the existing friend information.

The duplicate is only created if the user explicitly confirms it:

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

## Day 8: LLM Assessment Design

Status: Done.

Goals:

- Design the LLM assessment flow before coding it
- Decide what data comes from PostgreSQL
- Decide what data goes into the LLM prompt
- Define expected structured output
- Add bias-aware assessment design
- Allow the LLM to classify events as positive, negative, mixed, or neutral
- Keep LLM logic separate from database writes

Planned / implemented flow:

```txt
event
→ fetch friend
→ fetch active rules
→ build prompt input
→ call assessment provider
→ validate structured output
→ store assessment
```

Structured output shape:

```ts
type LlmAssessmentResult = {
  impactDirection: "positive" | "negative" | "mixed" | "neutral";
  scoreDelta: number;
  confidence: number;
  reasoningSummary: string;
  matchedRuleIds: string[];
  biasNotes?: string;
};
```

Bias handling requirements:

- The event description is written from the user's perspective.
- The LLM should consider narrator bias.
- The LLM should consider emotionally loaded wording.
- The LLM should consider missing context.
- The LLM should distinguish observed facts from interpretation.
- The LLM should not assume intent unless clearly supported.

Learning focus:

- applied AI architecture
- deterministic backend vs LLM logic
- prompt input design
- output contracts
- bias-aware assessment

---

## Day 8.5: Mock LLM and Structured Assessment Storage

Status: Done.

Goals:

- Add Zod schema for LLM output validation
- Create mock LLM assessment service
- Validate mock output with `assessmentSchema.parse(...)`
- Add mock assessment endpoint
- Update `Assessment` model to store structured LLM fields
- Store `impactDirection`, `confidence`, `matchedRuleIds`, and `biasNotes`

Implemented files:

```txt
src/ai/assessment.types.ts
src/ai/assessment.schema.ts
src/ai/mockAssessment.service.ts
```

Endpoint:

```http
POST /events/:eventId/mock-assessment
```

Learning focus:

- Zod runtime validation
- TypeScript type inference from Zod
- mock provider design
- structured output storage
- safe provider abstraction

---

## Day 9: Real LLM Providers and Provider Refactor

Status: Done.

Goals:

- Add LangChain.js provider services
- Add OpenAI assessment service
- Add Mistral assessment service
- Add real LLM assessment endpoints
- Store structured LLM assessment results
- Improve prompt instructions for semantically relevant rule matching
- Refactor duplicated route logic into service helpers
- Use consistent assessment source names

Implemented files:

```txt
src/ai/langchainAssessment.service.ts
src/ai/mistralAssessment.service.ts
src/services/assessments.service.ts
```

Implemented endpoints:

```http
POST /events/:eventId/mock-assessment
POST /events/:eventId/mistral-assessment
POST /events/:eventId/openai-assessment
```

Provider status:

```txt
mock    = works without external API call
mistral = working real LLM provider
openai  = route exists, currently blocked by API quota
```

Assessment service helpers:

```txt
getEventWithFriendAndActiveRules
buildLlmAssessmentInput
saveLlmAssessment
assessEventWithProvider
```

Important prompt improvement:

- Only include a rule ID in `matchedRuleIds` if the rule is directly semantically relevant to the event.
- Do not match a rule just because it exists.
- If no rule clearly applies, return `matchedRuleIds: []`.
- A rule about one topic should not be used to assess an unrelated event.
- If the event is positive or negative even without a matching rule, the model may still assign a `scoreDelta`, but `matchedRuleIds` should remain empty.

Learning focus:

- LangChain model calls
- provider abstraction
- structured output with real LLMs
- prompt iteration
- source/provider tracking
- reducing route duplication
- real-world API quota/error handling

---

## Day 10: Prompt Extraction, Provider Cleanup, and Metadata

Status: In progress.

Goals:

- Extract shared prompt-building logic into a separate helper
- Avoid duplicating prompts between Mistral and OpenAI services
- Create `src/ai/prompts/friendshipAssessment.prompt.ts`
- Make prompt updates easier and safer
- Add shared provider/model configuration
- Add prompt version tracking
- Store `modelName` and `promptVersion` on assessments
- Add provider-specific overrides only where needed

Implemented / planned files:

```txt
src/ai/prompts/friendshipAssessment.prompt.ts
src/ai/providers.ts
```

Learning focus:

- prompt modularization
- provider-agnostic prompt design
- maintainable AI service structure
- LLM metadata tracking
- foundation for future tracing and evaluation

---

## Day 11: Route and Request Validation

Status: Planned.

Goals:

- Add Zod schemas for request bodies
- Validate manual assessment request body
- Validate friend creation request body
- Validate rule creation request body
- Validate event creation request body
- Improve error messages consistently
- Avoid unsafe request body assumptions

Possible files:

```txt
src/schemas/friends.schema.ts
src/schemas/rules.schema.ts
src/schemas/events.schema.ts
src/schemas/assessments.schema.ts
```

Learning focus:

- runtime validation
- clean error responses
- request schema design
- API safety

---

## Day 12: Prediction Endpoint

Status: Planned.

Goals:

- Add endpoint for hypothetical actions
- Use rules and context without saving an event
- Return predicted score impact
- Keep prediction separate from persisted event history
- Reuse LLM input/assessment structure where possible

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
- reusing provider services

---

## Day 13: Testing Foundation

Status: Planned.

Goals:

- Add Vitest
- Test friends, rules, events, assessments, and balance logic
- Test duplicate friend-name handling
- Test validation behavior
- Test mock LLM behavior
- Avoid testing real LLM calls at first
- Add tests around provider orchestration helpers

Learning focus:

- unit tests
- integration-ish route tests
- mocking
- regression prevention

---

## Day 14: Polish and Documentation

Status: Planned.

Goals:

- Update README
- Add/update `.env.example`
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

## Day 15: Document Ingestion and Preprocessing

Status: Planned.

Goals:

- Add a first document ingestion flow
- Support basic text input first, then expand to files
- Plan support for TXT, Markdown, CSV, DOCX, and PDF later
- Extract text
- Clean and normalize text
- Split content into chunks
- Add metadata for source, friend, date, and document type

Possible future endpoints:

```http
POST /friends/:friendId/documents
GET /friends/:friendId/documents
```

Possible future models:

```txt
Document
DocumentChunk
```

Learning focus:

- document ingestion
- preprocessing
- chunking strategies
- metadata design
- handling messy input

---

## Day 16: Embeddings and Vector Storage

Status: Planned.

Goals:

- Create embeddings for rules, events, notes, and document chunks
- Store embeddings in a vector database
- Start with pgvector or Supabase Vector because the project already uses PostgreSQL
- Compare options such as Qdrant, Chroma, Weaviate, and Pinecone
- Add metadata filtering by friend/person and content type

Possible tools:

```txt
pgvector
Supabase Vector
Qdrant
Chroma
Weaviate
Pinecone
```

Possible future models:

```txt
Embedding
VectorChunk
```

Learning focus:

- embeddings
- vector similarity
- metadata filtering
- vector database tradeoffs
- PostgreSQL + vector search

---

## Day 17: RAG Retrieval and Reranking

Status: Planned.

Goals:

- Retrieve relevant rules, events, notes, and document chunks for a new event
- Use semantic retrieval instead of sending all available rules
- Add reranking to prioritize the most relevant context
- Pass reranked context into the LLM assessment flow
- Avoid forcing irrelevant rule matches

Possible flow:

```txt
new event text
→ embedding search
→ retrieve candidate rules/events/notes/chunks
→ rerank candidates
→ pass best context to LLM
→ generate assessment
```

Important rule-matching goal:

- Only match rules that are semantically relevant.
- Do not force `matchedRuleIds` if no rule applies.
- Allow `matchedRuleIds: []`.

Learning focus:

- retrieval-augmented generation
- semantic search
- reranking
- context selection
- RAG evaluation
- rule matching quality

---

## Day 18: Supabase Migration Practice

Status: Planned.

Goals:

- Move from local PostgreSQL to Supabase-hosted Postgres
- Update `DATABASE_URL`
- Run Prisma migrations against Supabase
- Use the Supabase dashboard to inspect tables
- Explore Supabase Vector / pgvector
- Optionally explore Supabase Auth later

Learning focus:

- hosted Postgres
- cloud database connection strings
- database migrations in hosted environments
- Supabase dashboard
- Supabase Vector
- local vs hosted development setup

---

## Phase 4: DevOps, Security, and Production Readiness

## Day 19: Docker and Local DevOps

Status: Planned.

Goals:

- Containerise the API
- Containerise PostgreSQL
- Add a `Dockerfile`
- Add `docker-compose.yml`
- Run the full app locally with Docker
- Practice environment variables in containers
- Add a `.env.example` suitable for Docker usage

Possible services:

```txt
api
postgres
```

Learning focus:

- Docker basics
- Dockerfile
- docker-compose
- local development environments
- reproducible project setup

---

## Day 20: CI, Security, Logging, and Monitoring

Status: Planned.

Goals:

- Add GitHub Actions CI
- Run build checks on push
- Run tests in CI
- Add dependency vulnerability scanning
- Add stronger input validation
- Add safe error logging and safe client responses
- Avoid exposing stack traces or database details to clients
- Add request/error logging
- Add API latency monitoring
- Add endpoint usage metrics
- Add health checks

Possible tools:

```txt
GitHub Actions
Sentry
Grafana
OpenTelemetry
structured logger
```

Learning focus:

- CI pipelines
- secure development practices
- safe error handling
- structured logs
- monitoring basics
- production readiness

---

## Day 21: LLM Evaluation, Tracing, and Portfolio Polish

Status: Planned.

Goals:

- Add golden test cases for LLM assessments
- Evaluate scoring consistency
- Check whether relevant rules are matched
- Add regression tests for prompt changes
- Add mocked LLM tests in CI
- Add LLM tracing/analytics plan
- Track prompt version, model name, token usage, latency, cost, and structured output validity
- Update README and architecture documentation
- Prepare the project as a portfolio-ready applied AI backend

Possible tools:

```txt
DeepEval
LangSmith evaluations
LangSmith tracing
Langfuse
Helicone
OpenTelemetry
Vitest
custom evaluation scripts
```

Example evaluation case:

```txt
Input event:
I called Cole without warning.

Expected matched rule:
Unexpected calls are bad.

Expected score direction:
negative.

Expected output:
valid JSON with scoreDelta, confidence, reasoningSummary, and matchedRuleIds.
```

Example irrelevant-rule test case:

```txt
Input event:
Cole said something hurtful.

Available rule:
Cole dislikes unexpected phone calls.

Expected:
matchedRuleIds: []
```

Learning focus:

- automated AI evaluation
- prompt regression testing
- deterministic tests around nondeterministic systems
- structured output validation
- rule matching quality
- LLM observability
- project presentation

---

# Future Backlog Beyond Day 21

## Data Model Refactor: Model People Instead of Only Friends

Current model:

```txt
event = me ↔ friend
```

Future model idea:

```txt
event = person A ↔ person B
```

Goals:

- Model the user as a `Person` in the database
- Every event should happen between two people
- Consider renaming/generalizing `Friend` to `Person`
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
- generalizing domain models

---

## Secure Development Practices

Goals:

- Add authentication and authorization
- Protect private friendship data
- Improve secret management
- Add rate limiting
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

---

## Advanced Observability and LLM Analytics

Goals:

- Trace LangChain/LLM calls
- Inspect prompts and responses
- Track token usage
- Track latency and cost
- Monitor invalid structured outputs
- Compare prompt versions
- Analyze retrieved context quality
- Debug RAG/reranking behavior
- Create dashboards and alerts

Possible tools:

```txt
LangSmith
Langfuse
Helicone
OpenTelemetry
Grafana
Sentry
PostHog
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
final scoreDelta
```

---

## Final Future Task: Responsive GUI / Frontend

Status: Final backlog task.

This should stay last because frontend development is not the main focus of this project.

Goals:

- Build a simple responsive GUI for the API
- View, create, and search friends
- Manage rules
- Add events
- View balances
- Trigger mock, Mistral, or OpenAI assessments
- Display LLM assessment results, including `scoreDelta`, `impactDirection`, `confidence`, `matchedRuleIds`, `biasNotes`, `modelName`, and `promptVersion`
- Make the app usable without curl or Prisma Studio

Possible frontend options:

```txt
React
Next.js
SvelteKit
Vue
simple server-rendered UI
```

Learning focus:

- consuming backend APIs from a frontend
- responsive UI basics
- frontend/backend integration
- presenting LLM output safely
- keeping frontend work secondary to backend and AI engineering
