import { searchFriendContextLangChainTool } from "../ai/tools/searchFriendContext.tool.js";

async function main(): Promise<void> {
    console.log("Valid tool invocation:");

    const validResult = await searchFriendContextLangChainTool.invoke({
        friendId: "5da77ede-2290-4ede-9839-d83a29a310e6",
        query: "apologising after a misunderstood or badly worded message",
        limit: 5,
    });

    console.dir(validResult, { depth: null });

    console.log("\nInvalid tool invocation:");

    try {
        await searchFriendContextLangChainTool.invoke({
            friendId: "Cole",
            query: "   ",
            limit: 25,
        });

        throw new Error("Expected invalid tool input to be rejected");
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.log(`Validation correctly rejected input: ${error.message}`);
        } else {
            console.log("Validation rejected input with an unknown error");
        }
    }
}

main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
});