import { prisma } from "../db/prisma.js";
import type { PersonFactVerificationStatus } from "../schemas/personFacts.schema.js";

type CreatePersonFactInput = {
    targetPersonId: string;
    authorPersonId: string;
    content: string;
    sourceType?: string;
    sourceId?: string;
};

export function getDefaultPersonFactVerificationStatus(
    targetPersonId: string,
    authorPersonId: string,
): PersonFactVerificationStatus {
    return targetPersonId === authorPersonId
        ? "verified_self_declared"
        : "unverified_third_party";
}

/**
 * Persists a person fact with the default trust status for its author/target.
 */
export async function createPersonFact(input: CreatePersonFactInput) {
    const verificationStatus = getDefaultPersonFactVerificationStatus(
        input.targetPersonId,
        input.authorPersonId,
    );

    return prisma.personFact.create({
        data: {
            targetPersonId: input.targetPersonId,
            authorPersonId: input.authorPersonId,
            content: input.content,
            verificationStatus,
            sourceType: input.sourceType ?? "manual",
            sourceId: input.sourceId ?? null,
        },
    });
}
