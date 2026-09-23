import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import app from "../../app.js";
import { prisma } from "../../db/prisma.js";
import { createTestUser } from "./factories.js";
import { cleanUpTestUser } from "./testDatabase.js";

let ownerUserId = "";
let ownerPersonId = "";

describe("person pronouns with PostgreSQL", () => {
    beforeEach(async () => {
        const user = await createTestUser();
        ownerUserId = user.id;
        ownerPersonId = user.personId ?? "";
    });

    afterEach(async () => {
        await cleanUpTestUser(ownerUserId);
    });

    afterAll(async () => {
        await app.close();
        await prisma.$disconnect();
    });

    it("stores pronouns as optional profile data", async () => {
        const initialPerson = await prisma.person.findUnique({
            where: { id: ownerPersonId },
        });
        expect(initialPerson?.pronouns).toBeNull();

        const updatedPerson = await prisma.person.update({
            where: { id: ownerPersonId },
            data: { pronouns: "they/them" },
        });
        expect(updatedPerson.pronouns).toBe("they/them");
    });
});
