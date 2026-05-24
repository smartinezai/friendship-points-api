import type { FastifyInstance } from 'fastify';
import { prisma } from "../db/prisma.js";
import { getFriendById } from "../services/friends.service.js";
import { mockLlmAssessment } from '../ai/mockAssessment.service.js';
import { langchainAssessEvent } from '../ai/langchainAssessment.service.js';
import { mistralAssessEvent } from "../ai/mistralAssessment.service.js";

import { assessEventWithProvider } from '../services/assessments.service.js';

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
        Params: { eventId: string };
    }>("/events/:eventId/mock-assessment", async (request, reply) => {
        const { eventId } = request.params;

        try {
            const result = await assessEventWithProvider(
                eventId,
                "mock",
                mockLlmAssessment
            );

            if (!result) {
                return reply.status(404).send({ error: "Event not found" });
            }

            return reply.status(201).send(result);
        } catch (error) {
            console.error("Error during mock assessment:", error);

            return reply.status(500).send({
                error: "An error occurred during the LLM assessment.",
            });
        }
    });

    app.post<{
        Params: { eventId: string };
    }>("/events/:eventId/mistral-assessment", async (request, reply) => {
        const { eventId } = request.params;

        try {
            const result = await assessEventWithProvider(
                eventId,
                "mistral",
                mistralAssessEvent
            );

            if (!result) {
                return reply.status(404).send({ error: "Event not found" });
            }

            return reply.status(201).send(result);
        } catch (error) {
            console.error("Error during Mistral assessment:", error);

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
  Params: { eventId: string };
}>("/events/:eventId/openai-assessment", async (request, reply) => {
  const { eventId } = request.params;

  try {
    const result = await assessEventWithProvider(
      eventId,
      "openai",
      langchainAssessEvent
    );

    if (!result) {
      return reply.status(404).send({ error: "Event not found" });
    }

    return reply.status(201).send(result);
  } catch (error) {
    console.error("Error during OpenAI assessment:", error);

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
