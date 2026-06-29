import { describe, expect, it } from "vitest";
import {
    createKnowledgeIntakeSubmissionBodySchema,
    createKnowledgeIntakeSubmissionParamsSchema,
    knowledgeIntakeSubmittedByTypeSchema,
} from "../schemas/knowledgeIntake.schema.js";

describe("knowledgeIntakeSubmittedByTypeSchema", () => {
    it("accepts supported submitter types", () => {
        expect(
            knowledgeIntakeSubmittedByTypeSchema.safeParse("target_person")
                .success,
        ).toBe(true);
        expect(
            knowledgeIntakeSubmittedByTypeSchema.safeParse("owner_user")
                .success,
        ).toBe(true);
    });

    it("rejects unsupported submitter types", () => {
        const result = knowledgeIntakeSubmittedByTypeSchema.safeParse("bot");

        expect(result.success).toBe(false);
    });
});

describe("createKnowledgeIntakeSubmissionBodySchema", () => {
    it("accepts a valid API intake submission and defaults sourceType", () => {
        const result = createKnowledgeIntakeSubmissionBodySchema.safeParse({
            submittedByType: "target_person",
            answers: [
                {
                    questionKey: "communication.calls",
                    questionText: "  How do you feel about phone calls?  ",
                    answerText: "  I prefer scheduled calls.  ",
                },
            ],
        });

        expect(result.success).toBe(true);

        if (result.success) {
            expect(result.data).toEqual({
                submittedByType: "target_person",
                sourceType: "api",
                answers: [
                    {
                        questionKey: "communication.calls",
                        questionText: "How do you feel about phone calls?",
                        answerText: "I prefer scheduled calls.",
                    },
                ],
            });
        }
    });

    it("rejects submissions without answers", () => {
        const result = createKnowledgeIntakeSubmissionBodySchema.safeParse({
            submittedByType: "target_person",
            answers: [],
        });

        expect(result.success).toBe(false);
    });

    it("rejects empty answer text", () => {
        const result = createKnowledgeIntakeSubmissionBodySchema.safeParse({
            submittedByType: "target_person",
            answers: [
                {
                    questionKey: "communication.calls",
                    questionText: "How do you feel about phone calls?",
                    answerText: "",
                },
            ],
        });

        expect(result.success).toBe(false);
    });
});

describe("createKnowledgeIntakeSubmissionParamsSchema", () => {
    it("accepts a valid friend id", () => {
        const result = createKnowledgeIntakeSubmissionParamsSchema.safeParse({
            friendId: "5da77ede-2290-4ede-9839-d83a29a310e6",
        });

        expect(result.success).toBe(true);
    });

    it("rejects an invalid friend id", () => {
        const result = createKnowledgeIntakeSubmissionParamsSchema.safeParse({
            friendId: "not-a-friend-id",
        });

        expect(result.success).toBe(false);
    });
});
