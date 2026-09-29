# Day 39 Completion Plan

## Human review summary

The goal is to close Day 39 safely before starting the Day 41 refactor. Most of
the data model and type work already exists. The remaining work is to prove that
the enum migration behaves safely with existing rows, confirm the intended
handling of unsupported old values, update stale architecture documentation and
mark Day 39 complete only after all checks pass.

Decisions applied:

- Keep UUIDs as the only identifiers and defer slugs until there is a product
  need and a clear uniqueness rule.
- Keep database rows, public response shapes and model inputs as separate
  types.
- Use clear result states for expected missing and successful service results.
  Provider failures still raise errors after response checks.
- Keep pronouns optional. Do not expose them through a new endpoint as part of
  this day.

Important risks:

- The enum migration casts existing text values. An unsupported old value will
  stop the migration. The migration file is already on `main` so this work
  keeps its contents unchanged and tests its failure behavior.
- Changing both rule column types takes a table lock and may rewrite its rows.
  The existing migration changes them separately. A future large-table schema
  change should account for its locks and rewrite time before deployment.
- Before this work, integration tests applied all migrations to an empty
  database and did not prove an upgrade with existing rows.

Decisions used:

1. Stop on unsupported stored values and require an explicit data correction.
2. Keep pronouns optional and storage-only until a person profile API is
   designed.
3. Keep UUIDs as identifiers and defer slugs until there is a product need and
   a uniqueness decision.
4. No persistent database was connected to this environment. The repository
   has no production deployment workflow and the migration test used a
   disposable database.

## Current evidence

- Local `main` and fetched `origin/main` both point to `ed33931`.
- The working tree was clean before this plan was added.
- Rule enums, optional person pronouns, shared domain values, public response
  mappings and clear service result states are already present.
- No `.env`, `DATABASE_URL` or `TEST_DATABASE_URL` was available before
  verification. No persistent database was queried.
- The repository has a CI workflow with a disposable PostgreSQL service and no
  production deployment workflow.

## Learning objective

The central learning objective is safe database change design. The important
reasoning is not how to write another enum. It is how to prove that a schema
change works with old data, fails predictably when assumptions are broken and
can be recovered without losing data.

The central work is to prove that existing data survives a schema change and
that unsupported values fail without changing the legacy schema.

## Scope

Included:

- Verify the existing rule enum migration with populated legacy rows.
- Verify that existing people gain a nullable pronouns column without data
  loss.
- Confirm the separation between database rows, public responses and model
  inputs.
- Update architecture and roadmap documentation to match the verified code.
- Run the same checks as CI from a clean dependency install.

Excluded:

- Adding slugs.
- Adding a person profile endpoint.
- General TypeScript cleanup from Day 41.
- Supabase migration work from Day 42.
- Authentication work from Day 47.

The current TypeScript and PostgreSQL stack is the best fit for this work
because it changes an existing API and its existing migration history. No new
language or runtime is needed.

## Proposed work

### 1. Confirm the migration policy

- Inspect the distinct stored values for `Rule.impactDirection` and
  `Rule.weight` in every persistent environment before deployment.
- Decide whether unsupported values should block deployment or be converted.
- Confirm whether either Day 39 migration has already been applied outside a
  disposable database.
- Record the approved recovery steps before changing migration history.

### 2. Add meaningful database upgrade coverage

Add a PostgreSQL-backed check that starts from the schema immediately before
Day 39 and contains existing data.

The check should prove that:

- Every supported legacy text value survives the enum conversion unchanged.
- Existing people survive the pronouns migration and receive a null value.
- An unsupported rule value follows the approved failure policy.
- A failure does not leave an undocumented partial schema state.

This is the valuable regression coverage for Day 39. Do not add tests that only
repeat simple mappings or constants already protected by type checking and the
existing schema tests.

### 3. Review the three data boundaries

- Database records stay in database access and mapping code.
- API responses use the shared response schemas and omit ownership or parent
  record fields.
- Model inputs and checked model results do not expose database details.

Check that each expected service result can be handled by its status value.
Keep unexpected provider or database failures as errors rather than expected
results.

### 4. Bring documentation up to date

- Update `docs/architecture.md` so pronouns and the rule enums are current
  design rather than planned work.
- Change the Day 39 status to done in `ROADMAP.md` after verification.
- Update the current focus in `README.md` so Day 41 becomes next.
- Keep the slug deferral and pronoun API decision visible.
- Record the migration check and recovery expectations in the development
  guide if they are not already clear.

### 5. Verify the completed day

Run these checks from a clean dependency install:

```bash
npm ci
npx prisma generate
npm run openapi:generate
npm run lint
npm test -- --run
npm run test:integration
npm run build
git diff --check
```

Also verify that OpenAPI generation leaves `docs/openapi.json` unchanged unless
an intentional public contract change was approved.

Use a disposable PostgreSQL and pgvector database whose name ends in `_test`
for integration checks. The CI workflow repeats dependency install, Prisma
client generation, unit checks, database integration checks and build.

### 6. Deployment and recovery review

- Treat this as medium risk because it changes stored column types.
- Ask for review from someone comfortable with PostgreSQL migrations.
- Measure the rule table before deployment. A larger table may need a planned
  maintenance window because type changes can hold a table lock.
- Take or confirm a recoverable database backup before the production change.
- Do not reset a persistent database after a failed migration.
- Keep any manual repair and Prisma migration resolution steps in a reviewed
  runbook.
- Do not log pronouns or expose them through a public response as part of this
  work.

The repository has no pull request template today. Record the medium risk
classification, database checks, recovery plan and requested database reviewer
in the pull request description instead.

## Completion criteria

Day 39 is complete when:

- Populated-database upgrade coverage passes for valid existing values.
- Unsupported values fail and the database rolls back the failed SQL script.
- Database records, API responses and model inputs remain separate.
- Architecture, development, README and roadmap text match the code.
- Lint, unit tests, integration tests, build and generated OpenAPI checks pass.
- The same checks as CI pass from a clean dependency install.

Publish only after all checks pass and an authorized push request is received.

## Implementation and verification

- Left the already published rule enum migration unchanged.
- Added a PostgreSQL check for all 24 supported rule value combinations,
  existing people and the failed conversion of unsupported values.
- Updated the architecture, development guide, README and roadmap.
- `npm ci`, Prisma generation, lint, 148 unit tests, integration tests, build,
  OpenAPI generation and `git diff --check` passed locally.
- OpenAPI generation left `docs/openapi.json` unchanged.
- The integration run used PostgreSQL 17 in a disposable container. The
  container was stopped after verification.
- Remote CI will run after the authorized push.
