# Friendship Points API Roadmap

This roadmap tracks the 45-day Friendship Points API learning project.

The roadmap is now ordered around one primary milestone:

```txt
Reach a complete LLM Zoomcamp-compliant RAG project first.
Do production hardening and extra product features afterwards.
```

The main project README is in [`README.md`](./README.md).

---

# Detailed 45-Day Roadmap

## Current Position

Completed:

```txt
Day 1–20: Backend foundation, LLM assessment flow, validation, tests, linting, CI, and soft delete
```

Next:

```txt
Day 21: Keyword Search over Rules, Notes, and Events
```

---

# Phase 1: Core TypeScript API and PostgreSQL Foundations

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

Learning focus:

- manual scoring before AI
- numeric validation
- database relations
- balance calculation

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

Duplicate behaviour:

- exact duplicate `displayName` returns `409 Conflict`
- duplicate creation requires `allowDuplicate: true`

---

# Phase 2: LangChain and LLM-Assisted Scoring

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

Bias handling requirements:

- Consider narrator bias
- Consider emotionally loaded wording
- Consider missing context
- Distinguish observed facts from interpretation
- Do not assume intent unless clearly supported

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
DELETE /friends/:id
```

Implemented behaviour:

- update friend display name
- replace friend notes
- append notes without replacing old notes
- soft-delete friends using `deletedAt`

Still possible later:

```http
POST /friends/:id/restore
```

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

# Phase 3: Backend Quality, Testing, and Automation

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
- Centralised `instanceof Error` checking
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
- Runs `npm run lint` before push
- Runs `npm test` before push
- Runs `npm run build` before push
- Added visible hook output
- Verified the hook blocks push when it fails

Current pre-push behaviour:

```bash
echo "Running pre-push hook..."
npm run lint
npm test
npm run build
```

---

## Day 18: ESLint Setup

Status: Done.

Implemented:

- Installed ESLint
- Added `eslint.config.js`
- Added `npm run lint`
- Added TypeScript ESLint recommended rules
- Ignored generated Prisma client files
- Fixed initial lint issues

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
- Runs `npm run lint`
- Runs `npm test`
- Runs `npm run build`
- Fixed CI-specific Prisma `DATABASE_URL` issue

Learning focus:

- Continuous Integration
- clean build environments
- reproducible builds
- automated quality checks

---

## Day 20: Friend Soft Delete

Status: Done.

Implemented:

- Added `deletedAt DateTime?` to `Friend`
- Added Prisma migration
- Updated friend list/search/detail routes to exclude soft-deleted friends
- Added `DELETE /friends/:id`
- Delete sets `deletedAt` instead of removing the row
- Already-deleted friends return `404`

Verified behaviour:

```txt
DELETE active friend → 200
GET deleted friend → 404
DELETE already deleted friend → 404
```

---

# Phase 4: Zoomcamp Compliance First — Search, RAG, and Agentic Retrieval

This phase is prioritised so the project becomes a complete LLM Zoomcamp-style RAG project before adding lower-priority production/product features.

## Day 21: Keyword Search over Rules, Notes, and Events

Status: Planned.

Goals:

- Build a simple keyword search layer first
- Search friendship rules
- Search friend notes
- Search past event text
- Return ranked search results
- Use simple lexical scoring before vector search

Learning focus:

- basic retrieval
- keyword search
- search result ranking
- why RAG needs a retrieval layer

---

## Day 22: Search Ingestion Layer

Status: Planned.

Goals:

- Create searchable records from existing database data
- Store metadata for each searchable item
- Include source type, friend ID, rule ID, event ID, and timestamps where relevant
- Keep searchable data in sync with source data
- Decide whether to build the first version in-memory or persist it

Learning focus:

- ingestion pipeline
- searchable knowledge base
- metadata design
- source-data synchronisation

---

## Day 23: Basic RAG Pipeline

Status: Planned.

Goals:

- Build a fixed RAG pipeline:
  - receive event or hypothetical action
  - retrieve relevant context
  - build prompt with retrieved context
  - call LLM
  - return structured assessment or prediction
- Compare against the current direct active-rules approach
- Make no-context behaviour explicit

Learning focus:

- retrieve → prompt → LLM
- fixed RAG pipeline
- prompt context construction
- context/no-context handling

---

## Day 24: Retrieval Service Refactor

Status: Planned.

Goals:

- Separate retrieval from prompt building
- Separate prompt building from model calling
- Create reusable retrieval/RAG service functions
- Add typed search result and context item objects
- Reuse the RAG flow for assessments and predictions

Learning focus:

- reusable RAG abstraction
- service design
- separation of concerns
- typed context objects

---

## Day 25: Embeddings and Vector Storage

Status: Planned.

Goals:

- Generate embeddings for searchable records
- Store vectors for rules, notes, and events
- Compare vector storage options
- Prefer PostgreSQL-compatible options where practical
- Prepare for document chunk embeddings later

Possible tools:

```txt
pgvector
Supabase Vector
Qdrant
Chroma
Weaviate
Pinecone
```

Learning focus:

- embeddings
- vector storage
- embedding metadata
- database/tooling trade-offs

---

## Day 26: Semantic Retrieval

Status: Planned.

Goals:

- Retrieve relevant records using embeddings
- Compare semantic retrieval with keyword search
- Add metadata filtering by friend/person and source type
- Decide how many records to retrieve for the prompt

Learning focus:

- semantic search
- similarity search
- metadata filtering
- keyword vs vector retrieval trade-offs

---

## Day 27: Reranking

Status: Planned.

Goals:

- Add reranking after initial retrieval
- Compare top-k before and after reranking
- Prioritise context that is most relevant to the event/prediction
- Avoid forcing irrelevant rule matches

Learning focus:

- reranking
- retrieval quality improvement
- context selection
- precision vs recall

---

## Day 28: Function Calling Search Tool

Status: Planned.

Goals:

- Expose search as a callable tool/function
- Define tool input/output schemas
- Let the LLM request a search instead of always running fixed retrieval
- Keep tool outputs structured and safe
- Avoid giving tools unnecessary permissions

Learning focus:

- function calling
- tool schemas
- LLM tool use
- tool safety boundaries

---

## Day 29: Agentic Retrieval Loop

Status: Planned.

Goals:

- Implement a loop where the LLM can:
  - decide to call a search tool
  - inspect returned context
  - call another tool if needed
  - stop and produce a final structured answer
- Add max-iteration safeguards
- Add fallback behaviour when no relevant context is found.
Additional goals:

- Let the agent inspect recent event history for a friend
- Detect repeated patterns, such as many negative events about the same person
- Generate bias/pattern notes when history suggests possible narrator bias
- Log pattern observations separately from individual event assessments
- Treat pattern observations as signals or hypotheses, not proof
- Use pattern notes as context in future assessments
- Detect behaviour trends over time, not just repeated patterns
- Compare older events with newer events for the same friend
- Identify possible improvement, deterioration, or inconsistency
- Log trend observations separately from individual assessments
- Treat trends as tentative signals, not definitive character judgements
Example:

If most recent events about Cole are negative, the agent may log a pattern signal:

"Recent event history about Cole is strongly negative. This may indicate genuine repeated conflict, selective event logging, temporary frustration, or narrator bias. Future assessments should account for this uncertainty."

This should reduce overconfidence, not automatically invalidate the events.

Learning focus:

- agentic RAG
- tool loop control
- preventing infinite loops
- deciding when retrieval is needed

---

## Day 30: Retrieval Evaluation

Status: Planned.

Goals:

- Create test queries for retrieval
- Define expected relevant records
- Measure hit rate
- Measure precision
- Measure recall where practical
- Compare keyword search, semantic search, and reranking

Learning focus:

- retrieval evaluation
- hit rate
- precision/recall
- regression testing retrieval quality

---

## Day 31: Golden Examples and Regression Tests

Status: Planned.

Goals:

- Create golden examples for assessments and predictions
- Compare expected assessment behaviour with actual output
- Test positive, negative, neutral, and mixed cases
- Test cases where no rule should match
- Regression test prompt and retrieval changes

Learning focus:

- end-to-end LLM evaluation
- golden datasets
- prompt regression testing
- output quality checks

---

## Day 32: Agentic RAG Evaluation

Status: Planned.

Goals:

- Evaluate whether the agent searched when it should
- Evaluate whether the agent avoided unnecessary searches
- Evaluate whether retrieved context was used correctly
- Evaluate final structured answers
- Add guardrails for poor tool usage

Learning focus:

- agent behaviour evaluation
- tool-use evaluation
- end-to-end agentic RAG quality

---

## Zoomcamp Milestone

By the end of Day 32, the project should include:

- Searchable knowledge base
- Ingestion layer
- Retrieval layer
- Basic RAG pipeline
- Embeddings
- Semantic retrieval
- Reranking
- Function/tool calling
- Agentic retrieval loop
- Retrieval evaluation
- End-to-end LLM evaluation
- API interface
- Documentation

This should satisfy the core requirements of the LLM Zoomcamp capstone project.

---

# Phase 5: Extended AI Features

## Day 33: LLM Tracing and Prompt Analytics

Status: Planned.

Goals:

- Trace LangChain/LLM calls
- Track prompt version
- Track model name
- Track latency
- Track token usage/cost where available
- Track structured output validity
- Analyse retrieved context quality after RAG is added

Possible tools:

```txt
LangSmith
Langfuse
Helicone
OpenTelemetry
custom logging
```

Learning focus:

- LLM observability
- debugging prompt behaviour
- cost and latency awareness
- model comparison

---

## Day 34: Document Ingestion

Status: Planned.

Goals:

- Add document ingestion after the core RAG pipeline exists
- Start with TXT and Markdown
- Later support CSV, DOCX, and PDF
- Extract text
- Clean and normalise text
- Split content into chunks
- Add metadata for source, friend/person, date, and document type
- Reuse the existing ingestion/retrieval pipeline

Possible models:

```txt
Document
DocumentChunk
```

Learning focus:

- document ingestion
- preprocessing
- chunking
- metadata design
- handling messy input

---

# Phase 6: Quality and Productisation

## Day 35: Route Tests

Status: Planned.

Goals:

- Add route-level tests where practical
- Test friend update route behaviour
- Test note append route behaviour
- Test `/friends/search` missing query parameter behaviour
- Test soft-delete behaviour
- Verify deleted friends return `404`
- Verify deleted friends disappear from search results
- Verify a second delete returns `404`
- Decide database testing strategy for Prisma-backed routes
- Keep tests fast and reliable

Learning focus:

- route tests vs schema tests
- Fastify `app.inject(...)`
- database test strategy

---

## Day 36: Data Model Hardening

Status: Planned.

Goals:

- Convert `Rule.weight` to a Prisma enum
- Convert `Rule.impactDirection` to a Prisma enum
- Update Prisma-generated types
- Update Zod schemas
- Update route validation
- Add optional `pronouns` field to `Friend`
- Consider whether pronouns later belong on a generalised `Person` model

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

Learning focus:

- schema migration
- Prisma enums
- optional profile data
- privacy-aware data modelling

---

## Day 37: Documentation and Portfolio Polish

Status: Planned.

Goals:

- Update README
- Update ROADMAP
- Update API docs
- Update architecture docs
- Add/update `.env.example`
- Document endpoints
- Document testing commands
- Document CI
- Document RAG architecture
- Document evaluation results
- Keep project portfolio-readable

Learning focus:

- technical documentation
- portfolio presentation
- explaining architecture clearly

---

## Day 38: Human Verification

Status: Planned.

Goals:

- Design human verification for model-generated assessments and predictions
- Allow users to mark model output as verified, rejected, corrected, or unverified
- Support persisted assessments and hypothetical predictions
- Separate model-generated judgement from human-verified judgement
- Store optional correction/explanation

Possible statuses:

```txt
unverified
verified
rejected
corrected
```

Learning focus:

- human-in-the-loop AI
- feedback data modelling
- separating model output from verified truth

---

## Day 39: Relationship Notes Design

Status: Planned.

Goals:

- Design notes that belong to a relationship between two people
- Support shared habits
- Support background context
- Support preferences
- Support relationship routines
- Support recurring activities
- Prepare notes for future relationship-centred RAG context

Future model idea:

```txt
Person
Relationship
RelationshipNote
Event
```

Learning focus:

- relationship-centred data modelling
- contextual memory
- retrieval design
- long-term relationship context

---

# Phase 7: Infrastructure, Deployment, Security, and Privacy

## Day 40: Supabase Migration

Status: Planned.

Goals:

- Move from local PostgreSQL to Supabase-hosted Postgres
- Update `DATABASE_URL`
- Run Prisma migrations against Supabase
- Use Supabase dashboard
- Explore Supabase Vector / pgvector
- Optionally explore Supabase Auth later

Learning focus:

- hosted Postgres
- cloud database connection strings
- database migrations in hosted environments
- Supabase dashboard
- Supabase Vector

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

Learning focus:

- Docker basics
- Dockerfile
- docker-compose
- reproducible local development setup

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

Learning focus:

- backend deployment
- hosted environment variables
- migration safety
- testing deployed APIs

---

## Day 43: Security and Access Control

Status: Planned.

Goals:

- Plan authentication and authorisation
- Protect private friendship data
- Improve secret management
- Add rate limiting
- Add prompt-injection awareness
- Add safe LLM usage patterns
- Add security checks in CI
- Consider least-privilege database access

Learning focus:

- secure API development
- auth basics
- least privilege
- rate limiting
- secure LLM application design

---

## Day 44: Monitoring, Observability, and GDPR Planning

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
- Apply data minimisation and purpose limitation
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

Learning focus:

- production observability
- logs
- metrics
- traces
- privacy-by-design
- user rights
- data governance
- sensitive data handling

---

# Phase 8: Frontend

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

Learning focus:

- consuming backend APIs from a frontend
- responsive UI basics
- frontend/backend integration
- presenting LLM output safely
- keeping frontend work secondary to backend and AI engineering

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
