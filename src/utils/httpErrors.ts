import type { FastifyReply } from "fastify";

/**
 * Sends the standard 400 response for request body validation failures.
 *
 * @param reply - Fastify reply object for the current request.
 * @param details - Validation issue details, usually from Zod.
 */
export function sendValidationError(
    reply: FastifyReply,
    details: unknown[]
) {
    return reply.status(400).send({
        error: "Invalid request body",
        details,
    });
}

/** Sends the standard 404 response for missing resources. */
export function sendNotFoundError(reply: FastifyReply, message: string) {
    return reply.status(404).send({
        error: message,
    });
}

/** Sends a safe 500 response without leaking internal exception details. */
export function sendInternalServerError(
    reply: FastifyReply,
    message: string = "An internal server error occurred."
) {
    return reply.status(500).send({
        error: message,
    }); 
}

/** Sends the standard 400 response for malformed params or query strings. */
export function sendBadRequestError(reply: FastifyReply, message: string) {
    return reply.status(400).send({
        error: message,
    });
}
