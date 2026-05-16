# Friendship Points API

A TypeScript backend API for tracking friendship-related events, rules, and point changes.

The long-term goal of this project is to build an API where I can add events that happened in a friendship, define subjective rules about what positively or negatively affects that friendship, and use an LLM through LangChain to help estimate a friendship point gain or loss.

This project is primarily a learning project for practicing:

- TypeScript
- Fastify
- PostgreSQL
- API design
- backend project structure
- LangChain integration
- LLM-assisted structured outputs

## Current Status

Day 1 is complete.

The project currently contains a basic Fastify server with a health check endpoint.

## Tech Stack

Current:

- Node.js
- TypeScript
- Fastify
- dotenv
- tsx

Planned:

- PostgreSQL
- Prisma or Drizzle
- Zod
- LangChain.js
- LLM provider integration
- Vitest

## Project Goal

The final API should allow me to:

- Create a friend profile
- Define friendship rules
- Add friendship-related events
- Ask an LLM to assess the event
- Store the score change in PostgreSQL
- Query the current friendship point balance
- Predict the possible impact of hypothetical actions

Example rule:

```txt
Cole dislikes unexpected phone calls.
