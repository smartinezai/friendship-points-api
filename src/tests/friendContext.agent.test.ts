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
                /**
 * The fake tool implementation does not need to inspect the input because this
 * test controls the model's tool call separately and asserts the received input
 * after invocation.
 */
                void input;
                void runtime;
                return {
                    results: [
                        {
                            sourceType: "event",
                            sourceId: "aa4e0523-356c-4db5-99f5-ef0d39ffc863",
                            friendId: "5da77ede-2290-4ede-9839-d83a29a310e6",
                            content:
                                "The user apologised and Cole responded positively.",
                            score: 0,
                            rerankScore: 3.5,
                            rerankReason: "Controlled test result",
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
                    [
                        "You apologised, clarified your meaning, and Cole responded positively.",
                        "",
                        "Evidence used: [event: aa4e0523-356c-4db5-99f5-ef0d39ffc863]",
                    ].join("\n"),
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

        /**
 * The grounded response should follow the current agent contract:
 * a short natural-language answer followed by a separate evidence line.
 *
 * This makes the citation easier to inspect than embedding it somewhere inside
 * the prose, and it protects the response format we expect the real agent to use.
 */
        expect(result.messages.at(-1)?.content).toBe(
            [
                "You apologised, clarified your meaning, and Cole responded positively.",
                "",
                "Evidence used: [event: aa4e0523-356c-4db5-99f5-ef0d39ffc863]",
            ].join("\n"),
        );

        /**
 * The response must include the exact source citation from retrieved context.
 *
 * This assertion protects the citation itself, while the previous assertion
 * protects the full response structure.
 */
        expect(result.messages.at(-1)?.content).toContain(
            "Evidence used: [event: aa4e0523-356c-4db5-99f5-ef0d39ffc863]",
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
                    [
                        "I could not find enough stored context to answer that reliably.",
                        "",
                        "Evidence used: None",
                    ].join("\n"),
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
            [
                "I could not find enough stored context to answer that reliably.",
                "",
                "Evidence used: None",
            ].join("\n"),
        );

        expect(emptySearchImplementation).toHaveBeenCalledTimes(1);
        expect(model.callCount).toBe(2);
    });
});