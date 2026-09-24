import { readFileSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import app from "../app.js";
import { buildOpenApiDocument } from "../openapi/openapiDocument.js";

type OpenApiOperation = {
    parameters?: Array<{
        name: string;
        in: string;
        required: boolean;
    }>;
};

type OpenApiDocument = {
    openapi: string;
    paths: Record<string, Record<string, OpenApiOperation>>;
    components: { schemas: Record<string, Record<string, unknown>> };
};

const generatedDocument = buildOpenApiDocument() as unknown as OpenApiDocument;
const checkedInDocument = JSON.parse(
    readFileSync(new URL("../../docs/openapi.json", import.meta.url), "utf8"),
) as OpenApiDocument;
const expectedRoutes = [
    ["GET", "/health"],
    ["GET", "/friends"],
    ["POST", "/friends"],
    ["GET", "/friends/search"],
    ["GET", "/friends/{id}"],
    ["PATCH", "/friends/{id}"],
    ["DELETE", "/friends/{id}"],
    ["POST", "/friends/{id}/notes/append"],
    ["GET", "/friends/{id}/search-context"],
    ["GET", "/friends/{id}/search-context/semantic"],
    ["GET", "/friends/{id}/search-context/reranked"],
    ["POST", "/friends/{id}/rebuild-search-index"],
    ["GET", "/friends/{friendId}/rules"],
    ["POST", "/friends/{friendId}/rules"],
    ["PATCH", "/rules/{ruleId}/weight"],
    ["GET", "/friends/{friendId}/events"],
    ["POST", "/friends/{friendId}/events"],
    ["GET", "/events/{eventId}"],
    ["POST", "/events/{eventId}/manual-assessment"],
    ["GET", "/friends/{friendId}/balance"],
    ["POST", "/events/{eventId}/mock-assessment"],
    ["POST", "/events/{eventId}/mistral-assessment"],
    ["POST", "/events/{eventId}/openai-assessment"],
    ["POST", "/friends/{friendId}/predict"],
    ["POST", "/friends/{friendId}/predict/mistral"],
    ["GET", "/friends/{friendId}/facts"],
    ["POST", "/friends/{friendId}/facts"],
    ["PATCH", "/person-facts/{factId}/verification-status"],
    ["POST", "/friends/{friendId}/intake-submissions"],
    ["POST", "/friends/{friendId}/documents/ingest"],
    ["POST", "/search-documents/embed-missing"],
] as const;

afterAll(async () => {
    await app.close();
});

/** Collects local schema references so the contract cannot point to missing components. */
function collectSchemaReferences(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value.flatMap(collectSchemaReferences);
    }
    if (value === null || typeof value !== "object") {
        return [];
    }

    return Object.entries(value).flatMap(([key, nestedValue]) => {
        if (key === "$ref" && typeof nestedValue === "string") {
            return [nestedValue];
        }
        return collectSchemaReferences(nestedValue);
    });
}

describe("OpenAPI document", () => {
    it("matches the generated contract", () => {
        expect(checkedInDocument).toEqual(generatedDocument);
    });

    it("documents every registered route operation", async () => {
        await app.ready();
        const operationCount = Object.values(generatedDocument.paths)
            .reduce((count, path) => count + Object.keys(path).length, 0);

        expect(generatedDocument.openapi).toBe("3.1.0");
        expect(Object.keys(generatedDocument.paths)).toHaveLength(25);
        expect(operationCount).toBe(expectedRoutes.length);

        for (const [method, path] of expectedRoutes) {
            const operation = generatedDocument.paths[path]?.[method.toLowerCase()];
            const fastifyPath = path.replace(/\{([^}]+)\}/g, ":$1");
            const identityHeader = operation?.parameters?.find(
                (parameter) => parameter.in === "header" && parameter.name === "x-user-id",
            );
            const isUnscopedRoute = path === "/health" || path === "/search-documents/embed-missing";

            expect(operation, `${method} ${path} should appear in OpenAPI`).toBeDefined();
            expect(app.hasRoute({ method, url: fastifyPath }), `${method} ${path} should be registered`).toBe(true);
            expect(identityHeader !== undefined).toBe(!isUnscopedRoute);
            if (identityHeader) {
                expect(identityHeader.required).toBe(false);
            }
        }
    });

    it("documents development identity selection without calling it authentication", () => {
        const friendListParameters = generatedDocument.paths["/friends"]?.get?.parameters;
        const healthParameters = generatedDocument.paths["/health"]?.get?.parameters;
        const embedParameters = generatedDocument.paths["/search-documents/embed-missing"]?.post?.parameters;

        expect(friendListParameters).toContainEqual(expect.objectContaining({
            name: "x-user-id",
            in: "header",
            required: false,
        }));
        expect(healthParameters).toBeUndefined();
        expect(embedParameters).toBeUndefined();
        expect(generatedDocument.components.schemas.CreateFriendBody).not.toHaveProperty("additionalProperties", false);
    });

    it("preserves input rules that JSON Schema generation cannot infer", () => {
        const updateSchema = generatedDocument.components.schemas.UpdateFriendBody;
        const documentSchema = generatedDocument.components.schemas.IngestDocumentBody;
        if (!updateSchema || !documentSchema) {
            throw new Error("Expected request schemas in the OpenAPI components.");
        }
        const updateAnyOf = updateSchema.anyOf as Array<{ required: string[] }>;
        const documentProperties = documentSchema.properties as Record<string, Record<string, unknown>>;
        const sourceDateSchema = documentProperties.sourceDate;
        if (!sourceDateSchema) {
            throw new Error("Expected sourceDate in the document request schema.");
        }
        const sourceDateVariants = sourceDateSchema.anyOf as Array<{ format: string }>;

        expect(updateAnyOf).toEqual([
            { required: ["displayName"] },
            { required: ["notes"] },
        ]);
        expect(sourceDateVariants.map(({ format }) => format)).toEqual(["date", "date-time"]);
    });

    it("resolves every local schema reference", () => {
        const schemaNames = new Set(Object.keys(generatedDocument.components.schemas));
        const references = collectSchemaReferences(generatedDocument);

        for (const reference of references) {
            const schemaName = reference.replace("#/components/schemas/", "");
            expect(schemaNames.has(schemaName), reference).toBe(true);
        }
    });
});
