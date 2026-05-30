import type { FastifyReply } from "fastify";

export function sendValidationError(
    reply: FastifyReply,
    details: unknown[]
) {
    return reply.status(400).send({
        error: "Invalid request body",
        details,
    });
}

export function sendNotFoundError(reply: FastifyReply, message: string) {
    return reply.status(404).send({
        error: message,
    });
}

export function sendInternalServerError(
    reply: FastifyReply,
    message: string = "An internal server error occurred."
) {
    return reply.status(500).send({
        error: message,
    }); 
}

export function sendBadRequestError(reply: FastifyReply, message: string) {
    return reply.status(400).send({
        error: message,
    });
}