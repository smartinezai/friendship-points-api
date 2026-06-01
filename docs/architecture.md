# Architecture

## High-level overview

The project is a Fastify API written in TypeScript. PostgreSQL stores the domain data, Prisma handles database access, Zod validates incoming requests, and LangChain-backed services generate structured LLM assessments and predictions.

```txt
HTTP request
→ Fastify route
→ Zod validation
→ service/database logic
→ optional LLM provider call
→ Prisma write/read
→ structured JSON response
```

## Current project structure

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
    assessments.routes.ts
    predictions.routes.ts
  services/
    friends.service.ts
    assessments.service.ts
    predictions.service.ts
  schemas/
    assessments.schema.ts
    friends.schema.ts
    rules.schema.ts
    events.schema.ts
    predictions.schema.ts
  ai/
    providers.ts
    assessment.types.ts
    assessment.schema.ts
    mockAssessment.service.ts
    langchainAssessment.service.ts
    mistralAssessment.service.ts
    openAiAssessment.service.ts
    prompts/
      friendshipAssessment.prompt.ts
  tests/
  utils/
    httpErrors.ts
    logging.ts
```

## Main models

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
  deletedAt   DateTime?
}
```

`deletedAt` is used for soft delete. A soft-deleted friend is hidden from normal user-facing friend queries.

Planned future field:

```prisma
pronouns String?
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

Planned hardening:

- convert `impactDirection` to a Prisma enum
- convert `weight` to a Prisma enum

### Event

```prisma
model Event {
  id          String       @id @default(uuid())
  friendId    String
  friend      Friend       @relation(fields: [friendId], references: [id])
  eventText   String
  happenedAt  DateTime?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  assessments Assessment[]
}
```

### Assessment

```prisma
model Assessment {
  id              String   @id @default(uuid())
  eventId         String
  event           Event    @relation(fields: [eventId], references: [id])
  scoreDelta      Float
  reason          String?
  source          String
  impactDirection String?
  biasNotes       String?
  confidence      Float?
  matchedRuleIds  String[] @default([])
  modelName       String?
  promptVersion   String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

## LLM assessment flow

```txt
eventId
→ fetch event with friend and active rules
→ build LLM assessment input
→ call selected provider
→ validate structured output
→ save assessment
→ return assessment + LLM result
```

Providers currently include:

- mock provider
- Mistral provider
- OpenAI provider, route exists but API quota is unavailable

## Prediction flow

```txt
friendId + hypotheticalAction
→ fetch friend with active rules
→ build hypothetical event input
→ call mock or Mistral provider
→ return prediction with saved: false
```

Predictions do not create `Event` or `Assessment` records.

## Error handling

Routes use shared helpers:

```txt
sendValidationError
sendBadRequestError
sendNotFoundError
sendInternalServerError
```

Internal errors are logged through:

```txt
logError(context, error)
```

Client-facing 500 responses stay generic.

## Soft-delete design

Soft delete uses:

```prisma
deletedAt DateTime?
```

Normal active-friend lookups include:

```txt
deletedAt: null
```

This is not the same as GDPR erasure. It hides records from normal app use while retaining data for history/audit. Real erasure/deletion policy is a later privacy/compliance design task.
