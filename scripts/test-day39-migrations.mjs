import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Client } from "pg";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
    throw new Error("Set TEST_DATABASE_URL to a disposable PostgreSQL database ending in '_test'.");
}

const databaseUrl = new URL(testDatabaseUrl);
const databaseName = decodeURIComponent(databaseUrl.pathname.slice(1));

if (
    !["postgres:", "postgresql:"].includes(databaseUrl.protocol) ||
    !databaseName.toLowerCase().endsWith("_test")
) {
    throw new Error("TEST_DATABASE_URL must use PostgreSQL and point to a database ending in '_test'.");
}

const impactDirections = ["positive", "negative", "neutral", "mixed"];
const ruleWeights = ["minimal", "low", "medium", "high", "critical", "extreme"];
const migrationDirectory = resolve("prisma/migrations");
const ruleEnumsMigration = await readFile(
    resolve(migrationDirectory, "20260923100000_add_rule_enums/migration.sql"),
    "utf8",
);
const personPronounsMigration = await readFile(
    resolve(migrationDirectory, "20260923100500_add_person_pronouns/migration.sql"),
    "utf8",
);
const client = new Client({ connectionString: testDatabaseUrl });
const schemas = [];

function newSchemaName() {
    const schemaName = `day39_migration_${randomUUID().replaceAll("-", "")}`;
    schemas.push(schemaName);
    return schemaName;
}

async function useLegacySchema(schemaName) {
    await client.query(`CREATE SCHEMA "${schemaName}"`);
    await client.query(`SET search_path TO "${schemaName}"`);
    await client.query(`
        CREATE TABLE "Rule" (
            "id" TEXT PRIMARY KEY,
            "impactDirection" TEXT NOT NULL,
            "weight" TEXT NOT NULL
        );
        CREATE TABLE "Person" (
            "id" TEXT PRIMARY KEY,
            "displayName" TEXT NOT NULL
        );
    `);
}

async function expectRejectedWithoutSchemaChanges(schemaName, invalidColumn, invalidValue) {
    await useLegacySchema(schemaName);
    const impactDirection = invalidColumn === "impactDirection" ? invalidValue : "positive";
    const weight = invalidColumn === "weight" ? invalidValue : "minimal";
    await client.query(
        'INSERT INTO "Rule" ("id", "impactDirection", "weight") VALUES ($1, $2, $3)',
        [`invalid-${invalidColumn}`, impactDirection, weight],
    );

    await assert.rejects(
        client.query(ruleEnumsMigration),
        (error) => error.code === "22P02" && error.message.includes(invalidValue),
    );

    const columnTypes = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = 'Rule'
        ORDER BY column_name
    `, [schemaName]);
    assert.deepEqual(
        columnTypes.rows.map(({ column_name, data_type }) => [column_name, data_type]),
        [["id", "text"], ["impactDirection", "text"], ["weight", "text"]],
    );

    const enumTypes = await client.query(
        "SELECT typname FROM pg_type WHERE typnamespace = $1::regnamespace AND typtype = 'e'",
        [schemaName],
    );
    assert.deepEqual(enumTypes.rows, []);

    const persistedRule = await client.query(
        'SELECT "impactDirection", "weight" FROM "Rule" WHERE "id" = $1',
        [`invalid-${invalidColumn}`],
    );
    assert.deepEqual(persistedRule.rows, [{ impactDirection, weight }]);
}

await client.connect();

try {
    const validSchema = newSchemaName();
    await useLegacySchema(validSchema);

    const legacyRules = [];
    for (const impactDirection of impactDirections) {
        for (const weight of ruleWeights) {
            const id = `rule-${impactDirection}-${weight}`;
            legacyRules.push({ id, impactDirection, weight });
            await client.query(
                'INSERT INTO "Rule" ("id", "impactDirection", "weight") VALUES ($1, $2, $3)',
                [id, impactDirection, weight],
            );
        }
    }
    await client.query(
        'INSERT INTO "Person" ("id", "displayName") VALUES ($1, $2)',
        ["existing-person", "Existing person"],
    );

    await client.query(ruleEnumsMigration);
    await client.query(personPronounsMigration);

    const migratedRules = await client.query(
        'SELECT "id", "impactDirection"::text, "weight"::text FROM "Rule" ORDER BY "id"',
    );
    assert.deepEqual(
        migratedRules.rows.map(({ id, impactDirection, weight }) => ({ id, impactDirection, weight })),
        legacyRules.sort((left, right) => left.id.localeCompare(right.id)),
    );

    const migratedPerson = await client.query(
        'SELECT "displayName", "pronouns" FROM "Person" WHERE "id" = $1',
        ["existing-person"],
    );
    assert.deepEqual(migratedPerson.rows, [{ displayName: "Existing person", pronouns: null }]);

    await expectRejectedWithoutSchemaChanges(newSchemaName(), "impactDirection", "unexpected");
    await expectRejectedWithoutSchemaChanges(newSchemaName(), "weight", "very_high");

    process.stdout.write("Day 39 migrations preserve existing rows and reject unsupported enum values.\n");
} finally {
    for (const schemaName of schemas) {
        await client.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
    }
    await client.end();
}
