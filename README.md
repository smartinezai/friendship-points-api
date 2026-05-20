# Friendship Points API

A TypeScript backend API for tracking friendship-related events, rules, and point changes.

The long-term goal of this project is to build an API where I can add friendship-related events, define subjective rules about what positively or negatively affects a friendship, and eventually use an LLM through LangChain to help estimate a friendship point gain or loss.

This project is primarily a learning project for practicing:

- TypeScript
- Fastify
- PostgreSQL
- Prisma
- API design
- backend project structure
- relational data modeling
- LangChain integration
- LLM-assisted structured outputs

## Current Status

Day 5 is in progress.

The project currently contains:

- A Fastify server
- A health check endpoint
- PostgreSQL connection through Prisma
- A `Friend` database model
- A `Rule` database model
- An `Event` database model
- Friend API endpoints
- Rule API endpoints
- Event API endpoints

## Tech Stack

Current:

- Node.js
- TypeScript
- Fastify
- PostgreSQL
- Prisma
- dotenv
- tsx

Planned:

- Zod
- LangChain.js
- LLM provider integration
- Vitest
- Docker

## Project Goal

The final API should allow me to:

- Create friend profiles
- Define friendship rules for a specific friend
- Add friendship-related events
- Store subjective friendship events in PostgreSQL
- Add point assessments later
- Query the current friendship point balance later
- Ask an LLM to assess events later
- Predict the possible impact of hypothetical actions later

Example rule:

```txt
Cole dislikes unexpected phone calls.
```

Example event:

```txt
I called Cole without prior warning.
```

Example future LLM-assisted assessment:

```json
{
  "score_delta": -6,
  "confidence": 0.82,
  "reasoning_summary": "This likely violates the rule about unexpected phone calls."
}
```

## Current API Endpoints

### Health Check

```http
GET /health
```

Response:

```json
{
  "status": "ok"
}
```

This endpoint checks that the API server is running and reachable.

---

## Friends

### Get All Friends

```http
GET /friends
```

### Get Friend By ID

```http
GET /friends/:id
```

### Search Friends By Name

```http
GET /friends/search?name=Cole
```

### Create Friend

```http
POST /friends
```

Request body:

```json
{
  "displayName": "Test Friend",
  "notes": "Created through API"
}
```

---

## Rules

### Get Rules For Friend

```http
GET /friends/:friendId/rules
```

### Create Rule For Friend

```http
POST /friends/:friendId/rules
```

Request body:

```json
{
  "title": "Unexpected calls are bad",
  "description": "Cole dislikes being called without prior warning.",
  "impactDirection": "negative",
  "weight": "high"
}
```

### Update Rule Weight

```http
PATCH /rules/:ruleId/weight
```

Request body:

```json
{
  "weight": "medium"
}
```

Allowed weights currently include:

```txt
minimal
low
medium
high
critical
```

---

## Events

### Get Events For Friend

```http
GET /friends/:friendId/events
```

### Create Event For Friend

```http
POST /friends/:friendId/events
```

Request body:

```json
{
  "eventText": "I called Cole without prior warning.",
  "happenedAt": "2026-05-19T15:00:00.000Z"
}
```

`happenedAt` is optional.

### Get Event By ID

```http
GET /events/:eventId
```

## Database Models

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
}
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

### Event

```prisma
model Event {
  id         String    @id @default(uuid())
  friendId   String
  friend     Friend    @relation(fields: [friendId], references: [id])
  eventText  String
  happenedAt DateTime?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
}
```

## Project Structure

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
  services/
  schemas/
  types/
  utils/
