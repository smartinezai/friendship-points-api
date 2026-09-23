import { spawnSync } from "node:child_process";
import { URL } from "node:url";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
    throw new Error(
        "Set TEST_DATABASE_URL to a disposable PostgreSQL database ending in '_test'.",
    );
}

let databaseUrl;
let databaseName;

try {
    databaseUrl = new URL(testDatabaseUrl);
    databaseName = decodeURIComponent(databaseUrl.pathname.slice(1));
} catch {
    throw new Error("TEST_DATABASE_URL must be a valid PostgreSQL URL.");
}

if (!["postgres:", "postgresql:"].includes(databaseUrl.protocol)) {
    throw new Error("TEST_DATABASE_URL must use the PostgreSQL protocol.");
}

if (!databaseName.toLowerCase().endsWith("_test")) {
    throw new Error(
        "TEST_DATABASE_URL must point to a database whose name ends in '_test'.",
    );
}

const environment = {
    ...process.env,
    DATABASE_URL: testDatabaseUrl,
};

const commands = [
    ["node_modules/prisma/build/index.js", ["migrate", "deploy"]],
    ["node_modules/vitest/vitest.mjs", ["--config", "vitest.integration.config.ts", "--run"]],
];

for (const [script, args] of commands) {
    const result = spawnSync(process.execPath, [script, ...args], {
        cwd: process.cwd(),
        env: environment,
        stdio: "inherit",
    });

    if (result.error) {
        throw result.error;
    }

    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}
