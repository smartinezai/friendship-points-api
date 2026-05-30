# Friendship Points API Roadmap

This file contains the detailed 40-day roadmap and future backlog for the Friendship Points API project.

The main project README is in [`README.md`](./README.md).

---

# Detailed 40-Day Roadmap

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

Important prompt rule:

- Only include a rule ID in `matchedRuleIds` if the rule is semantically relevant.
- Do not match a rule just because it exists.
- Return `matchedRuleIds: []` if no rule clearly applies.

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

- prompt modularization
- provider-agnostic prompt design
- LLM metadata tracking
- future tracing/evaluation foundation

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

---

## Day 12: Friend Management Endpoints

Status: Mostly done.

Implemented:

```http
PATCH /friends/:id
POST /friends/:id/notes/append
```

Implemented goals:

- Update friend display name
- Replace friend notes
- Append new note text without deleting previous notes
- Validate update and append request bodies with Zod

Still planned:

```http
DELETE /friends/:id
```

Delete design decision:

Do not implement hard delete casually. A friend has related rules, events, and assessments. Hard deletion can destroy useful history and cause relational issues.

Planned soft-delete approach:

- Add `deletedAt DateTime?` to `Friend`.
- `DELETE /friends/:id` sets `deletedAt` instead of removing the row.
- `GET /friends` excludes friends where `deletedAt` is not null.
- `GET /friends/search` excludes soft-deleted friends.
- Decide whether `GET /friends/:id` should return soft-deleted friends or return `404`.
- Keep related rules, events, and assessments available for history/audit unless explicitly designed otherwise.
- Later consider restore endpoint such as `POST /friends/:id/restore`.

---

## Day 13: Prediction Endpoint

Status: Done.

Implemented endpoints:

```http
POST /friends/:friendId/predict
POST /friends/:friendId/predict/mistral
```

Implemented goals:

- Add endpoint for hypothetical actions
- Use friend details, friend notes, and active rules as context
- Return predicted score impact
- Keep prediction separate from persisted event history
- Validate prediction request bodies with Zod
- Reuse the LLM assessment input shape for hypothetical events
- Add prediction input builder helper
- Add friend-with-active-rules lookup helper
- Support mock predictions without external API calls
- Support real Mistral predictions
- Return `saved: false` to make clear that no event or assessment was persisted

Important behavior:

- Prediction endpoints do not create `Event` records.
- Prediction endpoints do not create `Assessment` records.
- The mock prediction provider is structurally useful but not semantically reliable because it uses hardcoded output.

---

## Day 14: Testing Foundation

Status: Done.

Implemented:

- Added Vitest
- Added a basic test setup
- Added test for prediction input builder
- Added tests for prediction request validation
- Added tests for manual assessment validation
- Added tests for friend creation validation
- Added tests for friend update validation
- Added tests for friend note append validation
- Added tests for rule validation
- Added tests for event validation
- Fixed TypeScript build include paths

Checks to run regularly:

```bash
npm test
npm run build
```

Learning focus:

- unit testing
- schema testing
- pure helper tests
- regression prevention
- build checks

---

## Phase 3: Backend Quality, Error Handling, and Local Automation

## Day 15: Error Handling and Response Consistency

Status: Done.

Implemented:

- Added shared `sendValidationError` helper for invalid request bodies
- Added shared `sendBadRequestError` helper for non-body 400 errors such as missing query parameters
- Added shared `sendNotFoundError` helper for 404 responses
- Added shared `sendInternalServerError` helper for 500 responses
- Replaced repeated validation, not-found, and internal-error responses across route files
- Kept `409 Conflict` for duplicate friend names as a custom conflict response

Important distinction:

```txt
Invalid JSON body / Zod body validation failed
→ sendValidationError(...)

Missing query parameter / general bad request
→ sendBadRequestError(...)

Missing friend/rule/event in database
→ sendNotFoundError(...)

Unexpected server/provider failure
→ sendInternalServerError(...)
```

Learning focus:

- consistent API error responses
- difference between body validation errors and general bad requests
- safer client-facing error messages
- reducing repeated route code

---

## Day 16: Safe Internal Logging

Status: Planned.

Goals:

- Make internal error logging consistent across routes
- Log detailed internal errors in server logs
- Return generic client-facing errors
- Avoid exposing stack traces to API clients
- Reduce noisy repeated `console.error` blocks
- Prepare for structured logging later

Possible future tools:

```txt
pino
Sentry
OpenTelemetry
```

Learning focus:

- difference between internal logs and client responses
- production-safe error handling
- debugging without leaking sensitive details

---

## Day 17: Local Test Automation with Husky

Status: Done.

Implemented:

- Installed Husky
- Added `.husky/pre-push`
- Runs `npm test` before push
- Runs `npm run build` before push
- Added an echo line so the hook is visible when running `git push`
- Verified the hook blocks push when it fails
- Confirmed VS Code uses normal Git push flow, though VS Code may not always show hook stdout clearly

