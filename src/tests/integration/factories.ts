import { randomUUID } from "node:crypto";
import { prisma } from "../../db/prisma.js";

/** Creates a person with a unique display name for one integration test. */
export async function createTestPerson(displayName = `Test person ${randomUUID()}`) {
    return prisma.person.create({
        data: { displayName },
    });
}

/** Creates a user linked to a unique person record. */
export async function createTestUser() {
    const person = await createTestPerson();

    return prisma.user.create({
        data: {
            personId: person.id,
            email: `${randomUUID()}@example.test`,
            displayName: person.displayName,
        },
    });
}

/** Creates a tracked person for the given test user. */
export async function createTestFriend(input: {
    ownerUserId: string;
    displayName?: string;
    notes?: string | null;
}) {
    const person = await createTestPerson(input.displayName);

    return prisma.friend.create({
        data: {
            ownerUserId: input.ownerUserId,
            targetPersonId: person.id,
            displayName: input.displayName ?? person.displayName,
            notes: input.notes ?? null,
        },
    });
}

/** Creates a rule attached to a test friend. */
export async function createTestRule(input: {
    friendId: string;
    title?: string;
    description?: string;
    impactDirection?: string;
    weight?: string;
}) {
    return prisma.rule.create({
        data: {
            friendId: input.friendId,
            title: input.title ?? "Test rule",
            description: input.description ?? "Test rule description",
            impactDirection: input.impactDirection ?? "negative",
            weight: input.weight ?? "medium",
        },
    });
}

/** Creates an event attached to a test friend. */
export async function createTestEvent(input: {
    friendId: string;
    eventText?: string;
}) {
    return prisma.event.create({
        data: {
            friendId: input.friendId,
            eventText: input.eventText ?? "Test event",
        },
    });
}

/** Creates a score assessment for a test event. */
export async function createTestAssessment(input: {
    eventId: string;
    scoreDelta?: number;
    source?: string;
}) {
    return prisma.assessment.create({
        data: {
            eventId: input.eventId,
            scoreDelta: input.scoreDelta ?? 1,
            source: input.source ?? "manual",
        },
    });
}

/** Creates a searchable document with a real or friend-scoped source ID. */
export async function createTestSearchableDocument(input: {
    friendId: string;
    content: string;
    sourceType?: string;
    sourceId?: string;
}) {
    return prisma.searchableDocument.create({
        data: {
            friendId: input.friendId,
            content: input.content,
            sourceType: input.sourceType ?? "friend_note",
            sourceId: input.sourceId ?? input.friendId,
        },
    });
}

/** Creates a person fact between two test people. */
export async function createTestPersonFact(input: {
    targetPersonId: string;
    authorPersonId: string;
    content?: string;
    verificationStatus?: string;
}) {
    return prisma.personFact.create({
        data: {
            targetPersonId: input.targetPersonId,
            authorPersonId: input.authorPersonId,
            content: input.content ?? "Test person fact",
            verificationStatus: input.verificationStatus ?? "unverified_third_party",
        },
    });
}
