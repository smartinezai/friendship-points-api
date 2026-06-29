import { z } from "zod";

export const knowledgeIntakeSubmittedByTypeSchema = z.enum([
    "target_person",
    "owner_user",
    "third_party",
]);

export const createKnowledgeIntakeAnswerSchema = z.object({
    questionKey: z.string().trim().min(1).max(120),
    questionText: z.string().trim().min(2).max(500),
    answerText: z.string().trim().min(1).max(2000),
});

/** Validates POST /friends/:friendId/intake-submissions request bodies. */
export const createKnowledgeIntakeSubmissionBodySchema = z.object({
    submittedByType: knowledgeIntakeSubmittedByTypeSchema,
    sourceType: z.string().trim().min(1).max(100).optional().default("api"),
    answers: z.array(createKnowledgeIntakeAnswerSchema).min(1).max(50),
});

export const createKnowledgeIntakeSubmissionParamsSchema = z.object({
    friendId: z.uuid(),
});

export type KnowledgeIntakeSubmittedByType = z.infer<
    typeof knowledgeIntakeSubmittedByTypeSchema
>;

export type CreateKnowledgeIntakeSubmissionBody = z.infer<
    typeof createKnowledgeIntakeSubmissionBodySchema
>;

export type CreateKnowledgeIntakeSubmissionParams = z.infer<
    typeof createKnowledgeIntakeSubmissionParamsSchema
>;