```

### `src/app.ts`

Creates and configures the Fastify app.

Currently it defines the `/health` route and registers route files.

### `src/server.ts`

Starts the Fastify server and listens on the configured port.

### `src/db/prisma.ts`

Creates and exports the Prisma client used to query PostgreSQL.

### `src/routes/`

Contains API route definitions.

Current route files:

```txt
friends.routes.ts
rules.routes.ts
events.routes.ts
```

### `src/services/`

Planned location for business logic.

### `src/schemas/`

Planned location for validation schemas.

### `src/types/`

Planned location for custom TypeScript types.

### `src/utils/`

Planned location for helper functions.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Create environment file

Create a `.env` file:

```txt
PORT=3000
DATABASE_URL="postgresql://YOUR_USERNAME@localhost:5432/friendship_points_api"
```

Use `.env.example` as a reference.

### 3. Start PostgreSQL

Example using Homebrew on macOS:

```bash
brew services start postgresql@16
```

### 4. Create the database

```bash
createdb friendship_points_api
```

### 5. Run Prisma migrations

```bash
npx prisma migrate dev
```

### 6. Generate Prisma client

```bash
npx prisma generate
```

### 7. Run the development server

```bash
npm run dev
```

The server should start on:

```txt
http://localhost:3000
```

### 8. Test the health endpoint

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok"
}
```

### 9. Open Prisma Studio

```bash
npx prisma studio
```

This opens an interactive browser view of the database.

## Available Scripts

```bash
npm run dev
```

Runs the server in development mode with automatic reload using `tsx watch`.

```bash
npm run build
```

Compiles the TypeScript code.

```bash
npm start
```

Runs the compiled JavaScript code from the `dist` folder.

## Environment Variables

Create a `.env` file in the project root.

```txt
PORT=3000
DATABASE_URL="postgresql://YOUR_USERNAME@localhost:5432/friendship_points_api"
```

Planned future variables:

```txt
OPENAI_API_KEY=
```

## Roadmap

### Day 1

- Set up TypeScript project
- Add Fastify
- Add `/health` endpoint
- Add environment variable support

### Day 2

- Set up PostgreSQL
- Add Prisma
- Create `Friend` model
- Run first migration
- Connect TypeScript app to database

### Day 3

- Add friends API endpoints
- Add `GET /friends`
- Add `GET /friends/:id`
- Add `GET /friends/search?name=...`
- Add `POST /friends`

### Day 4

- Add friendship rules
- Create `Rule` database model
- Add `GET /friends/:friendId/rules`
- Add `POST /friends/:friendId/rules`
- Add `PATCH /rules/:ruleId/weight`

### Day 5

- Add friendship events
- Create `Event` database model
- Add `GET /friends/:friendId/events`
- Add `POST /friends/:friendId/events`
- Add `GET /events/:eventId`

### Day 6

- Add manual scoring
- Add friendship point balance calculation

### Day 7

- Refactor routes and services
- Improve error responses
- Add validation schemas
- Add duplicate friend-name handling for `POST /friends`
- Move repeated friend lookup logic into a reusable service/helper

Duplicate friend-name behavior:

If a new friend is created with a `displayName` that exactly matches an existing friend, the API should return a `409 Conflict` response with the existing friend's information.

The duplicate should only be created if the user explicitly confirms it, for example by sending:

```json
{
  "displayName": "Cole William Bailey",
  "notes": "Another person with the same name",
  "allowDuplicate": true
}
```

### Week 2

- Add mock LLM service
- Add LangChain.js
- Add structured LLM output
- Add event assessment endpoint
- Add prediction endpoint
- Add tests
- Improve documentation

### Future Ideas

- Add Docker support to containerise the API and PostgreSQL database
- Add a `Dockerfile`
- Add `docker-compose.yml`
- Model the user as a person entry too, so events can happen between any two people instead of always being implicitly between the user and one friend
- Consider renaming `Friend` to `Person` later if the data model becomes more general
- Add a convenience endpoint to retrieve rules by friend name

## Notes

This is a private learning project.

The scoring system is subjective and should not be treated as an objective measurement of a real relationship.

The LLM will be used as an assistant for generating structured suggestions, but the backend will remain responsible for validation, storage, and final business logic.
