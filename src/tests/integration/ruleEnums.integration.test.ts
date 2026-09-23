import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import app from "../../app.js";
import { prisma } from "../../db/prisma.js";
import { IMPACT_DIRECTIONS, RULE_WEIGHTS } from "../../domain/friendship.js";
import { createTestFriend, createTestUser } from "./factories.js";
import { cleanUpTestUser } from "./testDatabase.js";

let ownerUserId = "";

function requestHeaders() {
    return { "x-user-id": ownerUserId };
}

describe("rule enums with PostgreSQL", () => {
    beforeEach(async () => {
        const user = await createTestUser();
        ownerUserId = user.id;
    });

    afterEach(async () => {
        await cleanUpTestUser(ownerUserId);
    });

    afterAll(async () => {
        await app.close();
        await prisma.$disconnect();
    });

    it("persists every supported impact direction and weight through the API", async () => {
        const friend = await createTestFriend({
            ownerUserId,
            displayName: "Cole",
        });

        for (const impactDirection of IMPACT_DIRECTIONS) {
            for (const weight of RULE_WEIGHTS) {
                const response = await app.inject({
                    method: "POST",
                    url: `/friends/${friend.id}/rules`,
                    headers: requestHeaders(),
                    payload: {
                        title: `Rule ${impactDirection} ${weight}`,
                        description: "A valid rule for enum persistence.",
                        impactDirection,
                        weight,
                    },
                });

                expect(response.statusCode).toBe(201);
                expect(response.json<{
                    rule: { impactDirection: string; weight: string };
                }>().rule).toMatchObject({ impactDirection, weight });
            }
        }

        expect(await prisma.rule.count({ where: { friendId: friend.id } })).toBe(
            IMPACT_DIRECTIONS.length * RULE_WEIGHTS.length,
        );
    });
});
