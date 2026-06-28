import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../db/prisma.js", () => ({
    prisma: {
        personFact: {
            create: vi.fn(),
        },
    },
}));

import { prisma } from "../db/prisma.js";
import {
    createPersonFact,
    getDefaultPersonFactVerificationStatus,
} from "../services/personFacts.service.js";

const mockedCreatePersonFact = vi.mocked(prisma.personFact.create);

describe("getDefaultPersonFactVerificationStatus", () => {
    it("marks self-authored facts as verified self-declared", () => {
        const status = getDefaultPersonFactVerificationStatus(
            "person-1",
            "person-1",
        );

        expect(status).toBe("verified_self_declared");
    });

    it("marks facts about another person as unverified third-party", () => {
        const status = getDefaultPersonFactVerificationStatus(
            "person-1",
            "person-2",
        );

        expect(status).toBe("unverified_third_party");
    });
});

describe("createPersonFact", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedCreatePersonFact.mockResolvedValue({
            id: "fact-1",
            targetPersonId: "person-1",
            authorPersonId: "person-2",
            content: "Cole prefers planned calls.",
            verificationStatus: "unverified_third_party",
            sourceType: "manual",
            sourceId: null,
            createdAt: new Date("2026-06-28T00:00:00.000Z"),
            updatedAt: new Date("2026-06-28T00:00:00.000Z"),
        });
    });

    it("creates a fact with default verification and source metadata", async () => {
        await createPersonFact({
            targetPersonId: "person-1",
            authorPersonId: "person-2",
            content: "Cole prefers planned calls.",
        });

        expect(mockedCreatePersonFact).toHaveBeenCalledWith({
            data: {
                targetPersonId: "person-1",
                authorPersonId: "person-2",
                content: "Cole prefers planned calls.",
                verificationStatus: "unverified_third_party",
                sourceType: "manual",
                sourceId: null,
            },
        });
    });

    it("preserves provided source metadata", async () => {
        await createPersonFact({
            targetPersonId: "person-1",
            authorPersonId: "person-1",
            content: "I prefer direct feedback.",
            sourceType: "intake_form",
            sourceId: "form-response-1",
        });

        expect(mockedCreatePersonFact).toHaveBeenCalledWith({
            data: {
                targetPersonId: "person-1",
                authorPersonId: "person-1",
                content: "I prefer direct feedback.",
                verificationStatus: "verified_self_declared",
                sourceType: "intake_form",
                sourceId: "form-response-1",
            },
        });
    });
});
