import { afterAll, describe, expect, it } from "vitest";
import app from "../app.js";
import { prisma } from "../db/prisma.js";

describe("UUID route parameter validation", () => {
    afterAll(async () => {
        await app.close();
        await prisma.$disconnect();
    });

    it("rejects malformed IDs before the route queries the database", async () => {
        const responses = await Promise.all([
            app.inject({ method: "GET", url: "/friends/not-a-uuid" }),
            app.inject({ method: "GET", url: "/events/not-a-uuid" }),
            app.inject({ method: "GET", url: "/friends/not-a-uuid/events" }),
            app.inject({
                method: "PATCH",
                url: "/rules/not-a-uuid/weight",
                payload: { weight: "high" },
            }),
        ]);

        expect(responses.map((response) => response.statusCode)).toEqual([
            400,
            400,
            400,
            400,
        ]);
    });
});
