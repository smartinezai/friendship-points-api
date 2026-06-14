import { AIMessage } from "@langchain/core/messages";
import { describe, expect, it } from "vitest";
import { fakeModel } from "langchain";
import { createFriendContextAgent } from "../ai/agents/friendContext.agent.js";

describe("createFriendContextAgent group tests", () => {
    it("case where it returns a direct response when no retrieval is needed", async () => {
        const model = fakeModel().respond(
            new AIMessage("Hello. How can I help?"),
        );

        const agent = createFriendContextAgent(model);

        const result = await agent.invoke({
            messages: [
                {
                    role: "user",
                    content: "Hello, how are you?",
                },
            ],
        });

        expect(result.messages.at(-1)?.content).toBe(
            "Hello. How can I help?",
        );

        expect(model.callCount).toBe(1);
    });
});
