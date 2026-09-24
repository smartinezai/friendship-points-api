# Friendship Points API

Friendship Points API is a TypeScript/Fastify backend for modelling relationship events, contextual rules, notes, predictions and score-based assessments over time.

The system maintains a running point balance per friendship. Events can increase or decrease that balance through manual or LLM-assisted assessments. An assessment records a score delta, reasoning summary, impact direction, confidence, matched contextual rules and bias notes. The balance endpoint derives the current score by summing the deltas across a friend's event history.

Predictions provide a separate hypothetical workflow. They evaluate a proposed future action against the relevant friend context without creating a persisted event or assessment. This keeps speculative analysis separate from recorded history.

The project uses structured LLM outputs, explicit validation boundaries, versioned prompts, provider metadata, shared error handling, test automation, CI and an evolving retrieval/RAG architecture. The current roadmap is split into multiple phases and prioritises a complete RAG pipeline before broader production hardening, deployment, security and frontend work.

The project is meant to be social commentary on the social credit score imposed by the CCP.

## What the API supports

- create, update, search and soft-delete friends
- define friendship rules and preferences
- record friendship-related events
- manually assess events with point changes
- generate mock and real LLM assessments
- generate mock and Mistral predictions for hypothetical actions
- track friendship point balances from stored assessments
- append notes without overwriting existing context
- build searchable relationship context from notes, rules and events
- retrieve keyword-ranked context from ingested searchable documents
- validate request payloads with Zod
- OpenAPI 3.1 contract for public route requests and responses
- run linting, tests, builds, pre-push checks and GitHub Actions CI

Example:

```txt
Rule:
Cole dislikes unexpected phone calls.

Event:
I called Cole without warning.

Assessment:
This may negatively affect the friendship because it violates a known preference.

Score delta:
-3
```

## Current status

Implemented:

- Fastify API server
- PostgreSQL persistence through Prisma
- `Friend`, `Rule`, `Event`, `Assessment` and `SearchableDocument` models
- friend, rule, event, assessment, prediction, search and ingestion endpoints
- manual assessment and friendship balance calculation
- mock LLM assessment flow
- Mistral assessment and prediction flows through LangChain
- OpenAI/LangChain assessment route, currently blocked by API quota
- structured LLM output validation
- prompt version and model metadata tracking
- friend soft delete with `deletedAt`
- keyword search over notes, active rules and events
- searchable document ingestion for friend context
- reusable retrieval/RAG service flow for assessments and predictions
- Zod request validation
- shared HTTP error helpers
- internal logging helper
- Vitest tests
- ESLint
- Husky pre-push checks
- GitHub Actions CI
- isolated PostgreSQL/pgvector integration tests for API routes and retrieval
- UUID validation for route parameters

Current focus:

```txt
Day 39: Data Model and Type Architecture Hardening (In Progress)
Day 40: API Contract and OpenAPI Documentation (Done)
```

Near-term roadmap:

```txt
Data Model and Type Architecture Hardening
API Contract and OpenAPI Documentation
TypeScript Refactor and Code Review
```

## Documentation

- [API reference](./docs/api.md)
- [OpenAPI contract](./docs/openapi.json)
- [Architecture](./docs/architecture.md)
- [Development guide](./docs/development.md)
- [Roadmap](./ROADMAP.md)

## Tech stack

Current:

- Node.js
- TypeScript
- Fastify
- PostgreSQL
- Prisma
- Zod
- LangChain.js
- Mistral via LangChain
- OpenAI via LangChain, route exists but API quota is currently unavailable
- Vitest
- ESLint
- Husky
- GitHub Actions CI

Planned/future:

- Supabase migration and runtime configuration validation
- background jobs for ingestion and embeddings
- Docker
- deployment
- production authentication and API security
- observability
- privacy and data-retention planning
- responsive frontend as the final roadmap task
