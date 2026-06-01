# Friendship Points API Roadmap

This roadmap tracks the 45-day Friendship Points API learning project.

The main project README is in [`README.md`](./README.md).

---

# Detailed 45-Day Roadmap

## Phase 1: Core TypeScript API and PostgreSQL Foundations

## Day 1: TypeScript + Fastify Setup

Status: Done.

Goals:

- Create Node.js/TypeScript project
- Add Fastify
- Add `.env` support
- Add `/health`
- Set up GitHub repository

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
- Create first Prisma model
- Run migration
- Generate Prisma Client
- Use Prisma Studio

Learning focus:

- PostgreSQL basics
- Prisma schema
- migrations
- database connection from TypeScript

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
- Validate friend creation/update/note append requests
- Validate rule creation/weight update requests
- Validate event creation requests
- Use Zod for runtime request validation

---

## Day 12: Friend Management Endpoints

Status: Mostly done.

Implemented:

```http
PATCH /friends/:id
POST /friends/:id/notes/append
```

Still planned:

```http
DELETE /friends/:id
```

Planned soft-delete approach:

- Add `deletedAt DateTime?` to `Friend`
- `DELETE /friends/:id` sets `deletedAt`
- Normal list/search endpoints exclude soft-deleted friends
- Keep related rules, events, and assessments for audit/history
- Later consider `POST /friends/:id/restore`

---

## Day 13: Prediction Endpoint

Status: Done.

Implemented endpoints:

```http
POST /friends/:friendId/predict
POST /friends/:friendId/predict/mistral
```

Implemented:

- Mock predictions
- Mistral predictions
- `saved: false`
- Prediction input builder
- Friend-with-active-rules lookup helper
- No `Event` or `Assessment` is created for predictions

---

## Day 14: Testing Foundation

Status: Done.

Implemented:

- Added Vitest
- Added basic test setup
- Added prediction input builder tests
- Added prediction request validation tests
- Added manual assessment validation tests
- Added friend creation/update/note append validation tests
- Added rule validation tests
- Added event validation tests
- Fixed TypeScript build include paths

Checks:

```bash
npm test
npm run build
```

---

## Phase 3: Backend Quality, Testing, and Automation

## Day 15: Error Handling and Response Consistency

Status: Done.

Implemented:

- Added `sendValidationError`
- Added `sendBadRequestError`
- Added `sendNotFoundError`
- Added `sendInternalServerError`
- Replaced repeated validation, not-found, and internal-error responses across route files
- Kept `409 Conflict` for duplicate friend names

Important distinction:

```txt
Invalid body / Zod body validation failed
→ sendValidationError(...)

Missing query parameter / general bad request
→ sendBadRequestError(...)

Missing friend/rule/event
→ sendNotFoundError(...)

Unexpected server/provider failure
→ sendInternalServerError(...)
```

---

## Day 16: Safe Internal Logging

Status: Done.

Implemented:

- Added `logError(context, error)`
- Used `unknown` for caught errors
- Centralized `instanceof Error` checking
- Logged error messages and stack traces internally
- Replaced direct route/server `console.error` calls with `logError`
- Kept client-facing 500 responses generic and safe

Possible future tools:

```txt
pino
Sentry
OpenTelemetry
```

---

## Day 17: Local Test Automation with Husky

Status: Done.

Implemented:

- Installed Husky
- Added `.husky/pre-push`
- Runs `npm test` before push
- Runs `npm run build` before push
- Added visible hook output
- Verified the hook blocks push when it fails

Current pre-push behavior:

```bash
echo "Running pre-push hook..."
npm test
npm run build
```

---

## Day 18: ESLint Setup

Status: Planned.

Goals:

- Add ESLint for TypeScript
- Add `npm run lint`
- Configure lint rules
- Fix initial lint issues
- Prepare CI lint checks

Learning focus:

- static analysis
- code quality
- consistency
- catching mistakes before runtime

---

## Day 19: GitHub Actions CI

Status: Done.

Implemented:

- Added GitHub Actions workflow
- Runs on push
- Runs on pull_request
- Uses Ubuntu runner
- Installs Node.js
- Runs `npm ci`
- Generates Prisma client
- Runs `npm test`
- Runs `npm run build`
- Fixed CI-specific Prisma `DATABASE_URL` issue

