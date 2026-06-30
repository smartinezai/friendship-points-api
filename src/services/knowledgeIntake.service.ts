import { prisma } from "../db/prisma.js";
import type { KnowledgeIntakeSubmittedByType } from "../schemas/knowledgeIntake.schema.js";

type KnowledgeIntakeAnswerInput = {
    questionKey: string;
    questionText: string;
    answerText: string;
};

type CreateKnowledgeIntakeSubmissionInput = {
    friendId: string;
    targetPersonId: string;
    submittedByPersonId?: string;
    submittedByType: KnowledgeIntakeSubmittedByType;
    sourceType?: string;
    answers: KnowledgeIntakeAnswerInput[];
};

/** Stores one API-only knowledge intake submission and its answers. */
export async function createKnowledgeIntakeSubmission(
    input: CreateKnowledgeIntakeSubmissionInput,
) {
    return prisma.knowledgeIntakeSubmission.create({
        data: {
            friendId: input.friendId,
            targetPersonId: input.targetPersonId,
            submittedByPersonId: input.submittedByPersonId ?? null,
            submittedByType: input.submittedByType,
            sourceType: input.sourceType ?? "api",
            answers: {
                create: input.answers.map((answer) => ({
                    questionKey: answer.questionKey,
                    questionText: answer.questionText,
                    answerText: answer.answerText,
                })),
            },
        },
        include: {
            answers: true,
        },
    });
}
