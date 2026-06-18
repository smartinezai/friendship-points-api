# Friendship Points API Roadmap

This roadmap tracks the 50-day Friendship Points API learning project.

Primary milestone:

```txt
Reach a complete LLM Zoomcamp-compliant RAG project first.
Do production hardening, multi-user modelling, and extra product features afterwards.
```

The main project README is in [`README.md`](./README.md).

---

# Detailed 50-Day Roadmap

## Current Position

Completed:

```txt
Day 1–27: Backend foundation, validation, CI, soft delete, keyword search, ingestion, RAG, embeddings, semantic retrieval, and reranking
```

Next:

```txt
Day 28: Function Calling Search Tool
```

---

## Testing Rule From Day 28 Onwards

For every newly added feature:

- Check whether unit, schema, service, route, or integration tests are required
- Add or update tests in the same development step where practical
- Do not postpone pure-function and schema tests to the later integration-testing phase
- Use Day 38 for database-backed route and integration testing, not as a substitute for earlier unit tests
- Run lint, tests, and build before marking a day complete

Standard checks:

```bash
npm run lint
npm test
npm run build
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

Learning focus:

- Fastify route design
- request parameters
- query parameters
- basic validation
- CRUD endpoint structure

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

Learning focus:

- relational modelling
- nested resources
- route parameters
- domain-specific validation

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

Learning focus:

- event modelling
- optional fields
- timestamp handling
- one-to-many relations

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

Learning focus:

- service-layer extraction
- avoiding route bloat
- duplicate handling
- explicit error behaviour

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

Learning focus:

- LLM workflow design
- structured output
- model/provider boundaries
- bias-aware prompting

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

Learning focus:

- mock providers
- schema-first LLM output
- deterministic development before real API calls
- separating testable logic from provider calls

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

Learning focus:

- provider abstraction
- real LLM API integration
- shared provider interfaces
- graceful provider limitations

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

Learning focus:

- prompt maintainability
- versioning prompts
- provider config
- metadata for traceability

---

## Day 11: Route and Request Validation

Status: Done.

Goals:

- Validate manual assessment requests
- Validate friend creation/update/note append requests
- Validate rule creation/weight update requests
- Validate event creation requests
- Use Zod for runtime request validation

Learning focus:

- Zod schemas
- runtime validation
- request boundary safety
- validation error design

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

Learning focus:

- PATCH semantics
- append vs replace behaviour
- soft-delete preparation
- route consistency

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

Learning focus:

- hypothetical LLM workflows
- read-only prediction flows
- provider reuse
- avoiding unwanted persistence

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

Learning focus:

- unit testing
- validation tests
- testable helper design
- build/test separation

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

Learning focus:

- consistent API errors
- reusable error helpers
- predictable HTTP responses
- separation between client errors and server errors

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

Learning focus:

- safe logging
- `unknown` error handling
- internal vs external error detail
- production-safe diagnostics

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

Learning focus:

- Git hooks
- local quality gates
- preventing broken pushes
- automation discipline

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

Learning focus:

- soft delete
- filtering active records
- deletion semantics
- data retention trade-offs

---

# Phase 4: Zoomcamp Compliance First — Search, RAG, and Agentic Retrieval

This phase is prioritised so the project becomes a complete LLM Zoomcamp-style RAG project before adding lower-priority production/product features.

## Day 21: Keyword Search over Rules, Notes, and Events

Status: Done.

Implemented:

- Added keyword tokenisation
- Added keyword scoring with unique query tokens
- Added unit tests for tokenisation and keyword scoring
- Searched friendship rules
- Searched friend notes
- Searched past event text
- Returned ranked search results
- Added `/friends/:id/search-context?query=...` for manual testing

Learning focus:

- basic retrieval
- keyword search
- search result ranking
- why RAG needs a retrieval layer

---

## Day 22: Search Ingestion Layer

Status: Done.

Implemented:

- Added `SearchableDocument` model
- Added relation from `Friend` to searchable documents
- Added ingestion service for notes, active rules, and events
- Added rebuild logic that clears old search documents and recreates current ones
- Added manual rebuild route
- Returned created document count from rebuild route

Learning focus:

- ingestion pipeline
- searchable knowledge base
- metadata design
- source-data synchronisation

---

## Day 23: Basic RAG Pipeline

Status: Done.

Implemented:

- Added retrieved context support to LLM assessment inputs
- Added retrieved context to the prompt
- Used `SearchableDocument` retrieval for predictions
- Returned retrieved context in prediction responses
- Used `SearchableDocument` retrieval for event assessments
- Returned retrieved context in assessment responses

Learning focus:

- retrieve → prompt → LLM
- fixed RAG pipeline
- prompt context construction
- context/no-context handling

---

## Day 24: Retrieval Service Refactor

Status: Done.

Implemented:

- Separate retrieval from prompt building
- Separate prompt building from model calling
- Create reusable retrieval/RAG service functions
- Add typed search result and context item objects
- Reuse the RAG flow for assessments and predictions
- Keep provider-specific logic behind a common prediction interface
- Exclude the current event from retrieved context when assessing an existing event
- Prevent duplicated context where the event being assessed is retrieved again from `SearchableDocument`
- Keep historical events available for retrieval, but exclude the current event by `sourceType` and `sourceId`
- Marked live-table keyword search as legacy/comparison-only

Learning focus:

- reusable RAG abstraction
- service design
- separation of concerns
- typed context objects

---

## Day 25: Embeddings and Vector Storage

Status: Done.

Implemented:

- Upgraded local PostgreSQL from 16 to 17 for pgvector compatibility
- Enabled the `vector` extension
- Added raw SQL migration for `SearchableDocument.embedding vector(1024)`
- Added Mistral embedding generation service
- Added embedding dimension validation
- Added raw SQL update for pgvector embeddings
- Added batch embedding generation for searchable documents without embeddings
- Added manual embedding generation route

Learning focus:

- embeddings
- pgvector
- vector columns
- raw SQL where Prisma cannot model extension-specific types
- embedding dimension validation

---

## Day 26: Semantic Retrieval

Status: Done.

Implemented:

- Added semantic retrieval using stored searchable document embeddings
- Added query embedding generation for semantic search
- Added pgvector cosine-distance search using `<=>`
- Added friend-level metadata filtering
- Added manual semantic search route for testing
- Compared semantic retrieval output against keyword retrieval output

Learning focus:

- semantic search
- similarity search
- metadata filtering
- keyword vs vector retrieval trade-offs

---

## Day 27: Reranking

Status: Done.

Implemented:

- Added deterministic reranking for retrieved context
- Added source-type boosts for rules, events, and friend notes
- Added rerank scores and rerank reasons to retrieved context items
- Added manual reranked search route for testing
- Compared raw semantic retrieval output against reranked output
- Verified reranking can correct weak ordering from short semantic matches

Learning focus:

- reranking
- retrieval quality improvement
- context selection
- precision vs recall
- deterministic ranking before model-based ranking

Known limitation:

- The initial deterministic reranker uses keyword overlap and source-type boosts; semantic-score weighting and stop-word filtering will be evaluated on Day 30.

---

## Day 28: Function Calling Search Tool

Completed:

- Added friend-context search as a LangChain-compatible tool
- Added Zod input schema with UUID, query, and limit validation
- Added validation boundary for untrusted tool-call payloads
- Added schema, tool behaviour, and execution-boundary tests
- Verified manual LangChain tool invocation
- Verified Mistral can select the tool and generate valid tool-call arguments
- Verified manual tool-execution loop with model → tool → model flow

Known follow-up:

- Reranking quality improvements are deferred to Day 30 retrieval evaluation
- Empty sourceId values in searchable documents need investigation during indexing/retrieval test backfill

---

## Day 29: Friend Context Agent

Status: Complete.

Completed:

- Added a reusable LangChain friend-context agent
- Configured the agent with the semantic friend-context search tool
- Added system instructions for tool use, grounding, and prompt-injection protection
- Verified the real model → tool → model execution loop
- Verified that simple greetings do not trigger retrieval
- Added dependency injection for chat models and tools
- Added automated tests using a fake model and fake search tool
- Tested direct responses without retrieval
- Tested tool execution for history-dependent requests
- Tested cautious responses when retrieval returns insufficient context

Known follow-ups:

- Improve reranking quality during Day 30 retrieval evaluation
- Investigate empty searchable-document source IDs during the test backfill
- Add a service or route wrapper only when the agent is connected to a real API workflow

Learning focus:

- agentic RAG
- tool loop control
- preventing infinite loops
- deciding when retrieval is needed
- pattern detection as a hypothesis rather than proof

---

### Day 30 — Retrieval evaluation and service test backfill

Status: Complete

Completed:

- Added retrieval evaluation fixtures
- Added reranking regression tests
- Added stop-word filtering for keyword scoring
- Included semantic distance in hybrid reranking
- Reduced source-type boost so it acts as a tie-breaker rather than dominating relevance
- Filtered invalid/empty source IDs from retrieved context
- Added manual retrieval evaluation script
- Added multilingual, no-match, and weak-match retrieval evaluation queries
- Added expected-hit reporting and summary output to the evaluation script

Findings:

- The correct apology event ranks first for apology-related English queries
- The unexpected-call rule ranks first for the unexpected-call query
- Spanish queries can retrieve relevant English context through semantic similarity
- No-match queries still return weak nearest-neighbour results because semantic retrieval always returns the closest available documents
- Simple thresholding is not safe yet because useful multilingual matches and no-match results have overlapping scores
- Friend names such as "Cole" can inflate keyword scores in friend-scoped retrieval

Deferred:

- Relevance thresholding
- Friend-name-aware keyword scoring
- More robust multilingual evaluation with actual Spanish stored source documents

---

### Day 31 — Source-grounded agent responses

Status: In progress

Completed:

- Required the friend context agent to cite retrieved context
- Added source citation expectations to the agent tests
- Added formatted `citation` fields to search tool results
- Updated the agent prompt to reuse citation fields
- Tightened the prompt so the agent copies citation fields exactly
- Normalised agent smoke-test output for readable message content
- Verified the real agent copies citations in the expected format
Completed:
- Added formatted `citation` fields to search tool results
- Updated the agent prompt to copy citation fields exactly
- Normalised production agent smoke-test output
- Added a smoke-test assertion that retrieval-backed answers include the expected citation
- Added a smoke-test assertion that greeting requests do not trigger tool calls

Verified behaviour:

- Retrieval-backed answer includes `[event: aa4e0523-356c-4db5-99f5-ef0d39ffc863]`
- Greeting request does not call the search tool
- Automated tests and TypeScript build pass

Known issue:

- Citation compliance is still prompt-based. A later API-layer response formatter could make citations deterministic.

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

# Phase 5: Extended AI and Knowledge Features

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

## Day 35: User Identity and Ownership Foundation

Status: Planned.

Goals:

- Add a basic `User` model
- Represent the current app user explicitly
- Link the current user to a `Person` record
- Add `ownerUserId` or equivalent ownership fields where needed
- Make it possible to distinguish:
  - the current user
  - another person
- Add a minimal request-context mechanism for identifying the current user
- Keep authentication simple or mocked initially
- Seed one development user for local learning and testing
- Defer production-grade authentication and security hardening until Day 47

Learning focus:

- user identity
- ownership
- request context
- self vs other-person modelling
- preparing for multi-user support
- identity modelling vs authentication

---

## Day 36: Person Facts and Verification Status

Status: Planned.

Goals:

- Add a fact model linked to a person
- Allow users to add facts through the API first
- Mark self-added facts about the current user as `verified_self_declared`
- Mark facts about another person as `unverified_third_party` by default
- Store source metadata, author, target person, verification status, and timestamps
- Ingest verified and unverified facts into searchable/RAG context with different trust levels
- Treat verified self-declared facts as stronger evidence than unverified third-party facts
- Allow future correction, rejection, or verification by the target person

Possible model idea:

```txt
PersonFact
- id
- personId
- authorPersonId
- content
- verificationStatus
- sourceType
- sourceId
- createdAt
- updatedAt
```

Possible statuses:

```txt
verified_self_declared
unverified_third_party
verified_by_target
rejected_by_target
corrected
```

Learning focus:

- fact modelling
- verification workflows
- trust levels in RAG context
- self vs other-person logic
- human-in-the-loop knowledge management

---

## Day 37: Person Knowledge Intake Forms

Status: Planned.

Goals:

- Create a Google Form or app-generated form that can be sent to a person
- Ideally send the form through the app once messaging/email integration exists
- Collect structured information about the person, such as work, hobbies, likes/dislikes, values, principles, habits, routines, communication preferences, boundaries, goals, and recurring activities
- Link each form submission to the person who filled it out
- Import submitted answers into the app
- Convert form answers into searchable person facts or knowledge entries
- Mark self-submitted form answers as verified or self-declared
- Store form source metadata, submission timestamp, and question/answer provenance
- Ingest the resulting knowledge into searchable/RAG context
- Treat self-submitted form answers as stronger evidence than third-party claims
- Allow the person to later update, correct, revoke, or delete submitted information

Possible implementation options:

```txt
Option 1: Google Forms + Google Sheets export/import
Option 2: Google Forms API integration
Option 3: Native in-app questionnaire
```

Possible model idea:

```txt
KnowledgeForm
KnowledgeFormQuestion
KnowledgeFormSubmission
KnowledgeFormAnswer
PersonFact
```

Learning focus:

- structured knowledge collection
- form ingestion
- data provenance
- consent-aware data modelling
- RAG ingestion from external sources
- verified/self-declared knowledge handling

---

# Phase 6: TypeScript, Testing, and API Contract Quality

## Day 38: Route and Integration Testing

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
- Add route tests for keyword, semantic, and reranked context endpoints
- Add service tests for retrieval and reranking
- Add ranking/sorting tests for search results
- Add edge-case tests for empty query, missing friend, deleted friend, and no matches
- Add UUID validation for route parameters such as `friendId`, `eventId`, and `ruleId`
- Add an isolated test database setup
- Run Prisma migrations before integration tests
- Add factories for friends, rules, events, assessments, searchable documents, users, persons, and facts
- Test full request → database → response flows
- Reset test data safely between tests
- Distinguish route tests, service tests, and integration tests
- Test search-index rebuild routes
- Test embedding-generation routes without calling the real provider
- Test keyword search routes
- Test semantic search routes
- Test reranked search routes
- Test tool-backed agent routes added during Days 28–29
- Verify malformed UUIDs return `400`
- Verify missing friends return `404`
- Verify deleted friends cannot be searched
- Verify empty queries are rejected
- Verify no-match responses are valid and predictable
- Verify database records have valid source IDs
- Test full request → service → database → response flows

Testing scope:

- Unit and schema tests should already accompany earlier feature work
- Day 38 focuses on Fastify route behaviour and real database integration

Learning focus:

- route tests vs schema tests
- Fastify `app.inject(...)`
- database test strategy
- integration testing
- test isolation
- API behaviour vs implementation testing

---

## Day 39: Data Model and Type Architecture Hardening

Status: Planned.

Goals:

- Convert `Rule.weight` to a Prisma enum
- Convert `Rule.impactDirection` to a Prisma enum
- Update Prisma-generated types
- Update Zod schemas
- Update route validation
- Add optional `pronouns` field to `Person`
- Consider human-readable slugs as an optional alternative to UUIDs for development and URLs
- Decide whether slugs should be unique globally or only per user/account
- Keep UUIDs as primary database identifiers
- Separate database types, API request/response types, and LLM provider types
- Avoid leaking Prisma models directly as public API contracts
- Add explicit DTO types for route responses
- Use `satisfies` where useful for typed config objects
- Use discriminated unions for provider results and domain outcomes

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
- type boundaries
- DTOs
- discriminated unions
- `satisfies`
- avoiding over-coupling Prisma types to API contracts

---

## Day 40: API Contract and OpenAPI Documentation

Status: Planned.

Goals:

- Add OpenAPI documentation for public routes
- Document request bodies, response bodies, error responses, and auth assumptions
- Keep Zod schemas and API docs aligned where practical
- Add examples for friend/person, rule, event, assessment, prediction, search, RAG, facts, and form endpoints
- Decide whether to generate OpenAPI from route schemas or maintain it manually

Learning focus:

- API contracts
- schema reuse
- typed request/response design
- documentation as part of backend quality
- external API contracts vs internal implementation types

---

## Day 41: TypeScript Refactor and Code Review

Status: Planned.

Goals:

- Remove unnecessary `any`
- Tighten `unknown` handling
- Replace duplicated route types with reusable helpers
- Review service return types
- Add typed domain errors where useful
- Simplify over-complicated generics
- Review the full codebase for noisy beginner comments
- Keep useful comments for non-obvious TypeScript, Prisma, RAG, and LLM logic
- Document exported services and helpers concisely

Learning focus:

- practical TypeScript maintainability
- readable types
- refactoring safely
- balancing strictness and clarity
- professional code documentation

---

# Phase 7: Infrastructure, Deployment, Security, and Privacy

## Day 42: Supabase Migration

Status: Planned.

Goals:

- Move from local PostgreSQL to Supabase-hosted Postgres
- Update `DATABASE_URL`
- Run Prisma migrations against Supabase
- Use the Supabase dashboard
- Explore Supabase Vector / pgvector
- Keep local PostgreSQL available for development and tests
- Optionally explore Supabase Auth later

Learning focus:

- hosted Postgres
- cloud database connection strings
- database migrations in hosted environments
- Supabase dashboard
- Supabase Vector

---

## Day 43: Runtime Configuration Validation

Status: Planned.

Goals:

- Add `env.schema.ts`
- Validate `DATABASE_URL`, provider API keys, model names, embedding dimensions, and environment mode
- Fail fast with clear startup errors
- Keep test, development, and production config explicit
- Ensure deployment environments expose the required variables
- Avoid reading `process.env` directly throughout the codebase where a typed config module is clearer

Learning focus:

- runtime validation vs compile-time types
- safe config loading
- typed environment variables
- fail-fast backend design
- deployment-safe configuration

---

## Day 44: Docker and Local DevOps

Status: Planned.

Goals:

- Containerise the API
- Containerise PostgreSQL with pgvector support
- Add `Dockerfile`
- Add `docker-compose.yml`
- Run the full app locally with Docker
- Practise environment variables in containers
- Add a Docker-friendly `.env.example`

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

## Day 45: Background Jobs for Ingestion and Embeddings

Status: Planned.

Goals:

- Move embedding generation into a job-style workflow
- Track job status: pending, running, succeeded, failed
- Add retry handling for provider failures
- Add idempotency so documents are not embedded twice accidentally
- Keep API responses fast while work continues separately
- Decide whether to keep the implementation simple in-process or use a queue later

Possible tools:

```txt
simple database-backed job table
BullMQ
pg-boss
Temporal
```

Learning focus:

- async job design
- retries
- idempotency
- long-running backend workflows
- provider failure handling

---

## Day 46: Deployment and Environment Management

Status: Planned.

Goals:

- Deploy the Fastify backend API
- Use Render as the likely backend hosting option
- Use Supabase Postgres as the likely hosted database
- Add environment variables on the hosting platform
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

## Day 47: Authentication, Authorisation, and API Security

Status: Planned.

Goals:

Authentication:

- Replace the mocked/development identity with real authentication
- Add simple bearer-token or session-based authentication
- Establish the authenticated user in Fastify request context

Authorisation and ownership:

- Enforce ownership checks for persons, relationships, rules, events, assessments, searchable documents, facts, and form submissions
- Prevent cross-user data access
- Add route tests for unauthorised and forbidden access
- Apply least-privilege database and tool access

API security:

- Add request size limits
- Add rate limiting for LLM-heavy endpoints
- Add CORS policy
- Ensure secrets never appear in logs
- Add dependency audit checks
- Review input sanitisation requirements

LLM/RAG security:

- Review prompt-injection risks in RAG and tool-calling flows
- Add prompt-injection safeguards for imported or retrieved content
- Avoid giving tools unnecessary permissions

Learning focus:

- secure API development
- authentication vs authorisation
- multi-tenant data modelling
- request context typing
- least privilege
- rate limiting
- secure LLM application design

---

## Day 48: Monitoring, Privacy, and Documentation Polish

Status: Planned.

Goals:

Monitoring and observability:

- Add request/error logging
- Add structured logging
- Monitor API latency
- Track endpoint usage metrics
- Add health checks
- Connect errors to tools such as Sentry later
- Add LLM cost/token tracking
- Add audit logs for sensitive actions

Privacy and compliance planning:

- Plan GDPR / DSGVO compliance before real-user usage
- Consider German BDSG requirements where relevant
- Define lawful basis and consent models
- Apply data minimisation and purpose limitation
- Design data access, deletion, export, and correction flows
- Define retention and deletion policies
- Secure sensitive relationship, event, claim, fact, and imported-message data
- Add visibility controls
- Add a real GDPR erasure flow separate from soft delete
- Add backup and restore plans

Documentation and portfolio polish:

- Update README and ROADMAP
- Update API and architecture documentation
- Add/update `.env.example`
- Document endpoints, testing commands, and CI
- Document RAG architecture and evaluation results
- Add architecture diagrams
- Add API examples
- Document known production, security, and privacy limitations honestly

Critical design note:

This should be treated as a legal/privacy design task, not just a technical checkbox. Before real users use the app, it should receive proper legal review.

Possible tools:

```txt
Sentry
Grafana
OpenTelemetry
structured logger
```

Learning focus:

- production observability
- logs, metrics, and traces
- privacy-by-design
- user rights
- data governance
- technical documentation
- portfolio presentation

---

# Phase 8: Frontend and Final Delivery

## Day 49: Responsive GUI / Frontend

Status: Planned.

This should remain near the end because frontend development is not the main focus of this project. Backend, AI, testing, DevOps, security, privacy, compliance, and multi-user design come first.

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
- Add GUI entry points for person facts and knowledge forms
- Display knowledge source and verification status

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

## Day 50: Final Review, Demo, and Capstone Submission

Status: Final planned task.

Goals:

- Run full lint/test/build checks
- Run retrieval and RAG evaluation checks
- Verify the deployed or local demo flow
- Prepare the final project summary
- Prepare a demo script
- Document what satisfies the Zoomcamp capstone requirements
- Document known limitations and future work
- Make final README and roadmap updates
- Tag a final project milestone release

Possible final checks:

```bash
npm run lint
npm test
npm run build
```

Demo flow:

```txt
create user/person
create friend/relationship
add rules
add events
rebuild searchable documents
generate embeddings
run semantic retrieval
run reranked RAG assessment
run prediction
add a verified or unverified fact
inspect retrieved context
show evaluation examples
```

Learning focus:

- final project delivery
- capstone packaging
- demo storytelling
- technical self-review
- portfolio readiness

# Future Backlog Beyond Day 50

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

## Relationship Notes and Relationship-Centred Memory

Goal:

Design notes that belong to a relationship between two people rather than only to one friend/person.

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

## Production Readiness Checklist

- Authentication and authorisation
- Environment-specific config
- Database backup/restore strategy
- Migrations strategy for production
- Structured logging
- Metrics and tracing
- Error monitoring
- Rate limiting
- Security headers
- Input validation and request limits
- Prompt-injection safeguards
- Dependency scanning
- CI checks for lint, tests, build, and security
- API documentation
- GDPR deletion/export/correction flows
- Load/performance testing
- Deployment rollback plan

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

---

## Signal Conversation Import

Goal:

Allow users to import Signal conversation history manually and convert selected messages into events, facts, and RAG context.

Goals:

- Support manual paste or file import of Signal conversation text
- Parse messages into sender, timestamp, and message content where available
- Link imported messages to the relevant person or relationship
- Use an LLM to propose candidate events, facts, preferences, habits, and context
- Require human review before saving extracted events or facts
- Mark imported facts as unverified unless confirmed by the relevant person
- Store provenance linking facts/events back to the imported message source
- Ingest approved items into searchable/RAG context
- Avoid automatic scoring from raw messages without human confirmation

Learning focus:

- conversation ingestion
- message parsing
- extraction pipelines
- provenance
- consent-aware knowledge modelling
- human review before persistence

---

## Agent-Suggested Relationship Rules

Goal:

Use imported conversations, extracted facts, events, and relationship patterns to suggest new friendship/relationship rules for human review.

Goals:

- Analyse approved imported conversation context, extracted events, and person facts
- Detect repeated preferences, boundaries, repair patterns, conflict triggers, and positive behaviours
- Generate candidate rules from observed patterns
- Store candidate rules separately from active rules
- Require human review before a candidate rule becomes active
- Allow users to accept, reject, edit, or archive suggested rules
- Store provenance explaining which events, facts, or messages motivated the suggestion
- Mark agent-suggested rules as unverified until approved
- Avoid creating rules from a single ambiguous message unless the suggestion is clearly tentative
- Prevent the agent from making sensitive or moralising judgements about a person
- Re-run retrieval/assessment only after rule approval

Possible model idea:

```txt
SuggestedRule
- id
- friendId / relationshipId
- title
- description
- suggestedImpactDirection
- suggestedWeight
- confidence
- rationale
- provenanceSourceIds
- status
- createdAt
- reviewedAt
```

Possible statuses:

```txt
suggested
accepted
edited_and_accepted
rejected
archived
```

Learning focus:

- agent-assisted knowledge modelling
- human review workflows
- provenance
- rule induction from examples
- avoiding overfitting to isolated events
- safe AI suggestions

---

## Consent-Gated Scheduled Conversation Import

Goal:

Allow users to schedule recurring conversation imports while requiring explicit consent from all affected participants before each import or export operation.

Goals:

- Allow users to configure how often conversation imports are attempted
- Support manual-only, weekly, monthly, and custom schedules
- Notify all affected conversation participants before an import or export is attempted
- Require explicit consent from every required participant before processing begins
- Block the operation if consent is missing, rejected, expired, or revoked
- Record who consented, when they consented, the approved data scope, and the authorised operation
- Require new consent when the conversation, date range, processing purpose, or enabled extraction features change
- Allow participants to pause or disable future scheduled imports
- Allow participants to revoke consent before processing begins
- Notify participants when an import succeeds, fails, expires, or is cancelled
- Never treat consent to one import as permanent blanket consent

Possible import statuses:

```txt
scheduled
awaiting_consent
approved
rejected
cancelled
running
succeeded
failed
expired
```

Possible consent statuses:

```txt
pending
granted
rejected
revoked
expired
```

Possible model idea:

```txt
ConversationImportSchedule
ConversationImportAttempt
ConversationImportConsent
```

Learning focus:

- scheduled workflows
- multi-party consent
- revocable consent
- privacy-aware automation
- auditability

---

## Temporary Chat Data Retention and Deletion

Purpose:

Minimise stored raw conversation data and regularly delete imported chat data that is no longer needed.

Requirements:

- Store raw messages only for the shortest period required for parsing, review, and approved extraction
- Separate raw imported messages from approved derived knowledge
- Define when raw data becomes unused
- Delete temporary files, raw messages, failed-import payloads, and intermediate LLM outputs after the retention period
- Allow configurable retention periods
- Run regular deletion jobs
- Record deletion outcomes without retaining deleted message content
- Delete embeddings derived from rejected or deleted raw content
- Remove derived facts, events, or rules if their source is withdrawn and no lawful retention reason exists
- Support immediate deletion when consent is revoked, where applicable
- Provide a preview of data scheduled for deletion
- Protect approved facts and events from accidental deletion while preserving provenance
- Add backup-retention rules so deleted chat data is not silently restored later

Possible retention categories:

```txt
raw_import
temporary_processing
rejected_candidate
approved_derived_knowledge
audit_metadata
```

Possible model idea:

```txt
DataRetentionPolicy
DataDeletionJob
```

Learning focus:

- scheduled workflows
- multi-party consent
- revocable consent
- data minimisation
- retention policies
- deletion jobs
- provenance-aware deletion
- privacy-by-design

Design notes:

- For group chats, consent may need to come from every participant whose messages are processed.
- Consent authorises processing; it does not verify that every statement in the messages is accurate.