Still planned:

- Add `npm run lint` after ESLint is configured

---

## Day 20: Friend Soft Delete

Status: Planned.

Goals:

- Add `deletedAt DateTime?` to `Friend`
- Add Prisma migration
- Implement `DELETE /friends/:id` as soft delete
- Filter soft-deleted friends out of list/search results
- Decide behavior for `GET /friends/:id` on deleted friends
- Consider restore endpoint

Possible endpoints:

```http
DELETE /friends/:id
POST /friends/:id/restore
```

---

## Day 21: Data Model Hardening

Status: Planned.

Goals:

- Add optional pronouns to `Friend`
- Consider moving pronouns later to `Person`
- Convert `Rule.impactDirection` and `Rule.weight` from strings to Prisma enums
- Add migrations safely
- Update Zod schemas and TypeScript types

Possible Prisma additions:

```prisma
pronouns String?

enum ImpactDirection {
  positive
  negative
  neutral
  mixed
}

enum RuleWeight {
  minimal
  low
  medium
  high
  critical
  extreme
}
```

---

## Day 22: Friend Management Route Tests

Status: Planned.

Goals:

- Add route-level tests where practical
- Test friend update route behavior
- Test note append route behavior
- Test `/friends/search` missing query parameter behavior
- Decide database testing strategy for Prisma-backed routes
- Keep tests fast and reliable

Learning focus:

- route tests vs schema tests
- Fastify `app.inject(...)`
- database test strategy

---

## Day 23: Documentation and Portfolio Polish

Status: Planned.

Goals:

- Update README
- Update ROADMAP
- Add/update `.env.example`
- Document endpoints
- Document architecture
- Document testing commands
- Document pre-push checks
- Document GitHub Actions CI
- Document known limitations

---

## Phase 4: Search, RAG, and Agentic Retrieval

## Day 24: Keyword Search over Rules, Notes, and Events

Status: Planned.

Goals:

- Build a simple keyword search layer first
- Index friendship rules, friend notes, and past event text
- Search relevant context for a new event or prediction
- Start with lexical/keyword matching before vector search
- Rank candidate results by simple relevance signals

Learning focus:

- basic retrieval
- keyword search
- search indexes
- ranking search results
- why RAG needs context retrieval

---

## Day 25: Basic RAG Pipeline

Status: Planned.

Goals:

- Build a fixed RAG pipeline:
  - receive event or hypothetical action
  - search relevant context
  - build prompt with retrieved context
  - call LLM
  - return structured assessment or prediction
- Compare against current direct active-rules approach
- Make no-context behavior explicit

Learning focus:

- retrieve → prompt → LLM
- fixed RAG pipeline
- prompt context construction

---

## Day 26: RAG Helper and Data Loading

Status: Planned.

Goals:

- Create reusable RAG helper/service
- Separate data loading, searching, prompt building, and model calling
- Reuse the RAG flow for assessments and predictions
- Add typed search result/context objects

Learning focus:

- reusable RAG abstraction
- service design
- separation of concerns
- typed context objects

---

## Day 27: Persistent Search Ingestion

Status: Planned.

Goals:

- Add ingestion step for searchable records
- Persist indexed rules, notes, events, and later document chunks
- Rebuild/update search index when source data changes
- Track metadata such as source type, friend/person ID, event ID, and timestamps

Learning focus:

- ingestion pipeline
- persistent search data
- metadata design
- keeping search index and database data in sync

---

## Day 28: Function Calling for Search Tools

Status: Planned.

Goals:

- Expose search as a callable tool/function
- Let the LLM request a search instead of always running fixed retrieval
- Define tool input/output schemas
- Keep tool outputs structured and safe
- Avoid giving tools unnecessary permissions

Learning focus:

- function calling
- tool schemas
- LLM tool use
- tool safety boundaries

---

## Day 29: Agentic RAG Loop

Status: Planned.

Goals:

- Implement a loop where the LLM can:
  - decide to call a search tool
  - inspect returned context
  - call another tool if needed
  - stop and produce a final structured answer
- Add max-iteration safeguards
- Add fallback behavior when no relevant context is found

Learning focus:

- agentic RAG
- tool loop control
- preventing infinite loops
- deciding when retrieval is needed

---

## Day 30: Agentic RAG Tests and Evaluation

Status: Planned.

