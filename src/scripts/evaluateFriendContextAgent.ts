import "dotenv/config";
import { friendContextAgent } from "../ai/agents/friendContext.production.js";
import { traceAsync } from "../ai/tracing/traceAsync.js";

const validFriendId = "5da77ede-2290-4ede-9839-d83a29a310e6";

type AgentEvaluationCase = {
    /**
     * Human-readable label printed in the terminal so each evaluation case is easy to inspect.
     */
    label: string;

    /**
     * The exact user question sent to the production friend-context agent.
     */
    question: string;

    /**
     * Whether this case should trigger the search_friend_context tool.
     *
     * This evaluates tool-routing behaviour, not answer quality.
     */
    shouldUseTool: boolean;

    /**
     * Optional citation expected in the final answer for known-positive grounded cases.
     *
     * Omit this for exploratory cases where the answer may legitimately vary.
     */
    expectedCitation?: string;

    /**
     * Optional text that should appear in the final response.
     *
     * This is used for broad behavioural checks, such as verifying that the
     * agent admits insufficient context instead of forcing an answer from
     * weakly related retrieval results.
     */
    expectedResponseIncludes?: string;
};

type AgentEvaluationSummary = {
    /**
     * Total number of manual evaluation cases executed.
     */
    totalCases: number;

    /**
     * Number of cases where tool usage matched the expected routing behaviour.
     */
    toolUseMatches: number;

    /**
     * Number of cases that configured an expected citation.
     */
    citationChecks: number;

    /**
     * Number of expected citations found in final agent responses.
     */
    citationMatches: number;

    /**
     * Number of cases that configured expected response text.
     */
    responseTextChecks: number;

    /**
     * Number of configured response-text expectations found in final responses.
     */
    responseTextMatches: number;

    /**
     * Number of final responses that included a concrete source citation.
     */
    evidenceCitationCount: number;

    /**
     * Number of final responses that explicitly said no direct evidence was used.
     */
    evidenceNoneCount: number;

    /**
     * Number of final responses that did not include a recognisable evidence line.
     */
    evidenceMissingCount: number;

    /**
     * Number of retrieval-backed cases that did not include a recognisable evidence line.
     *
     * Direct non-retrieval responses, such as greetings, do not need evidence lines.
     */
    retrievalEvidenceMissingCount: number;

    /**
     * Whether any configured manual expectation failed during this evaluation run.
     */
    hasFailedExpectation: boolean;
};

type EvidenceStatus = "citation" | "none" | "missing";

/**
 * Lightweight analytics extracted from the final model message.
 *
 * These values are optional because different LangChain models/providers expose
 * metadata differently. The script should report metadata when available without
 * failing when a provider omits it.
 */
type FinalMessageAnalytics = {
    /**
     * Whether the final answer ended with a source citation, explicit no-evidence
     * marker, or no recognisable evidence line.
     */
    evidenceStatus: EvidenceStatus;

    /**
     * Model name reported by the provider, when available.
     */
    modelName?: string;

    /**
     * Number of input tokens reported by the provider, when available.
     */
    inputTokens?: number;

    /**
     * Number of output tokens reported by the provider, when available.
     */
    outputTokens?: number;

    /**
     * Total tokens reported by the provider, when available.
     */
    totalTokens?: number;
};

/**
 * Converts LangChain message content into readable plain text.
 *
 * Some model responses are plain strings, while others are arrays of content
 * blocks such as `{ type: "text", text: "..." }`. This helper keeps terminal
 * output readable without changing production agent behaviour.
 */
function normaliseMessageContent(content: unknown): string {
    if (typeof content === "string") {
        return content;
    }

    if (Array.isArray(content)) {
        return content
            .map((block) => {
                if (
                    typeof block === "object" &&
                    block !== null &&
                    "text" in block &&
                    typeof block.text === "string"
                ) {
                    return block.text;
                }

                return "";
            })
            .join("");
    }

    return String(content);
}

/**
 * Checks whether any LangChain message contains tool calls.
 *
 * This gives a lightweight signal for whether the agent attempted retrieval.
 * It intentionally does not judge whether the retrieved context was good.
 */
function didUseTool(messages: unknown[]): boolean {
    return messages.some((message) => {
        if (
            typeof message === "object" &&
            message !== null &&
            "tool_calls" in message &&
            Array.isArray(message.tool_calls)
        ) {
            return message.tool_calls.length > 0;
        }

        return false;
    });
}

