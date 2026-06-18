import { z } from "zod";
import {
    rerankContextItems,
    retrieveFriendContextSemantically,
    type RerankedContextItem,
} from "../../services/search.service.js";
import { tool } from "@langchain/core/tools";
import { formatSourceCitation } from "./sourceCitation.js";
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

/**
 * Structured result returned to the agent after semantic search and reranking.
 *
 * Results include both the retrieved evidence and a preformatted citation so
 * downstream agent prompts do not need to invent their own citation format.
 */
export type SearchFriendContextToolOutput = {
    results: CitedSearchFriendContextResult[];
};

/**
 * Reranked context item enriched with a ready-made citation string.
 *
 * The search tool returns this shape to the agent so the model can copy the
 * citation directly instead of reconstructing source metadata itself. This
 * keeps citation formatting consistent across retrieved events, rules, and
 * friend notes.
 */
export type CitedSearchFriendContextResult = RerankedContextItem & {
    /**
     * Canonical source citation that should be copied into agent responses.
     *
     * Example: `[event: aa4e0523-356c-4db5-99f5-ef0d39ffc863]`
     */
    citation: string;
};


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
        citation: formatSourceCitation(result.sourceType, result.sourceId),
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

/**
 * LangChain-compatible wrapper around the friend-context search tool.
 *
 * The wrapper exposes the validated search function to agents under a stable
 * tool name. LangChain handles schema validation before invoking the function,
 * while `searchFriendContextTool` handles retrieval, reranking, and citation
 * enrichment.
 */
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
