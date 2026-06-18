import { z } from "zod";
import {
    rerankContextItems,
    retrieveFriendContextSemantically,
    type RerankedContextItem,
} from "../../services/search.service.js";
import { tool } from "@langchain/core/tools";
/**
 * Runtime schema for the agent-facing friend-context search tool.
 *
 * The LLM/tool caller supplies unknown data, so this schema is the safety
 * boundary before any database-backed retrieval runs.
 */
export const searchFriendContextToolInputSchema = z.object({
    friendId: z
        .uuid()
        .describe("ID of the friend whose stored context should be searched"),

    query: z
        .string()
        .trim()
        .min(1)
        .describe(
            "Natural-language description of the information to search for",
        ),

    limit: z
        .number()
        .int()
        .positive()
        .max(10)
        .optional()
        .describe("Maximum number of reranked results to return"),
});

/** Validated input accepted by searchFriendContextTool. */
export type SearchFriendContextToolInput = z.infer<
    typeof searchFriendContextToolInputSchema
>;

/** Structured result returned to the agent after semantic search and reranking. */
export type SearchFriendContextToolOutput = {
    results: CitedSearchFriendContextResult[];
};

export type CitedSearchFriendContextResult = RerankedContextItem & { // Extends the base retrieved and reranked context item with source citation for agent use.
    citation: string;
};

function formatSourceCitation(item: RerankedContextItem): string {
    return `[${item.sourceType}: ${item.sourceId}]`;
}

/**
 * Searches a friend's ingested context and returns reranked results.
 *
 * @param input - Validated friend id, query, and optional result limit.
 * @returns Reranked context items for use as agent/RAG evidence.
 */
export async function searchFriendContextTool(
    input: SearchFriendContextToolInput,
): Promise<SearchFriendContextToolOutput> {
    const finalLimit = input.limit ?? 5;

    const semanticResults = await retrieveFriendContextSemantically(
        input.friendId,
        input.query,
        {
            limit: 10,
        },
    );

    const rerankedResults = rerankContextItems(
        input.query,
        semanticResults,
    ).slice(0, finalLimit);

    const citedResults = rerankedResults.map((result) => ({
        ...result,
        citation: formatSourceCitation(result),
    }));

    return {
        results: citedResults,
    };
}
/**
 * Validates and executes the search tool from an untrusted tool-call payload.
 *
 * @param untrustedInput - Raw JSON-like input from an agent/tool invocation.
 * @returns Reranked context items if validation succeeds.
 * @throws Error when the tool input does not match the schema.
 */
export async function executeSearchFriendContextTool(
    untrustedInput: unknown,
): Promise<SearchFriendContextToolOutput> {
    const validationResult =
        searchFriendContextToolInputSchema.safeParse(untrustedInput);

    if (!validationResult.success) {
        throw new Error(
            `Invalid search tool input: ${validationResult.error.message}`,
        );
    }

    return searchFriendContextTool(validationResult.data);
}

export const searchFriendContextLangChainTool = tool(
    async (input) => {
        return searchFriendContextTool(input);
    },
    {
        name: "search_friend_context",
        description:
            "Search a friend's stored rules, notes, and events using semantic retrieval and deterministic reranking. Use this when an assessment or prediction requires historical relationship context. Reuse each result's citation field when citing retrieved context.",
        schema: searchFriendContextToolInputSchema,
    },
);
