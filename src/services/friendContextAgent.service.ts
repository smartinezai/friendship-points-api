import { friendContextAgent } from "../ai/agents/friendContext.agent.js";

export type FriendContextAgentRequest = {
    friendId: string;
    question: string;
};

export type FriendContextAgentResponse = {
    answer: string;
};

export async function askFriendContextAgent(
    request: FriendContextAgentRequest,
): Promise<FriendContextAgentResponse> {
    const result = await friendContextAgent.invoke({
        messages: [
            {
                role: "user",
                content:
                    `Use stored context for friend ${request.friendId}. ` +
                    request.question,
            },
        ],
    });

    const finalMessage = result.messages.at(-1);

    if (typeof finalMessage?.content !== "string") {
        throw new Error(
            "Friend context agent did not return a text response",
        );
    }

    return {
        answer: finalMessage.content,
    };
}