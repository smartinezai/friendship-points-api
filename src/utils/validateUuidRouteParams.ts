import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { sendBadRequestError } from "./httpErrors.js";

const uuidSchema = z.string().uuid();

/** Rejects non-UUID values for route parameters named `id` or ending in `Id`. */
export async function validateUuidRouteParams(
    request: FastifyRequest,
    reply: FastifyReply,
): Promise<FastifyReply | void> {
    const params = request.params as Record<string, unknown>;

    for (const [name, value] of Object.entries(params)) {
        if (!name.toLowerCase().endsWith("id")) {
            continue;
        }

        if (!uuidSchema.safeParse(value).success) {
            return sendBadRequestError(
                reply,
                `Route parameter "${name}" must be a valid UUID.`,
            );
        }
    }
}
