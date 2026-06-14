import { AIMessage } from "@langchain/core/messages";
import { describe, expect, it, vi } from "vitest";
import { fakeModel } from "langchain";
import { createFriendContextAgent } from "../ai/agents/friendContext.agent.js";
import { tool } from "@langchain/core/tools";
import { z } from "zod";


describe("createFriendContextAgent group tests", () => {
    it("test case where it returns a direct response when no retrieval is needed", async () => {
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

    it("test case that uses the search tool for a history-dependent request", async () => {
        type FakeSearchInput = {
            friendId: string;
            query: string;
            limit?: number;
        };

        const fakeSearchImplementation = vi.fn(
            async (
                input: FakeSearchInput,
                runtime?: unknown,
            ) => {
                void input;//use void to indicate that we are intentionally not using the input in this fake implementation
                void runtime;// In a real test, you might want to assert on the input here

                return {
                    results: [
                        {
                            content:
                                "The user apologised and Cole responded positively.",
                        },
                    ],
                };
            },
        );

        const fakeSearchTool = tool(fakeSearchImplementation, {
            name: "search_friend_context",
            description: "Search stored friend context",
            schema: z.object({
                friendId: z.uuid(),
                query: z.string(),
                limit: z.number().optional(),
            }),
        });

        const model = fakeModel()
            .respondWithTools([
                {
                    name: "search_friend_context",
                    args: {
                        friendId: "5da77ede-2290-4ede-9839-d83a29a310e6",
                        query: "apologising after a badly worded message",
                        limit: 3,
                    },
                },
            ])
            .respond(
                new AIMessage(
                    "You apologised, clarified your meaning, and Cole responded positively.",
                ),
            );

        const agent = createFriendContextAgent(model, [
            fakeSearchTool,
        ]);

        const result = await agent.invoke({
            messages: [
                {
                    role: "user",
                    content:
                        "Use stored context to explain what happened after I sent Cole a badly worded message.",
                },
            ],
        });

        expect(result.messages.at(-1)?.content).toBe(
            "You apologised, clarified your meaning, and Cole responded positively.",
        );

        expect(model.callCount).toBe(2);
        expect(fakeSearchImplementation).toHaveBeenCalledTimes(1);

        expect(fakeSearchImplementation.mock.calls[0]?.[0]).toEqual({
            friendId: "5da77ede-2290-4ede-9839-d83a29a310e6",
            query: "apologising after a badly worded message",
            limit: 3,
        });
    });

    it("test case that states when retrieved context is insufficient", async () => {
        type FakeSearchInput = {
            friendId: string;
            query: string;
            limit?: number;
        };

        const emptySearchImplementation = vi.fn(
            async (
                input: FakeSearchInput,
                runtime?: unknown,
            ) => {
                void input;
                void runtime;

                return {
                    results: [],
                };
            },
        );

        const emptySearchTool = tool(emptySearchImplementation, {
            name: "search_friend_context",
            description: "Search stored friend context",
            schema: z.object({
                friendId: z.uuid(),
                query: z.string(),
                limit: z.number().optional(),
            }),
        });

        const model = fakeModel()
            .respondWithTools([
                {
                    name: "search_friend_context",
                    args: {
                        friendId:
                            "5da77ede-2290-4ede-9839-d83a29a310e6",
                        query: "a holiday disagreement",
                        limit: 3,
                    },
                },
            ])
            .respond(
                new AIMessage(
                    "I could not find enough stored context to answer that reliably.",
                ),
            );

        const agent = createFriendContextAgent(model, [
            emptySearchTool,
        ]);

        const result = await agent.invoke({
            messages: [
                {
                    role: "user",
                    content:
                        "What happened during my holiday disagreement with Cole?",
                },
            ],
        });

        expect(result.messages.at(-1)?.content).toBe(
            "I could not find enough stored context to answer that reliably.",
        );

        expect(emptySearchImplementation).toHaveBeenCalledTimes(1);
        expect(model.callCount).toBe(2);
    });
});

