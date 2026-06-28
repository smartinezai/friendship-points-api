import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
    createPersonFactBodySchema,
    personFactVerificationStatusSchema,
} from "../schemas/personFacts.schema.js";
import { getCurrentUserId } from "../services/currentUser.service.js";
import { getFriendById } from "../services/friends.service.js";
import {
    createPersonFact,
    getAccessiblePersonFact,
    getPersonIdForUser,
    listPersonFactsForTarget,
    updatePersonFactVerificationStatus,
} from "../services/personFacts.service.js";
import {
    sendBadRequestError,
    sendNotFoundError,
    sendValidationError,
} from "../utils/httpErrors.js";

const createPersonFactParamsSchema = z.object({
    friendId: z.uuid(),
});

const updatePersonFactVerificationStatusParamsSchema = z.object({
    factId: z.uuid(),
});

const updatePersonFactVerificationStatusBodySchema = z.object({
    verificationStatus: personFactVerificationStatusSchema,
});

/** Registers routes for adding facts about tracked people. */
export async function personFactsRoutes(
    app: FastifyInstance,
): Promise<void> {
    app.get("/friends/:friendId/facts", async (request, reply) => {
        const paramsResult = createPersonFactParamsSchema.safeParse(
            request.params,
        );
        if (!paramsResult.success) {
            return sendValidationError(reply, paramsResult.error.issues);
        }

        const ownerUserId = getCurrentUserId(request);
        const friend = await getFriendById(
            paramsResult.data.friendId,
            ownerUserId,
        );

        if (!friend) {
            return sendNotFoundError(reply, "Friend not found");
        }

        const facts = await listPersonFactsForTarget(friend.targetPersonId);

        return reply.send({ facts });
    });

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
            friendId: paramsResult.data.friendId,
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

    app.patch("/person-facts/:factId/verification-status", async (request, reply) => {
        const paramsResult =
            updatePersonFactVerificationStatusParamsSchema.safeParse(
                request.params,
            );
        if (!paramsResult.success) {
            return sendValidationError(reply, paramsResult.error.issues);
        }

        const bodyResult =
            updatePersonFactVerificationStatusBodySchema.safeParse(
                request.body,
            );
        if (!bodyResult.success) {
            return sendValidationError(reply, bodyResult.error.issues);
        }

        const ownerUserId = getCurrentUserId(request);
        const existingFact = await getAccessiblePersonFact(
            paramsResult.data.factId,
            ownerUserId,
        );

        if (!existingFact) {
            return sendNotFoundError(reply, "Person fact not found");
        }

        const fact = await updatePersonFactVerificationStatus({
            factId: existingFact.id,
            verificationStatus: bodyResult.data.verificationStatus,
        });

        return reply.send({ fact });
    });
}
