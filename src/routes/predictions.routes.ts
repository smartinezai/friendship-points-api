import type { FastifyInstance } from "fastify";
import { prisma } from "../db/prisma.js";
import { predictFriendActionBodySchema } from "../schemas/predictions.schema.js";
import { mockLlmAssessment } from "../ai/mockAssessment.service.js";

export async function predictionRoutes(app: FastifyInstance) {
  app.post<{
    Params: { friendId: string };
  }>("/friends/:friendId/predict", async (request, reply) => {
    const { friendId } = request.params;

    const parsedBody = predictFriendActionBodySchema.safeParse(request.body);

    if (!parsedBody.success) {
      return reply.status(400).send({
        error: "Invalid request body",
        details: parsedBody.error.issues,
      });
    }

    const friend = await prisma.friend.findUnique({
      where: { id: friendId },
      include: {
        rules: {
          where: { active: true },
        },
      },
    });

    if (!friend) {
      return reply.status(404).send({ error: "Friend not found" });
    }

    const predictionInput = {
      friend: {
        id: friend.id,
        displayName: friend.displayName,
        notes: friend.notes,
      },
      event: {
        id: "hypothetical-event",
        eventText: parsedBody.data.hypotheticalAction,
        happenedAt: null,
      },
      rules: friend.rules.map((rule) => ({
        id: rule.id,
        title: rule.title,
        description: rule.description,
        impactDirection: rule.impactDirection,
        weight: rule.weight,
      })),
    };

    const prediction = await mockLlmAssessment(predictionInput);

    return reply.send({
      prediction,
      saved: false,
    });
  });
}