/**
 * Classifies the final evidence line in an agent response.
 *
 * The agent is expected to end grounded answers with either:
 * - `Evidence used: [sourceType: sourceId]`
 * - `Evidence used: None`
 *
 * This helper gives the evaluation script a compact quality signal without
 * needing to compare the full natural-language answer exactly.
 */
function getEvidenceStatus(finalResponse: string): EvidenceStatus {
    if (/^Evidence used:\s*\[[^\]]+\]/m.test(finalResponse)) {
        return "citation";
    }

    if (/^Evidence used:\s*None/m.test(finalResponse)) {
        return "none";
    }

    return "missing";
}

/**
 * Extracts provider metadata from the final LangChain message when available.
 *
 * LangChain message objects are not treated as trusted plain objects here, so
 * the helper checks each field before reading it. This keeps the script robust
 * across provider-specific message metadata shapes.
 */
function getFinalMessageAnalytics(
    messages: unknown[],
    finalResponse: string,
): FinalMessageAnalytics {
    const finalMessage = messages.at(-1);

    const analytics: FinalMessageAnalytics = {
        evidenceStatus: getEvidenceStatus(finalResponse),
    };

    if (
        typeof finalMessage === "object" &&
        finalMessage !== null &&
        "response_metadata" in finalMessage &&
        typeof finalMessage.response_metadata === "object" &&
        finalMessage.response_metadata !== null &&
        "model" in finalMessage.response_metadata &&
        typeof finalMessage.response_metadata.model === "string"
    ) {
        analytics.modelName = finalMessage.response_metadata.model;
    }

    if (
        typeof finalMessage === "object" &&
        finalMessage !== null &&
        "usage_metadata" in finalMessage &&
        typeof finalMessage.usage_metadata === "object" &&
        finalMessage.usage_metadata !== null
    ) {
        const usageMetadata = finalMessage.usage_metadata;

        if (
            "input_tokens" in usageMetadata &&
            typeof usageMetadata.input_tokens === "number"
        ) {
            analytics.inputTokens = usageMetadata.input_tokens;
        }

        if (
            "output_tokens" in usageMetadata &&
            typeof usageMetadata.output_tokens === "number"
        ) {
            analytics.outputTokens = usageMetadata.output_tokens;
        }

        if (
            "total_tokens" in usageMetadata &&
            typeof usageMetadata.total_tokens === "number"
        ) {
            analytics.totalTokens = usageMetadata.total_tokens;
        }
    }

    return analytics;
}

const evaluationCases: AgentEvaluationCase[] = [
    {
        label: "History-dependent apology question",
        question:
            `Using stored context for friend ${validFriendId}, ` +
            "explain what happened when I apologised after sending a badly worded message.",
        shouldUseTool: true,
        expectedCitation:
            "[event: aa4e0523-356c-4db5-99f5-ef0d39ffc863]",
    },
    {
        label: "Simple greeting",
        question: "Hello, how are you?",
        shouldUseTool: false,
    },
    {
        label: "Unknown holiday disagreement",
        question:
            `Using stored context for friend ${validFriendId}, ` +
            "what happened during my holiday disagreement with Cole?",
        shouldUseTool: true,
        expectedResponseIncludes: "does not contain",
    },
];

/**
 * Runs manual agentic-RAG evaluation cases against the production agent.
 *
 * This script is intentionally manual because it calls the real model and real
 * retrieval stack. It should be used during development to inspect tool routing,
 * evidence usage, and citation behaviour, not as a deterministic CI test.
 */
