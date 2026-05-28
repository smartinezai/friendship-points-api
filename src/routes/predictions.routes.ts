import type { FastifyInstance } from "fastify";
import { prisma } from "../db/prisma.js";
import { predictFriendActionBodySchema } from "../schemas/predictions.schema.js";
import { mockLlmAssessment } from "../ai/mockAssessment.service.js";
import type { LlmAssessmentInput } from "../ai/assessment.types.js";
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

        const predictionInput: LlmAssessmentInput = { //build the input for the LLM assessment based on the friend data and the hypothetical action. The input should include the friend's id, display name, and notes, as well as the hypothetical action and the friend's active rules. For the rules, we want to include the rule's id, title, description, impact direction, and weight. We will return an object that matches the LlmAssessmentInput type.
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
            rules: friend.rules.map((rule) => ({ //for each active rule, we want to include the rule's id, title, description, impact direction, and weight in the input for the LLM assessment
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