Current pre-push behavior:

```bash
echo "Running pre-push hook..."
npm test
npm run build
```

Important distinction:

```txt
Husky = local automation before push
GitHub Actions = remote CI after push / on pull requests
CD = deployment automation, later
```

Learning focus:

- local automation
- pre-push workflow
- preventing broken code from reaching GitHub
- safer small commits

---

## Day 18: GitHub Actions CI

Status: Planned.

Goals:

- Add GitHub Actions workflow
- Run `npm ci`
- Run `npm test`
- Run `npm run build`
- Trigger on push and pull request
- Keep CD/deployment automation separate for later

This is CI:

```txt
push or PR
→ install dependencies
→ run tests
→ run build
→ report pass/fail
```

Why this comes soon:

- Local hooks are helpful but can be skipped or misconfigured.
- GitHub Actions provides a stronger remote safety net.
- CI is valuable now because tests already exist.

Learning focus:

- Continuous Integration
- automated quality checks
- GitHub Actions basics
- portfolio-ready DevOps workflow

---

## Day 19: Friend Soft Delete

Status: Planned.

Goals:

- Add `deletedAt DateTime?` to `Friend`
- Add Prisma migration
- Implement `DELETE /friends/:id` as soft delete
- Filter soft-deleted friends out of normal list/search results
- Decide behavior for `GET /friends/:id` on deleted friends
- Consider a restore endpoint later

Possible endpoints:

```http
DELETE /friends/:id
POST /friends/:id/restore
```

Learning focus:

- soft delete vs hard delete
- relational data safety
- preserving audit/history
- migration planning

---

## Day 20: Optional Pronouns Field

Status: Planned.

Goals:

- Add optional pronouns to the current `Friend` model
- Consider whether this should later move to a generalized `Person` model
- Keep pronouns optional and user-provided
- Consider privacy and visibility implications for the future multi-user version

Possible Prisma field:

```prisma
pronouns String?
```

Learning focus:

- schema migration
- optional profile data
- privacy-aware data modeling
- future compatibility with `Person`

---

## Day 21: Friend Management Route Tests

Status: Planned.

Goals:

- Add route-level tests where practical
- Test friend update route behavior
- Test note append route behavior
- Test missing query parameter behavior for `/friends/search`
- Decide database testing strategy for routes requiring Prisma data
- Keep tests fast and reliable

Possible testing targets:

```txt
PATCH /friends/:id
POST /friends/:id/notes/append
GET /friends/search
soft delete behavior after Day 19
```

Learning focus:

- route tests vs schema tests
- Fastify route testing
- `app.inject(...)`
- database test strategy

---

## Day 22: Documentation and Portfolio Polish

Status: Planned.

Goals:

- Update README
- Update ROADMAP
- Add/update `.env.example`
- Document endpoints
- Document architecture
- Document testing commands
- Document pre-push checks
- Document known limitations, especially mock prediction behavior
- Keep project portfolio-readable

Learning focus:

- technical documentation
- portfolio presentation
- explaining architecture clearly

---

## Phase 4: Human Feedback, Verification, and LLM Evaluation

## Day 23: Human Verification Design for Model Outputs

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

Example:

```txt
Model prediction:
Calling Sam without announcing would be negative.

Human verification:
Sam confirms that this prediction is correct.
```

Learning focus:

- human-in-the-loop AI
- feedback data modeling
- separating prediction from verified truth

---

## Day 24: Human Verification Data Model

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

Learning focus:

- auditability
- feedback storage
- human-labeled data
- future evaluation data

---

## Day 25: LLM Evaluation and Golden Examples

Status: Planned.

Goals:

- Create golden test cases for LLM assessments and predictions
- Evaluate scoring consistency
- Check whether relevant rules are matched
- Penalize irrelevant rule matches
- Regression test prompt changes
- Include cases with `matchedRuleIds: []`
- Use human verification data later as feedback signal

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
- rule matching quality

---

## Day 26: LLM Tracing and Prompt Analytics

Status: Planned.

Goals:

- Trace LangChain/LLM calls
- Track prompt version
- Track model name
- Track latency
- Track token usage/cost where available
- Track structured output validity
- Prepare for prompt comparison

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
- debugging prompt behavior
- cost and latency awareness
- model comparison

---

## Phase 5: Retrieval, RAG, Vector Search, and Document Pipelines

## Day 27: Relationship-Specific Notes Design

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

Learning focus:

- relationship-centered data modeling
- contextual memory
- retrieval design
- long-term relationship context

---

## Day 28: Document Ingestion and Preprocessing

Status: Planned.

Goals:

- Add a first document ingestion flow
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

Learning focus:

- document ingestion
- preprocessing
- chunking
- metadata design
- handling messy input

---

## Day 29: Embeddings and Vector Storage

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

Learning focus:

- embeddings
- vector similarity
- metadata filtering
- vector database tradeoffs
- PostgreSQL + vector search