Goals:

- Test search tool calls
- Test cases where the model should search
- Test cases where the model should not search
- Evaluate whether retrieved context was relevant
- Evaluate whether final assessment used retrieved context correctly
- Add regression tests for agent behavior

Learning focus:

- agent behavior evaluation
- RAG evaluation
- retrieval precision
- regression testing

---

## Phase 5: Human Feedback, Evaluation, and Tracing

## Day 31: Human Verification Design for Model Outputs

Status: Planned.

Goals:

- Design human verification for model-generated assessments and predictions
- Allow users to mark model output as verified, rejected, corrected, or unverified
- Support persisted assessments and hypothetical predictions
- Separate model-generated judgment from human-verified judgment

Possible statuses:

```txt
unverified
verified
rejected
corrected
```

---

## Day 32: Human Verification Data Model

Status: Planned.

Goals:

- Add data model for verification decisions
- Store who verified the output
- Store when it was verified
- Store whether it was verified, rejected, or corrected
- Store optional correction/explanation
- Add audit/history of verification changes

Possible models:

```txt
AssessmentVerification
PredictionVerification
HumanFeedback
VerificationHistory
```

---

## Day 33: LLM Evaluation and Golden Examples

Status: Planned.

Goals:

- Create golden test cases for LLM assessments and predictions
- Evaluate scoring consistency
- Check whether relevant rules are matched
- Penalize irrelevant rule matches
- Regression test prompt changes
- Include cases with `matchedRuleIds: []`
- Use human verification data later as feedback signal

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

## Day 34: LLM Tracing and Prompt Analytics

Status: Planned.

Goals:

- Trace LangChain/LLM calls
- Track prompt version
- Track model name
- Track latency
- Track token usage/cost where available
- Track structured output validity
- Prepare for prompt comparison
- Analyze retrieved context quality after RAG is added

Possible tools:

```txt
LangSmith
Langfuse
Helicone
OpenTelemetry
custom logging
```

---

## Phase 6: Retrieval Expansion and Semantic Search

## Day 35: Relationship-Specific Notes Design

Status: Planned.

Goals:

- Design notes that belong to a relationship between two people
- Support shared habits
- Support background context
- Support preferences
- Support relationship routines
- Support recurring activities
- Prepare notes for RAG context

Future model idea:

```txt
Person
Relationship
RelationshipNote
Event
```

---

## Day 36: Document Ingestion and Preprocessing

Status: Planned.

Goals:

- Add first document ingestion flow
- Support basic text input first
- Later support TXT, Markdown, CSV, DOCX, and PDF
- Extract text
- Clean and normalize text
- Split content into chunks
- Add metadata for source, friend/person, date, and document type

Possible models:

```txt
Document
DocumentChunk
```

---

## Day 37: Embeddings and Vector Storage

Status: Planned.

Goals:

- Create embeddings for rules, events, notes, and document chunks
- Store embeddings in a vector database
- Start with pgvector or Supabase Vector because the project already uses PostgreSQL
- Compare Qdrant, Chroma, Weaviate, and Pinecone
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

## Day 38: Semantic Retrieval and Reranking

Status: Planned.

Goals:

- Retrieve relevant rules, events, notes, and document chunks using embeddings
- Compare semantic retrieval with keyword search
- Add reranking to prioritize context
- Pass reranked context into assessment/prediction flow
- Avoid forcing irrelevant rule matches

Flow:

```txt
new event or hypothetical action
→ semantic search
→ retrieve candidate rules/events/notes/chunks
→ rerank candidates
→ pass best context to LLM
→ generate assessment or prediction
```

---

## Day 39: RAG Evaluation

Status: Planned.

Goals:

- Evaluate retrieved context quality
- Check whether correct rules/notes/events were retrieved
- Check whether irrelevant context was excluded
- Add golden examples for retrieval
- Compare keyword search, semantic search, and reranking
- Use human verification data later as feedback signal

---

## Phase 7: Infrastructure, Deployment, Security, and Privacy

## Day 40: Supabase Migration

Status: Planned.

Goals:

- Move from local PostgreSQL to Supabase-hosted Postgres
- Update `DATABASE_URL`
- Run Prisma migrations against Supabase
- Use Supabase dashboard
- Explore Supabase Vector / pgvector
- Optionally explore Supabase Auth later

