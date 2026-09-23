import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import app from "../../app.js";
import { prisma } from "../../db/prisma.js";
import { createTestAssessment, createTestUser } from "./factories.js";
import { cleanUpTestUser } from "./testDatabase.js";

let ownerUserId = "";

function requestHeaders() {
    return { "x-user-id": ownerUserId };
}

describe("scoring routes with PostgreSQL", () => {
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

    it("creates a rule and event then calculates the stored score balance", async () => {
        const friendResponse = await app.inject({
            method: "POST",
            url: "/friends",
            headers: requestHeaders(),
            payload: { displayName: "Cole" },
        });
        expect(friendResponse.statusCode).toBe(201);
        const friend = friendResponse.json<{
            friend: { id: string };
        }>().friend;

        const ruleResponse = await app.inject({
            method: "POST",
            url: `/friends/${friend.id}/rules`,
            headers: requestHeaders(),
            payload: {
                title: "Plan calls",
                description: "Cole prefers calls arranged in advance.",
                impactDirection: "negative",
                weight: "medium",
            },
        });
        expect(ruleResponse.statusCode).toBe(201);
        const rule = ruleResponse.json<{
            rule: { id: string; friendId?: string };
        }>().rule;
        expect(rule).not.toHaveProperty("friendId");

        const eventResponse = await app.inject({
            method: "POST",
            url: `/friends/${friend.id}/events`,
            headers: requestHeaders(),
            payload: { eventText: "I called without asking first." },
        });
        expect(eventResponse.statusCode).toBe(201);
        const event = eventResponse.json<{
            event: { id: string; friendId?: string };
        }>().event;
        expect(event).not.toHaveProperty("friendId");

        const assessmentResponse = await app.inject({
            method: "POST",
            url: `/events/${event.id}/manual-assessment`,
            headers: requestHeaders(),
            payload: { scoreDelta: -2.5, reason: "The call was unexpected." },
        });
        expect(assessmentResponse.statusCode).toBe(201);
        expect(
            assessmentResponse.json<{
                assessment: Record<string, unknown>;
            }>().assessment,
        ).not.toHaveProperty("eventId");

        const balanceResponse = await app.inject({
            method: "GET",
            url: `/friends/${friend.id}/balance`,
            headers: requestHeaders(),
        });
        expect(balanceResponse.statusCode).toBe(200);
        expect(balanceResponse.json()).toEqual({
            friendId: friend.id,
            balance: -2.5,
        });

        await createTestAssessment({ eventId: event.id, scoreDelta: 1.5 });
        const updatedBalanceResponse = await app.inject({
            method: "GET",
            url: `/friends/${friend.id}/balance`,
            headers: requestHeaders(),
        });
        expect(updatedBalanceResponse.json()).toEqual({
            friendId: friend.id,
            balance: -1,
        });

        expect(await prisma.rule.findUnique({ where: { id: rule.id } })).toMatchObject({
            friendId: friend.id,
        });
    });
});
