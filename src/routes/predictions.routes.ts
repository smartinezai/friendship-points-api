import type { FastifyInstance } from "fastify";
import { predictFriendActionBodySchema } from "../schemas/predictions.schema.js";
import { mockLlmAssessment } from "../ai/mockAssessment.service.js";
import { predictFriendActionWithProvider } from "../services/predictions.service.js";
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

        const predictionResult = await predictFriendActionWithProvider(
            friendId,
            parsedBody.data.hypotheticalAction,
            mockLlmAssessment,
        );

        if (!predictionResult) {
            return sendNotFoundError(reply, "Friend not found");
        }

        return reply.send(predictionResult);
    });

    app.post<{
        Params: { friendId: string };
    }>("/friends/:friendId/predict/mistral", async (request, reply) => {
        const { friendId } = request.params;

        const parsedBody = predictFriendActionBodySchema.safeParse(request.body); //validate the request body using the predictFriendActionBodySchema, which requires a hypotheticalAction string that is at least 10 characters long and at most 2000 characters long

        if (!parsedBody.success) {
            return sendValidationError(reply, parsedBody.error.issues);
        }

        const predictionResult = await predictFriendActionWithProvider(
            friendId,
            parsedBody.data.hypotheticalAction,
            mistralAssessEvent,
        );

        if (!predictionResult) {
            return sendNotFoundError(reply, "Friend not found");
        }

        return reply.send({
            ...predictionResult,
            source: "mistral",
        });
    });
}
