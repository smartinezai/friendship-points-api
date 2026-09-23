import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import app from "../../app.js";
import { prisma } from "../../db/prisma.js";
import { createTestUser } from "./factories.js";
import { cleanUpTestUser } from "./testDatabase.js";

type FriendResponse = {
    id: string;
    displayName: string;
    notes: string | null;
};

let ownerUserId = "";

function requestHeaders() {
    return { "x-user-id": ownerUserId };
}

async function createFriend(input: {
    displayName: string;
    notes?: string;
}): Promise<FriendResponse> {
    const response = await app.inject({
        method: "POST",
        url: "/friends",
        headers: requestHeaders(),
        payload: input,
    });

    expect(response.statusCode).toBe(201);
    const friend = response.json<{
        friend: FriendResponse & {
            ownerUserId?: string;
            targetPersonId?: string;
        };
    }>().friend;
    expect(friend).not.toHaveProperty("ownerUserId");
    expect(friend).not.toHaveProperty("targetPersonId");
    return friend;
}

describe("friend routes with PostgreSQL", () => {
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

    it("updates friend details and appends notes without replacing earlier notes", async () => {
        const friend = await createFriend({
            displayName: "Cole",
            notes: "Likes a little notice.",
        });

        const updateResponse = await app.inject({
            method: "PATCH",
            url: `/friends/${friend.id}`,
            headers: requestHeaders(),
            payload: { displayName: "Cole R.", notes: "First note." },
        });

        expect(updateResponse.statusCode).toBe(200);
        expect(updateResponse.json<{ friend: FriendResponse }>().friend).toMatchObject({
            displayName: "Cole R.",
            notes: "First note.",
        });

        const appendResponse = await app.inject({
            method: "POST",
            url: `/friends/${friend.id}/notes/append`,
            headers: requestHeaders(),
            payload: { note: "Second note." },
        });

        expect(appendResponse.statusCode).toBe(200);
        expect(appendResponse.json<{ friend: FriendResponse }>().friend.notes).toBe(
            "First note.\n\nSecond note.",
        );

        const emptyAppendResponse = await app.inject({
            method: "POST",
            url: `/friends/${friend.id}/notes/append`,
            headers: requestHeaders(),
            payload: { note: "" },
        });

        expect(emptyAppendResponse.statusCode).toBe(400);
    });

    it("requires the friend search query and hides soft-deleted friends", async () => {
        const missingQueryResponse = await app.inject({
            method: "GET",
            url: "/friends/search",
            headers: requestHeaders(),
        });

        expect(missingQueryResponse.statusCode).toBe(400);

        const friend = await createFriend({ displayName: "Cole" });
        const firstDeleteResponse = await app.inject({
            method: "DELETE",
            url: `/friends/${friend.id}`,
            headers: requestHeaders(),
        });

        expect(firstDeleteResponse.statusCode).toBe(200);

        const getDeletedResponse = await app.inject({
            method: "GET",
            url: `/friends/${friend.id}`,
            headers: requestHeaders(),
        });
        expect(getDeletedResponse.statusCode).toBe(404);

        const searchDeletedResponse = await app.inject({
            method: "GET",
            url: "/friends/search?name=Cole",
            headers: requestHeaders(),
        });
        expect(searchDeletedResponse.statusCode).toBe(200);
        expect(searchDeletedResponse.json()).toEqual({ friends: [] });

        const secondDeleteResponse = await app.inject({
            method: "DELETE",
            url: `/friends/${friend.id}`,
            headers: requestHeaders(),
        });
        expect(secondDeleteResponse.statusCode).toBe(404);
    });

});
