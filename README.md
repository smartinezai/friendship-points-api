# Friendship Points API

Friendship Points API is a TypeScript/Fastify backend for modelling relationship events, contextual rules, notes, predictions and score-based assessments over time.

The system maintains a running point balance per friendship. Events can increase or decrease that balance through manual or LLM-asissted assessments. An assessment records a score delta, reasoning summary, impact direction, confidence, matched contextual rules and bias notes. The balance endpoint derives the current score by summing the deltas across a friend's event history.

Predictions provide a separate hypothetical workflow. They evaluate a proposed future action against the relevant friend context without creating a persisted event or assessment. This keeps speculative analysis separate from recorded history.

The project uses structured LLM outputs, explicit validation boundaries, versioned prompts, provider metadata, shared error handling, test automation, CI and an evolving retrieval/RAG architecture. The current roadmap is split into multiple phases.

The project is meant to be social commentary on the social credit score imposed by the CCP.

## What the API supports

- create, update, search and soft-delete friends
- define friendship rules and preferences
- record friendship-related events
- manually assess events with point changes
- generate mock and real LLM assessments
- generate mock and real Mistral/OpenAI predictions for hypothetical actions
- track friendship point balances from stored assessments
- append notes without overwriting existing context
- build searchable relationship context from notes, rules, and events
- expose keyword-based retrieval as an early RAG foundation
- validate request payloads with Zod
- run linting, tests, builds, pre-push checks, and GitHub Actions CI

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
- Friend, Rule, Event, Assessment, and SearchableDocument models
- friend, rule, event, assessment, prediction, search, and ingestion endpoints
- manual assessment and friendship balance calculation
- mock LLM assessment flow
- Mistral assessment and prediction flows through LangChain
- OpenAI/LangChain assessment route, currently blocked by API quota
- structured LLM output validation
- prompt version and model metadata tracking
- friend soft delete with deletedAt
- keyword search over notes, active rules, and events
- searchable document ingestion for friend context
- Zod request validation
- shared HTTP error helpers
- internal logging helper
- Vitest tests
- ESLint
- Husky pre-push checks
- GitHub Actions CI

Current focus:

```txt
Basic RAG pipeline
```

Near-term roadmap:

```txt
Retrieval Service Refactor
DEmbeddings and Vector Storage
Semantic Retrieval
Reranking
Function Calling Search Tool
Agentic Retrieval Loop
Retrieval Evaluation
Golden Examples and Regression Tests
Agentic RAG Evaluation

## Documentation

- [API reference](./docs/api.md)
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

- keyword search RAG
- agentic RAG
- vector database / pgvector / Supabase Vector
- reranking
- Supabase
- Docker
- deployment
- observability
- GDPR/DSGVO planning
- responsive frontend as the final roadmap task
