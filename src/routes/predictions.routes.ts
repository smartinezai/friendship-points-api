import type { FastifyInstance } from "fastify";
import { prisma } from "../db/prisma.js";
import { predictFriendActionBodySchema } from "../schemas/predictions.schema.js";
import { mockLlmAssessment } from "../ai/mockAssessment.service.js";
import { buildPredictionInput } from "../services/predictions.service.js";
/**
 * 
 * import type -> for typescript types only
 * import -> for real runtime values/functions/classes/constants
 */


export async function predictionRoutes(app: FastifyInstance) {
    app.post<{
        Params: { friendId: string };
    }>("/friends/:friendId/predict", async (request, reply) => {
        const { friendId } = request.params;

        const parsedBody = predictFriendActionBodySchema.safeParse(request.body); //validate the request body using the predictFriendActionBodySchema, which requires a hypotheticalAction string that is at least 10 characters long and at most 2000 characters long

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

        const predictionInput = buildPredictionInput(
            friend, 
            parsedBody.data.hypotheticalAction
        );


        const prediction = await mockLlmAssessment(predictionInput);

        return reply.send({
            prediction,
            saved: false,
        });
    });
}