async function main(): Promise<void> {
    const summary: AgentEvaluationSummary = {
        totalCases: evaluationCases.length,
        toolUseMatches: 0,
        citationChecks: 0,
        citationMatches: 0,
        responseTextChecks: 0,
        responseTextMatches: 0,
        evidenceCitationCount: 0,
        evidenceNoneCount: 0,
        evidenceMissingCount: 0,
        retrievalEvidenceMissingCount: 0,
        hasFailedExpectation: false,
    };

    for (const evaluationCase of evaluationCases) {
        console.log(`\n=== ${evaluationCase.label} ===`);

        /**
         * Trace the full production agent invocation for this evaluation case.
         *
         * `traceAsync` returns an object with two properties:
         * - `result`: the original agent response from `friendContextAgent.invoke(...)`
         * - `trace`: timing and success metadata for this evaluation run
         *
         * We destructure both properties here so the rest of the script can keep
         * using `result.messages` while also printing trace metadata.
         */
        const { result, trace } = await traceAsync(
            `friend-context-agent:${evaluationCase.label}`,
            async () =>
                friendContextAgent.invoke({
                    messages: [
                        {
                            role: "user",
                            content: evaluationCase.question,
                        },
                    ],
                }),
        );

        const finalResponse = normaliseMessageContent(
            result.messages.at(-1)?.content,
        );

        const finalMessageAnalytics = getFinalMessageAnalytics(
            result.messages,
            finalResponse,
        );

        if (finalMessageAnalytics.evidenceStatus === "citation") {
            summary.evidenceCitationCount += 1;
        }

        if (finalMessageAnalytics.evidenceStatus === "none") {
            summary.evidenceNoneCount += 1;
        }

        if (finalMessageAnalytics.evidenceStatus === "missing") {
            summary.evidenceMissingCount += 1;

            if (evaluationCase.shouldUseTool) {
                summary.retrievalEvidenceMissingCount += 1;
                summary.hasFailedExpectation = true;
            }
        }

        const usedTool = didUseTool(result.messages);
        const toolUseMatchedExpectation =
            usedTool === evaluationCase.shouldUseTool;

        if (toolUseMatchedExpectation) {
            summary.toolUseMatches += 1;
        }
        if (!toolUseMatchedExpectation) {
            summary.hasFailedExpectation = true;
        }

        console.log(`Expected tool use: ${evaluationCase.shouldUseTool}`);
        console.log(`Actual tool use: ${usedTool}`);
        console.log(
            `Tool-use expectation met: ${toolUseMatchedExpectation}`,
        );

        console.log(`Trace operation: ${trace.operationName}`);
        console.log(`Trace durationMs: ${trace.durationMs}`);
        console.log(`Trace success: ${trace.success}`);

        console.log(`Evidence status: ${finalMessageAnalytics.evidenceStatus}`);
        console.log(`Model name: ${finalMessageAnalytics.modelName ?? "unknown"}`);
        console.log(
            `Token usage: input=${finalMessageAnalytics.inputTokens ?? "unknown"}, ` +
            `output=${finalMessageAnalytics.outputTokens ?? "unknown"}, ` +
            `total=${finalMessageAnalytics.totalTokens ?? "unknown"}`,
        );

        if (evaluationCase.expectedCitation) {
            summary.citationChecks += 1;

            const citationPresent = finalResponse.includes(
                evaluationCase.expectedCitation,
            );

            if (citationPresent) {
                summary.citationMatches += 1;
            }
            if (!citationPresent) {
                summary.hasFailedExpectation = true;
            }

            console.log(`Expected citation present: ${citationPresent}`);
        }

        if (evaluationCase.expectedResponseIncludes) {
            summary.responseTextChecks += 1;

            const expectedTextPresent = finalResponse
                .toLowerCase()
                .includes(
                    evaluationCase.expectedResponseIncludes.toLowerCase(),
                );

            if (expectedTextPresent) {
                summary.responseTextMatches += 1;
            }

            if (!expectedTextPresent) {
                summary.hasFailedExpectation = true;
            }

            console.log(
                `Expected response text present: ${expectedTextPresent}`,
            );
        }

        console.log("\nFinal response:");
        console.log(finalResponse);
    }

    console.log("\n=== Agent evaluation summary ===");
    console.log(`Cases evaluated: ${summary.totalCases}`);
    console.log(
        `Tool-use expectations met: ${summary.toolUseMatches}/${summary.totalCases}`,
    );
    console.log(
        `Expected citations found: ${summary.citationMatches}/${summary.citationChecks}`,
    );
    console.log(
        `Expected response text found: ${summary.responseTextMatches}/${summary.responseTextChecks}`,
    );
    console.log(
        `Evidence status counts: citation=${summary.evidenceCitationCount}, ` +
            `none=${summary.evidenceNoneCount}, ` +
            `missing=${summary.evidenceMissingCount}`,
    );
    console.log(
        `Retrieval-backed missing evidence lines: ${summary.retrievalEvidenceMissingCount}`,
    );

    if (summary.hasFailedExpectation) {
        throw new Error(
            "One or more manual agent evaluation expectations failed",
        );
    }
}

main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
});