---

## Day 41: Docker and Local DevOps

Status: Planned.

Goals:

- Containerise the API
- Containerise PostgreSQL
- Add `Dockerfile`
- Add `docker-compose.yml`
- Run full app locally with Docker
- Practice environment variables in containers
- Add Docker-friendly `.env.example`

Possible services:

```txt
api
postgres
```

---

## Day 42: Deployment and Environment Management

Status: Planned.

Goals:

- Deploy the Fastify backend API
- Use Render as likely backend hosting option
- Use Supabase Postgres as likely hosted database
- Add environment variables on hosting platform
- Run migrations safely
- Test deployed endpoints
- Keep CD automation separate until deployment is stable

Likely deployment direction:

```txt
Backend API: Render
Database: Supabase Postgres
Frontend later: Vercel or Render static site
```

---

## Day 43: Security and Access Control

Status: Planned.

Goals:

- Plan authentication and authorization
- Protect private friendship data
- Improve secret management
- Add rate limiting
- Add prompt-injection awareness
- Add safe LLM usage patterns
- Add security checks in CI
- Consider least-privilege database access

---

## Day 44: Logging, Monitoring, Observability, and GDPR Planning

Status: Planned.

Goals:

- Add request/error logging
- Add structured logging
- Monitor API latency
- Track endpoint usage metrics
- Add health checks
- Add dashboards and alerts later
- Connect errors to tools such as Sentry later
- Plan GDPR / DSGVO compliance before real-user usage
- Consider German BDSG requirements where relevant
- Define lawful basis / consent model
- Apply data minimization and purpose limitation
- Design data access, deletion, export, and correction flows
- Define retention and deletion policies
- Secure sensitive relationship/event/claim data
- Add audit logs and visibility controls

Critical design note:

This should be treated as a legal/privacy design task, not just a technical checkbox. Before real users use the app, it should get proper legal review.

Possible tools:

```txt
Sentry
Grafana
OpenTelemetry
structured logger
```

---

## Phase 8: Frontend

## Day 45: Responsive GUI / Frontend

Status: Final planned task.

This must remain the final roadmap task because frontend development is not the main focus of this project. Backend, AI, testing, DevOps, security, privacy, compliance, and multi-user design should come first.

Goals:

- Build a simple responsive GUI for the API
- View, create, and search friends/people
- Manage rules
- Add events
- View balances
- Trigger mock, Mistral, or OpenAI assessments
- Trigger mock and Mistral predictions
- Display LLM assessment and prediction results
- Display `scoreDelta`, `impactDirection`, `confidence`, `matchedRuleIds`, `biasNotes`, `modelName`, and `promptVersion`
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

# Future Backlog Beyond Day 45

## Multi-User Accounts and Person/Relationship Model

Goal:

Expand from a single-user implicit friendship model to a multi-user relationship-aware system.

Goals:

- Add account/login concept
- Link user accounts to `Person` records
- Refactor from `Friend` toward `Person`
- Add `Relationship` model between two people
- Allow events between two people rather than implicitly between the user and one friend
- Notify the other person when an event involving them is submitted

---

## Multi-Perspective Events and Claim Verification

Goal:

Allow both people in a relationship to provide their own perspective on the same event and optionally verify, deny, or leave claims unverified.

Goals:

- Allow both users to submit perspectives
- Treat verified claims as stronger evidence
- Treat denied claims as disputed evidence
- Treat unverified claims cautiously as one person's perspective
- Add voluntary confirmation and coercion safeguards
- Add revocation, visibility controls, audit trails, reporting, and disputes

Critical design note:

A checkbox alone does not prove absence of coercion. This feature needs privacy, revocation, dispute handling, and careful visibility controls.

---

## Advanced Secure Development Practices

Goals:

- Harden authentication and authorization
- Add stronger privacy controls
- Improve secret management
- Add abuse prevention
- Add audit logging
- Add data retention/deletion policies
- Add safer LLM usage boundaries
- Add security checks in CI

---

## Production CD Pipeline

Goal:

Add Continuous Deployment only after deployment is stable and tests/build/lint checks are reliable.

Possible flow:

```txt
push to main
→ GitHub Actions CI passes
→ deploy API automatically
→ run smoke test
```

Keep this separate from CI until the deployment process is well understood.
