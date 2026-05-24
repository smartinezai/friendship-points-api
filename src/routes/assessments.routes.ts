import type { FastifyInstance } from 'fastify';
import { prisma } from "../db/prisma.js";
import { getFriendById } from "../services/friends.service.js";
import { mockLlmAssessment } from '../ai/mockAssessment.service.js';
import { langchainAssessEvent } from '../ai/langchainAssessment.service.js';
import { mistralAssessEvent } from "../ai/mistralAssessment.service.js";

export async function assessmentRoutes(app: FastifyInstance) {
    app.post<{
        Params: { eventId: string },
        Body: {
            scoreDelta: number;
            reason?: string;
        };
    }>("/events/:eventId/manual-assessment", async (request, reply) => {
        const { eventId } = request.params;
        const { scoreDelta, reason } = request.body;

        if (typeof scoreDelta !== "number" ||
            scoreDelta < -10 || scoreDelta > 10
        ) {
            return reply.status(400).send({ error: "Invalid scoreDelta. Please provide a number between -10 and 10." });
        }

        // Validate the event exists
        const event = await prisma.event.findUnique({
            where: { id: eventId }
        });

        if (!event) {
            return reply.status(404).send({ error: "Event not found" });
        }

        const assessment = await prisma.assessment.create({
            data: {
                eventId,
                scoreDelta,
                reason: reason ?? null,  // Set to null if reason is undefined, otherwise use the provided reason. the double question mark operator (??) is used to provide a default value of null when reason is undefined. This ensures that the reason field in the database will be set to null if no reason is provided in the request body, rather than leaving it as undefined which may not be acceptable for the database schema.
                source: "manual",
            },
        });
        return reply.status(201).send({ assessment });
    });


    app.get<{
        Params: { friendId: string }
    }>("/friends/:friendId/balance", async (request, reply) => {
        const { friendId } = request.params;
        const friend = await getFriendById(friendId);

        if (!friend) {
            return reply.status(404).send({ error: "Friend not found" });
        }

        const result = await prisma.assessment.aggregate({
            where: {
                event: {
                    friendId,
                },
            },
            _sum: { //_summ is the Prisma aggregate function that calculates the sum of the specified field (in this case, scoreDelta) for all records that match the given criteria. In this context, it is used to calculate the total scoreDelta for all assessments related to events associated with the specified friendId.
                scoreDelta: true, // This line specifies that we want to calculate the sum of the scoreDelta field for all assessments that match the criteria defined in the where clause. By setting scoreDelta to true, we are indicating that we want to include this field in the aggregation result, allowing us to obtain the total scoreDelta for the specified friendId.q
            },
        });
        return reply.status(200).send({
            friendId,
            balance: result._sum.scoreDelta ?? 0
        });
    });

    app.post<{
        Params: { eventId: string }
    }>("/events/:eventId/mock-assessment", async (request, reply) => {
        const { eventId } = request.params; //get eventId from request params
        const event = await prisma.event.findUnique({ //check if the event exists
            where: { id: eventId }, //find one event by id and inclue the friend connet3ed to that event and the active rules of that friend
            include: {
                friend: {
                    include: {
                        rules: {
                            where: {
                                active: true, //only include active rules in the assessment input, since inactive rules should not be considered when evaluating the impact of an event on a friendship. By filtering for active rules, we ensure that the LLM assessment is based on the most relevant and up-to-date information about the friend's preferences and boundaries.
                            }
                        }
                    }
                }
            },
        });
        if (!event) {
            return reply.status(404).send({ error: "Event not found" });
        }

        const friend = event.friend;
        const rules = event.friend.rules;
        const llmInput = {
            friend: {
                id: friend.id,
                displayName: friend.displayName,
                notes: friend.notes,
            },
            event: {
                id: event.id,
                eventText: event.eventText,
                happenedAt: event.happenedAt ? event.happenedAt.toISOString() : null,
            },
            rules: rules.map(rule => ({
                id: rule.id,
                title: rule.title,
                description: rule.description,
                impactDirection: rule.impactDirection,
                weight: rule.weight,
            })),
        };

        try {
            const llmResult = await mockLlmAssessment(llmInput);
            const assessment = await prisma.assessment.create({
                data: {
                    eventId,
                    scoreDelta: llmResult.scoreDelta,
                    reason: llmResult.reasoningSummary,
                    source: "mock-llm",
                    impactDirection: llmResult.impactDirection,
                    biasNotes: llmResult.biasNotes ?? null,
                    confidence: llmResult.confidence,
                    matchedRuleIds: llmResult.matchedRuleIds,
                },
            });
            return reply.status(201).send({ assessment, llmResult });
        } catch (error) {
            console.error("Error during LLM assessment:", error);
            return reply.status(500).send({ error: "An error occurred during the LLM assessment." });
        }
    });

    app.post < {
        Params: { eventId: string }
    }>("/events/:eventId/mistral-assessment", async (request, reply) => {
        const { eventId } = request.params;

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                friend: {
                    include: {
                        rules: {
                            where: {
                                active: true,
                            },
                        },
                    },
                },
            },
        });

        if (!event) {
            return reply.status(404).send({ error: "Event not found" });
        }

        const friend = event.friend;
        const rules = event.friend.rules;

        const llmInput = {
            friend: {
                id: friend.id,
                displayName: friend.displayName,
                notes: friend.notes,
            },
            event: {
                id: event.id,
                eventText: event.eventText,
                happenedAt: event.happenedAt ? event.happenedAt.toISOString() : null,
            },
            rules: rules.map((rule) => ({
                id: rule.id,
                title: rule.title,
                description: rule.description,
                impactDirection: rule.impactDirection,
                weight: rule.weight,
            })),
        };

        try {
            const llmResult = await mistralAssessEvent(llmInput);

            const assessment = await prisma.assessment.create({
                data: {
                    eventId,
                    scoreDelta: llmResult.scoreDelta,
                    reason: llmResult.reasoningSummary,
                    source: "mistral",
                    impactDirection: llmResult.impactDirection,
                    biasNotes: llmResult.biasNotes ?? null,
                    confidence: llmResult.confidence,
                    matchedRuleIds: llmResult.matchedRuleIds,
                },
            });

            return reply.status(201).send({ assessment, llmResult });
        } catch (error) {
            console.error("Error during LLM assessment:", error);

            if (error instanceof Error) {
                console.error("Error message:", error.message);
                console.error("Error stack:", error.stack);
            }
            return reply.status(500).send({
                error: "An error occurred during the LLM assessment.",
            });
        }
    });


    
    
    app.post<{
        Params: { eventId: string }
    }>("/events/:eventId/llm-assessment", async (request, reply) => {
        const { eventId } = request.params;

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                friend: {
                    include: {
                        rules: {
                            where: {
                                active: true,
                            },
                        },
                    },
                },
            },
        });

        if (!event) {
            return reply.status(404).send({ error: "Event not found" });
        }

        const friend = event.friend;
        const rules = event.friend.rules;

        const llmInput = {
            friend: {
                id: friend.id,
                displayName: friend.displayName,
                notes: friend.notes,
            },
            event: {
                id: event.id,
                eventText: event.eventText,
                happenedAt: event.happenedAt ? event.happenedAt.toISOString() : null,
            },
            rules: rules.map((rule) => ({
                id: rule.id,
                title: rule.title,
                description: rule.description,
                impactDirection: rule.impactDirection,
                weight: rule.weight,
            })),
        };

        try {
            const llmResult = await langchainAssessEvent(llmInput);

            const assessment = await prisma.assessment.create({
                data: {
                    eventId,
                    scoreDelta: llmResult.scoreDelta,
                    reason: llmResult.reasoningSummary,
                    source: "llm",
                    impactDirection: llmResult.impactDirection,
                    biasNotes: llmResult.biasNotes ?? null,
                    confidence: llmResult.confidence,
                    matchedRuleIds: llmResult.matchedRuleIds,
                },
            });

            return reply.status(201).send({ assessment, llmResult });
        } catch (error) {
            console.error("Error during LLM assessment:", error);

            if (error instanceof Error) {
                console.error("Error message:", error.message);
                console.error("Error stack:", error.stack);
            }
            return reply.status(500).send({
                error: "An error occurred during the LLM assessment.",
            });
        }
    });
}
