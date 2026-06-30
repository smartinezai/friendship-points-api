import type { FastifyInstance } from "fastify";
import {
    createKnowledgeIntakeSubmissionBodySchema,
    createKnowledgeIntakeSubmissionParamsSchema,
} from "../schemas/knowledgeIntake.schema.js";
import { getCurrentUserId } from "../services/currentUser.service.js";
import { getFriendById } from "../services/friends.service.js";
import { createKnowledgeIntakeSubmission } from "../services/knowledgeIntake.service.js";
import { getPersonIdForUser } from "../services/personFacts.service.js";
import {
    sendBadRequestError,
    sendNotFoundError,
    sendValidationError,
} from "../utils/httpErrors.js";

/** Registers API-only knowledge intake submission routes. */
export async function knowledgeIntakeRoutes(
    app: FastifyInstance,
): Promise<void> {
    app.post("/friends/:friendId/intake-submissions", async (request, reply) => {
        const paramsResult =
            createKnowledgeIntakeSubmissionParamsSchema.safeParse(
                request.params,
            );
        if (!paramsResult.success) {
            return sendValidationError(reply, paramsResult.error.issues);
        }

        const bodyResult =
            createKnowledgeIntakeSubmissionBodySchema.safeParse(request.body);
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

        const currentUserPersonId = await getPersonIdForUser(ownerUserId);

        if (
            bodyResult.data.submittedByType === "owner_user" &&
            !currentUserPersonId
        ) {
            return sendBadRequestError(
                reply,
                "Current user is not linked to a person.",
            );
        }

        const submission = await createKnowledgeIntakeSubmission({
            friendId: paramsResult.data.friendId,
            targetPersonId: friend.targetPersonId,
            submittedByType: bodyResult.data.submittedByType,
            sourceType: bodyResult.data.sourceType,
            answers: bodyResult.data.answers,
            ...(bodyResult.data.submittedByType === "owner_user" &&
            currentUserPersonId
                ? { submittedByPersonId: currentUserPersonId }
                : {}),
            ...(bodyResult.data.submittedByType === "target_person"
                ? { submittedByPersonId: friend.targetPersonId }
                : {}),
        });

        return reply.code(201).send({ submission });
    });
}
