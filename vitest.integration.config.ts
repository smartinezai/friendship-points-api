import { defineConfig } from "vitest/config";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
    throw new Error(
        "TEST_DATABASE_URL is required to run database integration tests.",
    );
}

const databaseUrl = new URL(testDatabaseUrl);
const databaseName = decodeURIComponent(databaseUrl.pathname.slice(1));

if (
    !["postgres:", "postgresql:"].includes(databaseUrl.protocol) ||
    !databaseName.toLowerCase().endsWith("_test")
) {
    throw new Error(
        "TEST_DATABASE_URL must use PostgreSQL and point to a database ending in '_test'.",
    );
}

process.env.DATABASE_URL = testDatabaseUrl;

export default defineConfig({
    test: {
        include: ["src/tests/integration/**/*.integration.test.ts"],
        fileParallelism: false,
        testTimeout: 15_000,
        hookTimeout: 15_000,
    },
});
