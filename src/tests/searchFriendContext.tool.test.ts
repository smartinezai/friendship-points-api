import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    rerankContextItems,
    retrieveFriendContextSemantically,
    type RerankedContextItem,
    type SemanticRetrievedContextItem,
} from "../services/search.service.js";
import {
    executeSearchFriendContextTool,
    searchFriendContextLangChainTool,
    searchFriendContextTool,
    searchFriendContextToolInputSchema,
} from "../ai/tools/searchFriendContext.tool.js";
import { formatSourceCitation } from "../ai/tools/sourceCitation.js";


// Mock the retrieval service so these tests only verify tool behavior.
// Semantic retrieval and reranking have their own service-level tests.
vi.mock("../services/search.service.js", () => ({
    retrieveFriendContextSemantically: vi.fn(),
    rerankContextItems: vi.fn(),
}));

// A stable UUID used anywhere the schema requires a valid friend id.
const validFriendId = "5da77ede-2290-4ede-9839-d83a29a310e6";


/**
 * Adds the citation field that the search tool now appends to returned results.
 *
 * The mocked reranker returns plain RerankedContextItem objects, but the tool
 * wraps those results with a formatted citation before returning them to the
 * agent. This helper keeps the test expectations aligned with that output
 * shape without duplicating citation strings in every assertion.
 */
function addExpectedCitations<
    Result extends { sourceType: string; sourceId: string },
>(results: Result[]) {
    return results.map((result) => ({
        ...result,
        citation: formatSourceCitation(result.sourceType, result.sourceId),
    }));
}


// These tests verify the Zod schema that protects the tool from bad input.
describe("searchFriendContextToolInputSchema group tests", () => {
    // Valid input should include a UUID friend id, a non-empty query, and an allowed limit.
    it("test case that accepts valid tool input", () => {
        const result = searchFriendContextToolInputSchema.safeParse({
            friendId: validFriendId,
            query: "apologies and communication repair",
            limit: 5,
        });

        expect(result.success).toBe(true);
    });

    // The tool should default the limit later, so the schema allows it to be omitted.
    it("test case that accepts input without an optional limit", () => {
        const result = searchFriendContextToolInputSchema.safeParse({
            friendId: validFriendId,
            query: "apologies and communication repair",
        });

        expect(result.success).toBe(true);
    });

    // Friend ids must be UUIDs because route/database records use UUID identifiers.
    it("test case that rejects an invalid friend ID", () => {
        const result = searchFriendContextToolInputSchema.safeParse({
            friendId: "Cole",
            query: "apologies",
            limit: 5,
        });

        expect(result.success).toBe(false);
    });

    // Trimming happens before min(1), so whitespace-only queries are rejected.
    it("test case that rejects a whitespace-only query", () => {
        const result = searchFriendContextToolInputSchema.safeParse({
            friendId: validFriendId,
            query: "   ",
            limit: 5,
        });

        expect(result.success).toBe(false);
    });

    // A zero limit would produce no useful tool output, so it is invalid.
    it("test case that rejects a zero limit", () => {
        const result = searchFriendContextToolInputSchema.safeParse({
            friendId: validFriendId,
            query: "apologies",
            limit: 0,
        });

        expect(result.success).toBe(false);
    });

    // Negative limits do not make sense for result counts.
    it("test case that rejects a negative limit", () => {
        const result = searchFriendContextToolInputSchema.safeParse({
            friendId: validFriendId,
            query: "apologies",
            limit: -1,
        });

        expect(result.success).toBe(false);
    });

    // Result limits must be whole numbers because they are used for array slicing.
    it("test case that rejects a non-integer limit", () => {
        const result = searchFriendContextToolInputSchema.safeParse({
            friendId: validFriendId,
            query: "apologies",
            limit: 2.5,
        });

        expect(result.success).toBe(false);
    });

    // The max limit protects downstream prompts from becoming too large.
    it("test case that rejects a limit greater than ten", () => {
        const result = searchFriendContextToolInputSchema.safeParse({
            friendId: validFriendId,
            query: "apologies",
            limit: 11,
        });

        expect(result.success).toBe(false);
    });
});

// Typed mock handle for the semantic retrieval dependency.
const mockedRetrieveFriendContextSemantically = vi.mocked(
    retrieveFriendContextSemantically,
);

// Typed mock handle for the deterministic reranker dependency.
const mockedRerankContextItems = vi.mocked(rerankContextItems);

// Controlled semantic retrieval output returned by the mocked retrieval service.
const semanticResults: SemanticRetrievedContextItem[] = [
    {
        sourceType: "event",
        sourceId: "11111111-1111-4111-8111-111111111111",
        friendId: validFriendId,
        content: "First semantic result",
        score: 0,
        distance: 0.1,
    },
    {
        sourceType: "rule",
        sourceId: "22222222-2222-4222-8222-222222222222",
        friendId: validFriendId,
        content: "Second semantic result",
        score: 0,
        distance: 0.2,
    },
];

