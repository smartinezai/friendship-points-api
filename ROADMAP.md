# Friendship Points API Roadmap

This roadmap tracks the 45-day Friendship Points API learning project.

## Current position

Completed:

```txt
Day 15: Error Handling and Response Consistency
Day 16: Safe Internal Logging
Day 17: Local Test Automation with Husky
Day 18: ESLint Setup
Day 19: GitHub Actions CI
Day 20: Friend Soft Delete
```

Next:

```txt
Day 21: Data Model Hardening
```

---

# Detailed 45-Day Roadmap

## Phase 1: Core TypeScript API and PostgreSQL Foundations

- Day 1: TypeScript + Fastify Setup — Done
- Day 2: PostgreSQL + Prisma Setup — Done
- Day 3: Friends API — Done
- Day 4: Friendship Rules — Done
- Day 5: Friendship Events — Done
- Day 6: Manual Scoring and Balance — Done
- Day 7: Refactor, Validation, and Duplicate Handling — Done

## Phase 2: LangChain and LLM-Assisted Scoring

- Day 8: LLM Assessment Design — Done
- Day 8.5: Mock LLM and Structured Assessment Storage — Done
- Day 9: Real LLM Providers and Provider Refactor — Done
- Day 10: Prompt Extraction, Provider Cleanup, and Metadata — Done
- Day 11: Route and Request Validation — Done
- Day 12: Friend Management Endpoints — Mostly done
- Day 13: Prediction Endpoint — Done
- Day 14: Testing Foundation — Done

## Phase 3: Backend Quality, Testing, and Automation

### Day 15: Error Handling and Response Consistency

Status: Done.

Implemented:

- `sendValidationError`
- `sendBadRequestError`
- `sendNotFoundError`
- `sendInternalServerError`

### Day 16: Safe Internal Logging

Status: Done.

Implemented:

- `logError(context, error)`
- internal stack logging
- generic client-facing 500 responses

### Day 17: Local Test Automation with Husky

Status: Done.

Current pre-push hook:

```bash
echo "Running pre-push hook..."
npm run lint
npm test
npm run build
```

### Day 18: ESLint Setup

Status: Done.

Implemented:

- Installed ESLint
- Added `eslint.config.js`
- Added `npm run lint`
- Added TypeScript ESLint recommended rules
- Ignored generated Prisma client files
- Fixed initial lint issues

### Day 19: GitHub Actions CI

Status: Done.

Implemented:

- Runs on push
- Runs on pull_request
- Runs `npm ci`
- Generates Prisma client
- Runs `npm run lint`
- Runs `npm test`
- Runs `npm run build`
- Fixed CI-specific Prisma `DATABASE_URL` issue

### Day 20: Friend Soft Delete

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

### Day 21: Data Model Hardening

Status: Planned.

Goals:

1. Convert `Rule.weight` to a Prisma enum
2. Convert `Rule.impactDirection` to a Prisma enum
3. Update Prisma-generated types
4. Update Zod schemas
5. Update route validation
6. Add optional `pronouns` field to `Friend`
7. Consider whether pronouns later belong on a generalised `Person` model

### Day 22: Friend Management Route Tests

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

### Day 23: Documentation and Portfolio Polish

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

## Phase 4: Search, RAG, and Agentic Retrieval

- Day 24: Keyword Search over Rules, Notes, and Events
- Day 25: Basic RAG Pipeline
- Day 26: RAG Helper and Data Loading
- Day 27: Persistent Search Ingestion
- Day 28: Function Calling for Search Tools
- Day 29: Agentic RAG Loop
- Day 30: Agentic RAG Tests and Evaluation

## Phase 5: Human Feedback, Evaluation, and Tracing

- Day 31: Human Verification Design for Model Outputs
- Day 32: Human Verification Data Model
- Day 33: LLM Evaluation and Golden Examples
- Day 34: LLM Tracing and Prompt Analytics

## Phase 6: Retrieval Expansion and Semantic Search

- Day 35: Relationship-Specific Notes Design
- Day 36: Document Ingestion and Preprocessing
- Day 37: Embeddings and Vector Storage
- Day 38: Semantic Retrieval and Reranking
- Day 39: RAG Evaluation

## Phase 7: Infrastructure, Deployment, Security, and Privacy

- Day 40: Supabase Migration
- Day 41: Docker and Local DevOps
- Day 42: Deployment and Environment Management
- Day 43: Security and Access Control
- Day 44: Logging, Monitoring, Observability, and GDPR Planning

## Phase 8: Frontend

### Day 45: Responsive GUI / Frontend

Status: Final planned task.

This must remain the final roadmap task because frontend development is not the main focus of this project.
