import { prisma } from "../db/prisma.js";
import type { PersonFactVerificationStatus } from "../schemas/personFacts.schema.js";

type CreatePersonFactInput = {
    friendId: string;
    targetPersonId: string;
    authorPersonId: string;
    content: string;
    sourceType?: string;
    sourceId?: string;
};

type UpdatePersonFactVerificationStatusInput = {
    factId: string;
    verificationStatus: PersonFactVerificationStatus;
};

/** Returns the Person id linked to the current app user account. */
export async function getPersonIdForUser(userId: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { personId: true },
    });

    return user?.personId ?? null;
}

export function getDefaultPersonFactVerificationStatus(
    targetPersonId: string,
    authorPersonId: string,
): PersonFactVerificationStatus {
    return targetPersonId === authorPersonId
        ? "verified_self_declared"
        : "unverified_third_party";
}

export function buildPersonFactSearchContent(input: {
    content: string;
    verificationStatus: PersonFactVerificationStatus;
    sourceType: string;
}): string {
    return [
        `Person fact verification status: ${input.verificationStatus}`,
        `Person fact source type: ${input.sourceType}`,
        input.content,
    ].join("\n");
}

/**
 * Persists a person fact with the default trust status for its author/target.
 */
export async function createPersonFact(input: CreatePersonFactInput) {
    const verificationStatus = getDefaultPersonFactVerificationStatus(
        input.targetPersonId,
        input.authorPersonId,
    );

    const fact = await prisma.personFact.create({
        data: {
            targetPersonId: input.targetPersonId,
            authorPersonId: input.authorPersonId,
            content: input.content,
            verificationStatus,
            sourceType: input.sourceType ?? "manual",
            sourceId: input.sourceId ?? null,
        },
    });

    await prisma.searchableDocument.create({
        data: {
            friendId: input.friendId,
            sourceType: "person_fact",
            sourceId: fact.id,
            content: buildPersonFactSearchContent({
                content: fact.content,
                verificationStatus,
                sourceType: fact.sourceType,
            }),
        },
    });

    return fact;
}

/** Lists facts about a target person, newest first. */
export async function listPersonFactsForTarget(targetPersonId: string) {
    return prisma.personFact.findMany({
        where: { targetPersonId },
        orderBy: { createdAt: "desc" },
    });
}

/**
 * Updates a fact's verification status and refreshes its searchable text.
 */
export async function updatePersonFactVerificationStatus(
    input: UpdatePersonFactVerificationStatusInput,
) {
    const fact = await prisma.personFact.update({
        where: { id: input.factId },
        data: { verificationStatus: input.verificationStatus },
    });

    await prisma.searchableDocument.updateMany({
        where: {
            sourceType: "person_fact",
            sourceId: fact.id,
        },
        data: {
            content: buildPersonFactSearchContent({
                content: fact.content,
                verificationStatus: input.verificationStatus,
                sourceType: fact.sourceType,
            }),
        },
    });

    return fact;
}
