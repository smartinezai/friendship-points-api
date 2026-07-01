import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../db/prisma.js", () => ({
    prisma: {
        knowledgeIntakeSubmission: {
            create: vi.fn(),
        },
    },
}));

vi.mock("../services/personFacts.service.js", () => ({
    createPersonFact: vi.fn(),
}));

import { prisma } from "../db/prisma.js";
import {
    buildKnowledgeIntakeAnswerFactContent,
    createKnowledgeIntakeSubmission,
} from "../services/knowledgeIntake.service.js";
import { createPersonFact } from "../services/personFacts.service.js";

const mockedCreateSubmission = vi.mocked(
    prisma.knowledgeIntakeSubmission.create,
);
const mockedCreatePersonFact = vi.mocked(createPersonFact);

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
        mockedCreatePersonFact.mockResolvedValue({
            id: "fact-1",
            targetPersonId: "person-1",
            authorPersonId: "person-1",
            content:
                "How do you feel about phone calls?\n" +
                "I prefer scheduled calls.",
            verificationStatus: "verified_self_declared",
            sourceType: "intake_submission",
            sourceId: "submission-1",
            createdAt: new Date("2026-06-29T00:00:00.000Z"),
            updatedAt: new Date("2026-06-29T00:00:00.000Z"),
        });
    });

    it("formats answer text as person fact content", () => {
        const content = buildKnowledgeIntakeAnswerFactContent({
            questionKey: "communication.calls",
            questionText: "How do you feel about phone calls?",
            answerText: "I prefer scheduled calls.",
        });

        expect(content).toBe(
            "How do you feel about phone calls?\n" +
                "I prefer scheduled calls.",
        );
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
        expect(mockedCreatePersonFact).toHaveBeenCalledWith({
            friendId: "friend-1",
            targetPersonId: "person-1",
            authorPersonId: "person-1",
            content:
                "How do you feel about phone calls?\n" +
                "I prefer scheduled calls.",
            sourceType: "intake_submission",
            sourceId: "submission-1",
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
        expect(mockedCreatePersonFact).not.toHaveBeenCalled();
    });
});
