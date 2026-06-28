import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createPersonFactBodySchema } from "../schemas/personFacts.schema.js";
import { getCurrentUserId } from "../services/currentUser.service.js";
import { getFriendById } from "../services/friends.service.js";
import {
    createPersonFact,
    getPersonIdForUser,
} from "../services/personFacts.service.js";
import {
    sendBadRequestError,
    sendNotFoundError,
    sendValidationError,
} from "../utils/httpErrors.js";

const createPersonFactParamsSchema = z.object({
    friendId: z.uuid(),
});

/** Registers routes for adding facts about tracked people. */
export async function personFactsRoutes(
    app: FastifyInstance,
): Promise<void> {
    app.post("/friends/:friendId/facts", async (request, reply) => {
        const paramsResult = createPersonFactParamsSchema.safeParse(
            request.params,
        );
        if (!paramsResult.success) {
            return sendValidationError(reply, paramsResult.error.issues);
        }

        const bodyResult = createPersonFactBodySchema.safeParse(request.body);
        if (!bodyResult.success) {
            return sendValidationError(reply, bodyResult.error.issues);
        }

        const ownerUserId = getCurrentUserId(request);
        const friend = await getFriendById(
            paramsResult.data.friendId,
            ownerUserId,
        );

        if (!friend) {
            return sendNotFoundError(reply, "Friend not found");
        }

        const authorPersonId = await getPersonIdForUser(ownerUserId);

        if (!authorPersonId) {
            return sendBadRequestError(
                reply,
                "Current user is not linked to a person.",
            );
        }

        const fact = await createPersonFact({
            targetPersonId: friend.targetPersonId,
            authorPersonId,
            content: bodyResult.data.content,
            sourceType: bodyResult.data.sourceType,
            ...(bodyResult.data.sourceId === undefined
                ? {}
                : { sourceId: bodyResult.data.sourceId }),
        });

        return reply.code(201).send({ fact });
    });
}
