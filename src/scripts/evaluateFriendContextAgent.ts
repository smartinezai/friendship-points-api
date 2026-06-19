import "dotenv/config";
import { friendContextAgent } from "../ai/agents/friendContext.production.js";

const validFriendId = "5da77ede-2290-4ede-9839-d83a29a310e6";

/**
 * One manual evaluation case for the production friend-context agent.
 *
 * These cases are intentionally not unit tests because they call the real model
 * and may vary slightly between runs. They are used to inspect whether the
 * agent chooses tools appropriately and whether grounded answers include
 * evidence.
 */
type AgentEvaluationCase = {
    label: string;
    question: string;
    shouldUseTool: boolean;
    expectedCitation?: string;
};

/**
 * Converts LangChain message content into readable plain text.
 *
 * Model responses can be either plain strings or arrays of content blocks.
 * Keeping this normalisation local to the evaluation script makes the terminal
 * output readable without changing agent or production behaviour.
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
 * Checks whether any agent message contains tool calls.
 *
 * This is a lightweight evaluation signal for tool-routing behaviour. It does
 * not judge answer quality; it only checks whether the model attempted to use a
 * tool during the agent loop.
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
    },
];

/**
 * Runs manual agentic-RAG evaluation cases against the production agent.
 *
 * The script reports whether tool use matched expectations and whether known
 * citation-bearing answers include the expected citation. It is a manual
 * evaluation aid, not a deterministic CI test.
 */
async function main(): Promise<void> {
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

        console.log(`Expected tool use: ${evaluationCase.shouldUseTool}`);
        console.log(`Actual tool use: ${usedTool}`);
        console.log(
            `Tool-use expectation met: ${toolUseMatchedExpectation}`,
        );

        if (evaluationCase.expectedCitation) {
            console.log(
                `Expected citation present: ${finalResponse.includes(
                    evaluationCase.expectedCitation,
                )}`,
            );
        }

        console.log("\nFinal response:");
        console.log(finalResponse);
    }
}

main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
});