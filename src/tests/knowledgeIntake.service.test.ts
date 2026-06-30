import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../db/prisma.js", () => ({
    prisma: {
        knowledgeIntakeSubmission: {
            create: vi.fn(),
        },
    },
}));

import { prisma } from "../db/prisma.js";
import { createKnowledgeIntakeSubmission } from "../services/knowledgeIntake.service.js";

const mockedCreateSubmission = vi.mocked(
    prisma.knowledgeIntakeSubmission.create,
);

describe("createKnowledgeIntakeSubmission", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedCreateSubmission.mockResolvedValue({
            id: "submission-1",
            friendId: "friend-1",
            targetPersonId: "person-1",
            submittedByPersonId: "person-1",
            submittedByType: "target_person",
            sourceType: "api",
            createdAt: new Date("2026-06-29T00:00:00.000Z"),
            updatedAt: new Date("2026-06-29T00:00:00.000Z"),
        });
    });

    it("stores a submission with nested answers", async () => {
        await createKnowledgeIntakeSubmission({
            friendId: "friend-1",
            targetPersonId: "person-1",
            submittedByPersonId: "person-1",
            submittedByType: "target_person",
            answers: [
                {
                    questionKey: "communication.calls",
                    questionText: "How do you feel about phone calls?",
                    answerText: "I prefer scheduled calls.",
                },
            ],
        });

        expect(mockedCreateSubmission).toHaveBeenCalledWith({
            data: {
                friendId: "friend-1",
                targetPersonId: "person-1",
                submittedByPersonId: "person-1",
                submittedByType: "target_person",
                sourceType: "api",
                answers: {
                    create: [
                        {
                            questionKey: "communication.calls",
                            questionText:
                                "How do you feel about phone calls?",
                            answerText: "I prefer scheduled calls.",
                        },
                    ],
                },
            },
            include: {
                answers: true,
            },
        });
    });

    it("stores null submitter person when none is provided", async () => {
        await createKnowledgeIntakeSubmission({
            friendId: "friend-1",
            targetPersonId: "person-1",
            submittedByType: "third_party",
            sourceType: "import",
            answers: [
                {
                    questionKey: "hobbies",
                    questionText: "What hobbies should people know about?",
                    answerText: "Rock climbing.",
                },
            ],
        });

        expect(mockedCreateSubmission).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    submittedByPersonId: null,
                    sourceType: "import",
                }),
            }),
        );
    });
});