---

## Day 30: RAG Retrieval and Reranking

Status: Planned.

Goals:

- Retrieve relevant rules, events, notes, and document chunks for a new event or prediction
- Use semantic retrieval instead of sending all available rules
- Add reranking to prioritize the most relevant context
- Pass reranked context into the LLM assessment/prediction flow
- Avoid forcing irrelevant rule matches

Possible flow:

```txt
new event or hypothetical action
→ embedding search
→ retrieve candidate rules/events/notes/chunks
→ rerank candidates
→ pass best context to LLM
→ generate assessment or prediction
```

Learning focus:

- retrieval-augmented generation
- semantic search
- reranking
- context selection
- RAG evaluation

---

## Day 31: RAG Evaluation

Status: Planned.

Goals:

- Evaluate retrieved context quality
- Check whether the right rules/notes/events were retrieved
- Check whether irrelevant context was excluded
- Add golden examples for retrieval
- Use human verification data later as feedback signal

Learning focus:

- retrieval evaluation
- precision/recall for context
- reranking quality
- prompt/context regression tests

---

## Phase 6: Supabase, Docker, Deployment, Security, and Observability

## Day 32: Supabase Migration Practice

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

## Day 33: Docker and Local DevOps

Status: Planned.

Goals:

- Containerise the API
- Containerise PostgreSQL
- Add `Dockerfile`
- Add `docker-compose.yml`
- Run the full app locally with Docker
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

## Day 34: API Deployment

Status: Planned.

Goals:

- Deploy the Fastify backend API
- Use Render as likely backend hosting option
- Use Supabase Postgres as likely hosted database
- Add environment variables on the hosting platform
- Run migrations safely
- Test deployed endpoints

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

## Day 35: Security and Access Control Planning

Status: Planned.

Goals:

- Plan authentication and authorization
- Protect private friendship data
- Improve secret management
- Add rate limiting
- Add prompt-injection awareness
- Add safe LLM usage patterns
- Add security checks in CI

Learning focus:

- secure API development
- auth basics
- least privilege
- rate limiting
- secure LLM application design

---

## Day 36: Logging, Monitoring, and Observability

Status: Planned.

Goals:

- Add request/error logging
- Add structured logging
- Monitor API latency
- Track endpoint usage metrics
- Add health checks
- Add dashboards and alerts later
- Connect errors to tools such as Sentry later

Possible tools:

```txt
Sentry
Grafana
OpenTelemetry
structured logger
```

Learning focus:

- debugging production systems
- logs
- metrics
- traces
- error monitoring
- performance diagnosis

---

## Phase 7: Multi-User System, Privacy, and Frontend

## Day 37: Multi-User Accounts and Person/Relationship Model

Status: Planned.

Goals:

- Add account/login concept
- Link user accounts to `Person` records
- Refactor from `Friend` toward `Person`
- Add `Relationship` model between two people
- Allow events between two people rather than implicitly between the user and one friend
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

Learning focus:

- authentication design
- identity modeling
- relationship-centered data modeling
- notification workflows
- authorization boundaries

---

## Day 38: Multi-Perspective Events and Claim Verification

Status: Planned.

Goals:

- Allow both users in a relationship to optionally provide their own version of the same event
- Allow users to verify, deny, or leave unverified claims made about them
- Treat verified claims as stronger evidence
- Treat denied claims as disputed evidence
- Treat unverified claims cautiously as one person's perspective
- Add safety requirements for voluntary claim verification

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

## Day 39: German/EU Privacy Compliance Planning

Status: Planned.

Goals:

- Plan GDPR / DSGVO compliance before real-user usage
- Consider German BDSG requirements where relevant
- Define lawful basis / consent model
- Apply data minimization
- Apply purpose limitation
- Draft privacy notice requirements
- Design data access, deletion, export, and correction flows
- Define retention and deletion policies
- Secure processing of sensitive relationship/event/claim data
- Add audit logs and visibility controls

Critical design note:

This should be treated as a legal/privacy design task, not just a technical checkbox. Before real users use the app, it should get proper legal review.

Learning focus:

- privacy-by-design
- user rights
- data governance
- consent-aware product design
- sensitive data handling

---

## Day 40: Responsive GUI / Frontend

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

# Future Backlog Beyond Day 40

## Prisma Enums for Rule Fields

Goal:

Move `Rule.impactDirection` and `Rule.weight` from plain `String` fields to Prisma enums.

Reason:

Zod currently validates allowed values at the API boundary, but the database still stores plain strings. Prisma enums would make the data model stricter and reduce invalid internal states.

Possible enums:

```prisma
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

---

## Production CD Pipeline

Goal:

Add Continuous Deployment only after deployment is stable and tests/build checks are reliable.

Possible flow:

```txt
push to main
→ GitHub Actions CI passes
→ deploy API automatically
→ run smoke test
```

Keep this separate from CI until the deployment process is well understood.
