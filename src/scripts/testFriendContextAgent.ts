import "dotenv/config";
import { friendContextAgent } from "../ai/agents/friendContext.production.js";

const validFriendId = "5da77ede-2290-4ede-9839-d83a29a310e6";

/**
 * Converts LangChain message content into readable plain text for smoke-test output.
 *
 * Some model responses are plain strings, while others are arrays of content
 * blocks such as `{ type: "text", text: "..." }`. This helper keeps the smoke
 * test output readable without changing agent behaviour.
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
 * Runs a manual smoke test for the production friend context agent.
 *
 * The first invocation checks whether the agent retrieves stored context and
 * includes a source citation. The second invocation checks that a simple
 * greeting does not require retrieval. This script is intentionally manual
 * because it calls the real model and real retrieval stack.
 */
async function main(): Promise<void> {
    const retrievalResult = await friendContextAgent.invoke({
        messages: [
            {
                role: "user",
                content:
                    `Using stored context for friend ${validFriendId}, ` +
                    "explain what happened when I apologised after sending a badly worded message.",
            },
        ],
    });

    const finalResponseContent = normaliseMessageContent(
        retrievalResult.messages.at(-1)?.content,
    );

    console.log("Final agent response:");
    console.log(finalResponseContent);

    const greetingResult = await friendContextAgent.invoke({
        messages: [
            {
                role: "user",
                content: "Hello, how are you?",
            },
        ],
    });

    const greetingResponseContent = normaliseMessageContent(
        greetingResult.messages.at(-1)?.content,
    );

    console.log("\nGreeting response:");
    console.log(greetingResponseContent);

    console.log("\nGreeting message history:");
    console.dir(greetingResult.messages, {
        depth: null,
    });
}

main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
});