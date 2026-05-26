# Friendship Points API Roadmap

This file contains the detailed 30-day roadmap and future backlog for the Friendship Points API project.

The main project README is in [`README.md`](./README.md).

---

# Detailed 30-Day Roadmap

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

Learning focus:

- TypeScript project structure
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

Learning focus:

- PostgreSQL basics
- Prisma schema
- migrations
- database connection from TypeScript
- Prisma Studio

---

## Day 3: Friends API

Status: Done.

Goals:

- Add friend endpoints
- Add route file structure
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

---

## Day 4: Friendship Rules

Status: Done.

Goals:

- Add `Rule` model
- Relate rules to friends
- Create and list rules
- Update rule weight
- Add `extreme` as rare highest-impact weight

Endpoints:

```http
GET /friends/:friendId/rules
POST /friends/:friendId/rules
PATCH /rules/:ruleId/weight
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

## Day 5: Friendship Events

Status: Done.

Goals:

- Add `Event` model
- Relate events to friends
- Create and list events
- Get one event by ID
- Handle optional event dates

Endpoints:

```http
GET /friends/:friendId/events
POST /friends/:friendId/events
GET /events/:eventId
```

---

## Day 6: Manual Scoring and Balance

Status: Done.

Goals:

- Add `Assessment` model
- Store manual score changes for events
- Calculate friendship balance
- Change `scoreDelta` from `Int` to `Float`

Endpoints:

```http
POST /events/:eventId/manual-assessment
GET /friends/:friendId/balance
```

---

## Day 7: Refactor, Validation, and Duplicate Handling

Status: Done.

Goals:

- Move repeated database logic into services
- Add duplicate friend-name handling
- Clean up route files
- Improve validation/error responses

Implemented:

```txt
src/services/friends.service.ts
```

Duplicate behavior:

- exact duplicate `displayName` returns `409 Conflict`
- duplicate creation requires `allowDuplicate: true`

---

## Phase 2: LangChain and LLM-Assisted Scoring

## Day 8: LLM Assessment Design

Status: Done.

Goals:

- Design LLM assessment flow
- Define structured output
- Add bias-aware assessment requirements
- Classify events as positive, negative, mixed, or neutral
- Keep LLM logic separate from database writes

Flow:

```txt
event
→ fetch friend
→ fetch active rules
→ build prompt input
→ call assessment provider
→ validate structured output
→ store assessment
```

---

## Day 8.5: Mock LLM and Structured Assessment Storage

Status: Done.

Goals:

- Add Zod schema for LLM output
- Create mock LLM assessment service
- Add mock assessment endpoint
- Store structured LLM fields

Implemented:

```txt
src/ai/assessment.types.ts
src/ai/assessment.schema.ts
src/ai/mockAssessment.service.ts
```

Endpoint:

```http
POST /events/:eventId/mock-assessment
```

---

## Day 9: Real LLM Providers and Provider Refactor

Status: Done.

Goals:

- Add OpenAI assessment service
- Add Mistral assessment service
- Add real LLM assessment endpoints
- Improve prompt instructions for relevant rule matching
- Refactor repeated assessment logic
- Use consistent source names

Endpoints:

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

---

## Day 10: Prompt Extraction, Provider Cleanup, and Metadata

Status: Done.

Goals:

- Extract shared prompt builder
- Add shared provider/model config
- Add prompt version tracking
- Store `modelName` and `promptVersion` on assessments

Implemented:

```txt
src/ai/prompts/friendshipAssessment.prompt.ts
src/ai/providers.ts
```

---

## Day 11: Route and Request Validation

Status: Done.

Goals:

- Validate manual assessment requests
- Validate friend creation requests
- Validate rule creation requests
- Validate rule weight updates
- Validate event creation requests
- Use Zod for runtime request validation

Implemented schemas:

```txt
src/schemas/assessments.schema.ts
src/schemas/friends.schema.ts
src/schemas/rules.schema.ts
src/schemas/events.schema.ts
```

Validated routes:

```http
POST /events/:eventId/manual-assessment
POST /friends
POST /friends/:friendId/rules
PATCH /rules/:ruleId/weight
POST /friends/:friendId/events
```

Learning focus:

- runtime validation
- difference between TypeScript types and incoming HTTP data
- clean `400 Bad Request` responses

---

## Day 12: Friend Management Endpoints

Status: Planned.

Goals:

- Add `PATCH /friends/:id`
- Update friend display name
- Replace friend notes
- Add `POST /friends/:id/notes/append`
- Append new note text without deleting previous notes
- Think carefully about `DELETE /friends/:id`

Possible endpoints:

```http
PATCH /friends/:id
POST /friends/:id/notes/append
DELETE /friends/:id
```

Delete design note:

Deleting friends is risky because friends have related rules, events, and assessments. Prefer soft delete or explicit cascade behavior later.

---

## Day 13: Prediction Endpoint

Status: Planned.

Goals:

- Add endpoint for hypothetical actions
- Use rules and context without saving an event
- Return predicted score impact
- Keep prediction separate from persisted event history

Endpoint:

```http
POST /friends/:friendId/predict
```

---

## Day 14: Testing Foundation

Status: Planned.

Goals:

- Add Vitest
- Test friends, rules, events, assessments, and balance logic
- Test duplicate friend-name handling
- Test validation behavior
- Test mock LLM behavior
- Avoid testing real LLM calls first

---

## Day 15: Error Handling and Response Consistency

Status: Planned.

Goals:

- Standardize error response shape
- Add reusable validation error helper
- Add reusable not-found helpers
- Avoid leaking stack traces or implementation details

---

## Day 16: Polish and Documentation

Status: Planned.

Goals:

- Update README
- Update ROADMAP
- Add/update `.env.example`
- Document endpoints
- Document architecture
- Clean up route files

---

## Phase 3: Retrieval, RAG, Vector Search, and Document Pipelines

## Day 17: Relationship-Specific Notes Design

Status: Planned.

Goals:

- Design notes that belong to a relationship between two people
- Support shared habits
- Support background context
- Support preferences
- Support relationship routines
- Support recurring activities
- Prepare notes for RAG context

Example:

```txt
Karo and Sam go to eat french fries every Tuesday.
```

Future model idea:

```txt
Person
Relationship
RelationshipNote
Event
```

---

## Day 18: Document Ingestion and Preprocessing

Status: Planned.

Goals:

- Add a first document ingestion flow
- Support basic text input first
- Later support TXT, Markdown, CSV, DOCX, and PDF
- Extract, clean, normalize, chunk, and store text with metadata

Possible models:

```txt
Document
DocumentChunk
```

---

## Day 19: Embeddings and Vector Storage

Status: Planned.

Goals:

- Create embeddings for rules, events, notes, and document chunks
- Store embeddings in a vector database
- Start with pgvector or Supabase Vector
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

---

## Day 20: RAG Retrieval and Reranking

Status: Planned.

Goals:

- Retrieve relevant rules, events, notes, and document chunks
- Use semantic retrieval instead of sending all available rules
- Add reranking
- Avoid forcing irrelevant rule matches

Rule-matching goal:

```txt
Only match semantically relevant rules.
Allow matchedRuleIds: [] when no rule applies.
```

---

## Day 21: RAG Evaluation and Golden Examples

Status: Planned.

Goals:

- Create golden test cases
- Evaluate relevant rule matching
- Penalize irrelevant rule matches
- Evaluate retrieved context quality
- Regression test prompt and retrieval changes

Example:

```txt
Input event:
Cole said something hurtful.

