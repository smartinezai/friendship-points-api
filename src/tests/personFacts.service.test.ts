import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../db/prisma.js", () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
        },
        personFact: {
            create: vi.fn(),
            findFirst: vi.fn(),
            findMany: vi.fn(),
            update: vi.fn(),
        },
        searchableDocument: {
            create: vi.fn(),
            updateMany: vi.fn(),
        },
    },
}));

import { prisma } from "../db/prisma.js";
import {
    buildPersonFactSearchContent,
    createPersonFact,
    getAccessiblePersonFact,
    getDefaultPersonFactVerificationStatus,
    getPersonIdForUser,
    listPersonFactsForTarget,
    updatePersonFactVerificationStatus,
} from "../services/personFacts.service.js";

const mockedFindUniqueUser = vi.mocked(prisma.user.findUnique);
const mockedCreatePersonFact = vi.mocked(prisma.personFact.create);
const mockedFindFirstPersonFact = vi.mocked(prisma.personFact.findFirst);
const mockedFindManyPersonFacts = vi.mocked(prisma.personFact.findMany);
const mockedUpdatePersonFact = vi.mocked(prisma.personFact.update);
const mockedCreateSearchableDocument = vi.mocked(
    prisma.searchableDocument.create,
);
const mockedUpdateManySearchableDocuments = vi.mocked(
    prisma.searchableDocument.updateMany,
);

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

describe("buildPersonFactSearchContent", () => {
    it("includes verification and source metadata with fact content", () => {
        const content = buildPersonFactSearchContent({
            content: "Cole prefers planned calls.",
            verificationStatus: "unverified_third_party",
            sourceType: "manual",
        });

        expect(content).toBe(
            "Person fact verification status: unverified_third_party\n" +
                "Person fact source type: manual\n" +
                "Cole prefers planned calls.",
        );
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
        mockedCreateSearchableDocument.mockResolvedValue({
            id: "search-doc-1",
            friendId: "friend-1",
            sourceType: "person_fact",
            sourceId: "fact-1",
            content:
                "Person fact verification status: unverified_third_party\n" +
                "Person fact source type: manual\n" +
                "Cole prefers planned calls.",
            documentId: null,
            documentTitle: null,
            documentType: null,
            sourceDate: null,
            chunkIndex: null,
            sectionHeading: null,
            createdAt: new Date("2026-06-28T00:00:00.000Z"),
            updatedAt: new Date("2026-06-28T00:00:00.000Z"),
        });
    });

    it("creates a fact with default verification and source metadata", async () => {
        await createPersonFact({
            friendId: "friend-1",
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
        expect(mockedCreateSearchableDocument).toHaveBeenCalledWith({
            data: {
                friendId: "friend-1",
                sourceType: "person_fact",
                sourceId: "fact-1",
                content:
                    "Person fact verification status: unverified_third_party\n" +
                    "Person fact source type: manual\n" +
                    "Cole prefers planned calls.",
            },
        });
    });

    it("preserves provided source metadata", async () => {
        await createPersonFact({
            friendId: "friend-1",
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

describe("getPersonIdForUser", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns the person id linked to a user", async () => {
        mockedFindUniqueUser.mockResolvedValue({
            id: "user-1",
            email: "user@example.com",
            displayName: "Test User",
            personId: "person-1",
            createdAt: new Date("2026-06-28T00:00:00.000Z"),
            updatedAt: new Date("2026-06-28T00:00:00.000Z"),
        });

        const personId = await getPersonIdForUser("user-1");

        expect(personId).toBe("person-1");
        expect(mockedFindUniqueUser).toHaveBeenCalledWith({
            where: { id: "user-1" },
            select: { personId: true },
        });
    });

    it("returns null when the user is missing or has no person", async () => {
        mockedFindUniqueUser.mockResolvedValue(null);

        await expect(getPersonIdForUser("missing-user")).resolves.toBe(null);
    });
});

describe("listPersonFactsForTarget", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedFindManyPersonFacts.mockResolvedValue([]);
    });

    it("lists facts for a target person newest first", async () => {
        await listPersonFactsForTarget("person-1");

        expect(mockedFindManyPersonFacts).toHaveBeenCalledWith({
            where: { targetPersonId: "person-1" },
            orderBy: { createdAt: "desc" },
        });
    });
});

describe("getAccessiblePersonFact", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedFindFirstPersonFact.mockResolvedValue(null);
    });

    it("loads a fact only through an active owned friend relationship", async () => {
        await getAccessiblePersonFact("fact-1", "user-1");

        expect(mockedFindFirstPersonFact).toHaveBeenCalledWith({
            where: {
                id: "fact-1",
                targetPerson: {
                    trackedBy: {
                        some: {
                            ownerUserId: "user-1",
                            deletedAt: null,
                        },
                    },
                },
            },
        });
    });
});

describe("updatePersonFactVerificationStatus", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedUpdatePersonFact.mockResolvedValue({
            id: "fact-1",
            targetPersonId: "person-1",
            authorPersonId: "person-2",
            content: "Cole prefers planned calls.",
            verificationStatus: "verified_by_target",
            sourceType: "manual",
            sourceId: null,
            createdAt: new Date("2026-06-28T00:00:00.000Z"),
            updatedAt: new Date("2026-06-28T00:00:00.000Z"),
        });
        mockedUpdateManySearchableDocuments.mockResolvedValue({ count: 1 });
    });

    it("updates the fact status and refreshes searchable text", async () => {
        const fact = await updatePersonFactVerificationStatus({
            factId: "fact-1",
            verificationStatus: "verified_by_target",
        });

        expect(fact.verificationStatus).toBe("verified_by_target");
        expect(mockedUpdatePersonFact).toHaveBeenCalledWith({
            where: { id: "fact-1" },
            data: { verificationStatus: "verified_by_target" },
        });
        expect(mockedUpdateManySearchableDocuments).toHaveBeenCalledWith({
            where: {
                sourceType: "person_fact",
                sourceId: "fact-1",
            },
            data: {
                content:
                    "Person fact verification status: verified_by_target\n" +
                    "Person fact source type: manual\n" +
                    "Cole prefers planned calls.",
            },
        });
    });
});
