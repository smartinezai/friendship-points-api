import "dotenv/config";
import { friendContextAgent } from "../ai/agents/friendContext.agent.js";

const validFriendId = "5da77ede-2290-4ede-9839-d83a29a310e6";

async function main(): Promise<void> {
    const result = await friendContextAgent.invoke({
        messages: [
            {
                role: "user",
                content:
                    `Using stored context for friend ${validFriendId}, ` +
                    "explain what happened when I apologised after sending a badly worded message.",
            },
        ],
    });

    const finalMessage = result.messages.at(-1);

    console.log("Final agent response:");
    console.dir(finalMessage?.content, { depth: null });
}

main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
});