Available rule:
Cole dislikes unexpected phone calls.

Expected:
matchedRuleIds: []
```

---

## Phase 4: Supabase, Deployment, DevOps, and Production Readiness

## Day 22: Supabase Migration Practice

Status: Planned.

Goals:

- Move from local PostgreSQL to Supabase-hosted Postgres
- Update `DATABASE_URL`
- Run Prisma migrations against Supabase
- Use Supabase dashboard
- Explore Supabase Vector / pgvector

---

## Day 23: Docker and Local DevOps

Status: Planned.

Goals:

- Containerise the API
- Containerise PostgreSQL
- Add `Dockerfile`
- Add `docker-compose.yml`
- Run the full app locally with Docker

---

## Day 24: API Deployment

Status: Planned.

Goals:

- Deploy the Fastify backend API
- Use Render as likely backend hosting option
- Use Supabase Postgres as likely hosted database
- Add environment variables on hosting platform
- Run migrations safely
- Test deployed endpoints

Likely deployment direction:

```txt
Backend API: Render
Database: Supabase Postgres
Frontend later: Vercel or Render static site
```

---

## Day 25: CI and Build Checks

Status: Planned.

Goals:

- Add GitHub Actions CI
- Run TypeScript build checks on push
- Run tests in CI
- Add basic dependency vulnerability scanning

---

## Day 26: Security and Access Control Planning

Status: Planned.

Goals:

- Plan authentication and authorization
- Protect private friendship data
- Improve secret management
- Add rate limiting
- Add prompt-injection awareness
- Add safe LLM usage patterns

---

## Day 27: Logging, Monitoring, and Observability

Status: Planned.

Goals:

- Add request/error logging
- Add structured logging
- Monitor API latency
- Track endpoint usage metrics
- Add health checks
- Add dashboards and alerts later

Possible tools:

```txt
Sentry
Grafana
OpenTelemetry
structured logger
```

---

## Phase 5: Multi-User System, Privacy, and Frontend

## Day 28: Multi-User Accounts and Relationship Model

Status: Planned.

Goals:

- Add account/login concept
- Link user accounts to `Person` records
- Refactor from `Friend` toward `Person`
- Add `Relationship` model between two people
- Allow events between two people
- Notify the other person when an event involving them is submitted

Possible models:

```txt
UserAccount
Person
Relationship
Event
Assessment
Notification
```

---

## Day 29: Multi-Perspective Events, Claim Verification, and Privacy Controls

Status: Planned.

Goals:

- Allow both users to provide their own version of an event
- Allow users to verify, deny, or leave unverified claims made about them
- Treat verified claims as stronger evidence
- Treat denied claims as disputed evidence
- Treat unverified claims cautiously
- Add audit trails, visibility controls, data governance, privacy boundaries, and dispute handling

Possible models:

```txt
Event
EventPerspective
Claim
ClaimVerification
ConsentRecord
AuditLog
VisibilitySetting
Dispute
```

Claim verification safety requirements:

- ability to revoke or update verification
- private confirmation flow
- visibility controls
- audit trail
- report/dispute mechanism
- no public pressure to verify
- clear explanation of consequences before verification
- explicit confirmation that verification is voluntary and not coerced

Critical design note:

A checkbox alone does not prove absence of coercion. The feature needs privacy, revocation, dispute handling, and careful visibility controls.

---

## Day 30: Responsive GUI / Frontend

Status: Final planned task.

This should stay last because frontend development is not the main focus of this project.

Goals:

- Build a simple responsive GUI for the API
- View, create, and search friends/people
- Manage rules
- Add events
- View balances
- Trigger mock, Mistral, or OpenAI assessments
- Display LLM assessment results
- Make the app usable without curl or Prisma Studio

Possible frontend options:

```txt
React
Next.js
SvelteKit
Vue
simple server-rendered UI
```

---

# Future Backlog Beyond Day 30

## Advanced LLM Tracing and Analytics

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
Grafana
Sentry
PostHog
```

---

## Further Secure Development Practices

Goals:

- Harden authentication and authorization
- Add stronger privacy controls
- Improve secret management
- Add abuse prevention
- Add audit logging
- Add data retention/deletion policies
- Add safer LLM usage boundaries
- Add security checks in CI