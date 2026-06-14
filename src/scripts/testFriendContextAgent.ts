import "dotenv/config";
import { friendContextAgent } from "../ai/agents/friendContext.production.js";

const validFriendId = "5da77ede-2290-4ede-9839-d83a29a310e6";

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

    console.log("Final agent response:");
    console.dir(retrievalResult.messages.at(-1)?.content, {
        depth: null,
    });

    const greetingResult = await friendContextAgent.invoke({
        messages: [
            {
                role: "user",
                content: "Hello, how are you?",
            },
        ],
    });

    console.log("\nGreeting response:");
    console.dir(greetingResult.messages.at(-1)?.content, {
        depth: null,
    });

    console.log("\nGreeting message history:");
    console.dir(greetingResult.messages, {
        depth: null,
    });
}

main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
});