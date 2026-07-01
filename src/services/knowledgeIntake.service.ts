import { prisma } from "../db/prisma.js";
import type { KnowledgeIntakeSubmittedByType } from "../schemas/knowledgeIntake.schema.js";
import { createPersonFact } from "./personFacts.service.js";

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

export function buildKnowledgeIntakeAnswerFactContent(
    answer: KnowledgeIntakeAnswerInput,
): string {
    return `${answer.questionText}\n${answer.answerText}`;
}

/** Stores one API-only knowledge intake submission and its answers. */
export async function createKnowledgeIntakeSubmission(
    input: CreateKnowledgeIntakeSubmissionInput,
) {
    const submission = await prisma.knowledgeIntakeSubmission.create({
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

    if (input.submittedByPersonId) {
        for (const answer of input.answers) {
            await createPersonFact({
                friendId: input.friendId,
                targetPersonId: input.targetPersonId,
                authorPersonId: input.submittedByPersonId,
                content: buildKnowledgeIntakeAnswerFactContent(answer),
                sourceType: "intake_submission",
                sourceId: submission.id,
            });
        }
    }

    return submission;
}
