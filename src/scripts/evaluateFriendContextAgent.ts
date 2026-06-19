import "dotenv/config";
import { friendContextAgent } from "../ai/agents/friendContext.production.js";

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
     * Whether any configured manual expectation failed during this evaluation run.
     */
    hasFailedExpectation: boolean;
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
        hasFailedExpectation: false,
    };

    for (const evaluationCase of evaluationCases) {
        console.log(`\n=== ${evaluationCase.label} ===`);

        const result = await friendContextAgent.invoke({
            messages: [
                {
                    role: "user",
                    content: evaluationCase.question,
                },
            ],
        });

        const finalResponse = normaliseMessageContent(
            result.messages.at(-1)?.content,
        );

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