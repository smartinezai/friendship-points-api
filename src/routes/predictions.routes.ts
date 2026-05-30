import type { FastifyInstance } from "fastify";
import { predictFriendActionBodySchema } from "../schemas/predictions.schema.js";
import { mockLlmAssessment } from "../ai/mockAssessment.service.js";
import { buildPredictionInput, getFriendWithActiveRules } from "../services/predictions.service.js";
import { mistralAssessEvent } from "../ai/mistralAssessment.service.js";
import { sendNotFoundError, sendValidationError } from "../utils/httpErrors.js";
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
            return sendValidationError(reply, parsedBody.error.issues);
        }

        const friend = await getFriendWithActiveRules(friendId);

        if (!friend) {
            return sendNotFoundError(reply, "Friend not found");
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

    app.post<{
        Params: { friendId: string };
    }>("/friends/:friendId/predict/mistral", async (request, reply) => {
        const { friendId } = request.params;

        const parsedBody = predictFriendActionBodySchema.safeParse(request.body); //validate the request body using the predictFriendActionBodySchema, which requires a hypotheticalAction string that is at least 10 characters long and at most 2000 characters long

        if (!parsedBody.success) {
            return sendValidationError(reply, parsedBody.error.issues);
        }

        const friend = await getFriendWithActiveRules(friendId);

        if (!friend) {
            return sendNotFoundError(reply, "Friend not found");
        }

        const predictionInput = buildPredictionInput(
            friend, 
            parsedBody.data.hypotheticalAction
        );

        const prediction = await mistralAssessEvent(predictionInput);

        return reply.send({
            prediction,
            saved: false,
            source: "mistral",
        });
    });
}