// Controlled reranked output with six items so tests can verify default and custom slicing.
const rerankedResults: RerankedContextItem[] = Array.from(
    { length: 6 },
    (_, index) => ({
        sourceType: "event",
        sourceId: `source-${index}`,
        friendId: validFriendId,
        content: `Reranked result ${index}`,
        score: 0,
        rerankScore: 10 - index,
        rerankReason: "Controlled test result",
    }),
);

// These tests verify the core tool orchestration after input is already trusted.
describe("searchFriendContextTool group tests", () => {
    // Reset mocks before every case so call counts and return values do not leak.
    beforeEach(() => {
        vi.clearAllMocks();

        // The tool should receive these semantic candidates from retrieval.
        mockedRetrieveFriendContextSemantically.mockResolvedValue(
            semanticResults,
        );

        // The tool should return a slice of these reranked results.
        mockedRerankContextItems.mockReturnValue(rerankedResults);
    });

    // The tool intentionally fetches ten semantic candidates before applying final limit.
    it("test case that retrieves ten semantic candidates before reranking", async () => {
        await searchFriendContextTool({
            friendId: validFriendId,
            query: "communication repair",
        });

        expect(
            mockedRetrieveFriendContextSemantically,
        ).toHaveBeenCalledWith(
            validFriendId,
            "communication repair",
            {
                limit: 10,
            },
        );
    });

    // The reranker must receive the original query and all semantic candidates.
    it("test case that passes semantic results to the reranker", async () => {
        await searchFriendContextTool({
            friendId: validFriendId,
            query: "communication repair",
        });

        expect(mockedRerankContextItems).toHaveBeenCalledWith(
            "communication repair",
            semanticResults,
        );
    });

    // When callers omit limit, the tool returns five final results by default.
    it("test case that returns five results when no limit is supplied", async () => {
        const result = await searchFriendContextTool({
            friendId: validFriendId,
            query: "communication repair",
        });

        expect(result.results).toEqual(
            addExpectedCitations(rerankedResults.slice(0, 5)),
        );
    });

    // A valid caller-supplied limit controls final output size after reranking.
    it("test case that respects a caller-supplied result limit", async () => {
        const result = await searchFriendContextTool({
            friendId: validFriendId,
            query: "communication repair",
            limit: 2,
        });

        expect(result.results).toEqual(
            addExpectedCitations(rerankedResults.slice(0, 2)),
        );
    });
});

// These tests verify the boundary where raw agent/tool-call input enters the system.
describe("search friend context execution boundaries group tests", () => {
    // Each execution-boundary test gets fresh mocks and predictable retrieval output.
    beforeEach(() => {
        vi.clearAllMocks();

        // If validation passes, the execution wrapper should call this mocked retrieval.
        mockedRetrieveFriendContextSemantically.mockResolvedValue(
            semanticResults,
        );

        // If validation passes, the final result should come from this mocked rerank output.
        mockedRerankContextItems.mockReturnValue(rerankedResults);
    });

    // Invalid raw input must fail before retrieval, protecting database-backed services.
    it("case that rejects invalid untrusted input before retrieval runs", async () => {
        await expect(
            executeSearchFriendContextTool({
                friendId: "Cole",
                query: "   ",
                limit: 25,
            }),
        ).rejects.toThrow("Invalid search tool input");

        expect(
            mockedRetrieveFriendContextSemantically,
        ).not.toHaveBeenCalled();
    });

    // Valid raw input should be parsed, executed, reranked, and sliced normally.
    it("case that executes valid untrusted input", async () => {
        const result = await executeSearchFriendContextTool({
            friendId: validFriendId,
            query: "communication repair",
            limit: 2,
        });

        expect(result.results).toEqual(
            addExpectedCitations(rerankedResults.slice(0, 2)),
        );
    });

    // The LangChain wrapper should execute the same tool logic for valid inputs.
    it("case that allows the LangChain tool to execute valid input", async () => {
        const result = await searchFriendContextLangChainTool.invoke({
            friendId: validFriendId,
            query: "communication repair",
            limit: 2,
        });

        expect(result.results).toEqual(
            addExpectedCitations(rerankedResults.slice(0, 2)),
        );
    });

    // LangChain schema validation should reject invalid input before retrieval runs.
    it("case that makes the LangChain tool reject invalid input before retrieval", async () => {
        await expect(
            searchFriendContextLangChainTool.invoke({
                friendId: "Cole",
                query: "   ",
                limit: 25,
            }),
        ).rejects.toThrow();

        expect(
            mockedRetrieveFriendContextSemantically,
        ).not.toHaveBeenCalled();
    });
});
