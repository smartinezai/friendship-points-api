import type { FastifyInstance } from "fastify";
import {
    ingestDocumentBodySchema,
    ingestFriendDocumentParamsSchema,
} from "../schemas/document.schema.js";
import { getFriendById } from "../services/friends.service.js";
import { ingestFriendDocument } from "../services/documentIngestion/ingestFriendDocument.service.js";
import {
    sendNotFoundError,
    sendValidationError,
} from "../utils/httpErrors.js";

/**
 * Registers document-ingestion routes.
 * These routes allow raw TXT/Markdown document content to be prepared, chunked,
 * and inserted into the friend-scoped SearchableDocument index.
 * The first version accepts raw text in JSON rather than file uploads.
 */
export async function documentsRoutes(app: FastifyInstance): Promise<void> {
    app.post("/friends/:friendId/documents/ingest", async (request, reply) => {
        const paramsResult = ingestFriendDocumentParamsSchema.safeParse(
            request.params,
        );
        if (!paramsResult.success) {
            return sendValidationError(reply, paramsResult.error.issues);
        }

        const bodyResult = ingestDocumentBodySchema.safeParse(request.body);
        if (!bodyResult.success) {
            return sendValidationError(reply, bodyResult.error.issues);
        }

        const friend = await getFriendById(paramsResult.data.friendId);

        if (!friend) {
            return sendNotFoundError(reply, "Friend not found");
        }

        const result = await ingestFriendDocument({
            friendId: paramsResult.data.friendId,
            title: bodyResult.data.title,
            documentType: bodyResult.data.documentType,
            content: bodyResult.data.content,
            ...(bodyResult.data.sourceDate === undefined
                ? {}
                : { sourceDate: bodyResult.data.sourceDate }),
            maxChunkCharacters: 1500,
        });

        return reply.code(201).send(result);
    });
}
