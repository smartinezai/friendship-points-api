import type { FastifyInstance } from 'fastify';
import { prisma } from "../db/prisma.js";
import { getFriendById } from "../services/friends.service.js";
import { getCurrentUserId } from "../services/currentUser.service.js";
import { mockLlmAssessment } from '../ai/mockAssessment.service.js';
import { openAiAssessEvent } from '../ai/openAiAssessment.service.js';
import { mistralAssessEvent } from "../ai/mistralAssessment.service.js";
import { LLM_MODELS, PROMPT_VERSION } from '../ai/providers.js';
import { assessEventWithProvider } from '../services/assessments.service.js';
import { manualAssessmentBodySchema } from '../schemas/assessments.schema.js';
import { sendNotFoundError, sendValidationError, sendInternalServerError } from '../utils/httpErrors.js';
import { logError } from '../utils/logging.js';

/** Registers manual, balance, and LLM-assisted assessment routes. */
export async function assessmentRoutes(app: FastifyInstance) {
    app.post<{
        Params: { eventId: string },
        Body: {
            scoreDelta: number;
            reason?: string;
        };
    }>("/events/:eventId/manual-assessment", async (request, reply) => {
        const { eventId } = request.params;
        const ownerUserId = getCurrentUserId(request);
        const parsedBody = manualAssessmentBodySchema.safeParse(request.body);

        if (!parsedBody.success) {
            return sendValidationError(reply, parsedBody.error.issues);
        }

        const { scoreDelta, reason } = parsedBody.data;

        const event = await prisma.event.findFirst({
            where: {
                id: eventId,
                friend: { ownerUserId },
            },
        });

        if (!event) {
            return sendNotFoundError(reply, "Event not found");
        }

        const assessment = await prisma.assessment.create({
            data: {
                eventId,
                scoreDelta,
                reason: reason ?? null,
                source: "manual",
            },
        });
        return reply.status(201).send({ assessment });
    });


    app.get<{
        Params: { friendId: string }
    }>("/friends/:friendId/balance", async (request, reply) => {
        const { friendId } = request.params;
        const ownerUserId = getCurrentUserId(request);
        const friend = await getFriendById(friendId, ownerUserId);

        if (!friend) {
            return sendNotFoundError(reply, "Friend not found");
        }

        const result = await prisma.assessment.aggregate({
            where: {
                event: {
                    friendId,
                },
            },
            _sum: {
                scoreDelta: true,
            },
        });
        return reply.status(200).send({
            friendId,
            balance: result._sum.scoreDelta ?? 0
        });
    });

    app.post<{
        Params: { eventId: string };
    }>("/events/:eventId/mock-assessment", async (request, reply) => {
        const { eventId } = request.params;
        const ownerUserId = getCurrentUserId(request);

        try {
            const result = await assessEventWithProvider(
                eventId,
                ownerUserId,
                "mock",
                mockLlmAssessment,
                {
                    modelName: "mock",
                    promptVersion: PROMPT_VERSION,
                },
            );

            if (!result) {
                return sendNotFoundError(reply, "Event not found");
            }

            return reply.status(201).send(result);
        } catch (error) {
            logError("Error during mock assessment", error);

            return sendInternalServerError(reply, "An error occurred during the mock assessment.");
        }
    });

    app.post<{
        Params: { eventId: string };
    }>("/events/:eventId/mistral-assessment", async (request, reply) => {
        const { eventId } = request.params;
        const ownerUserId = getCurrentUserId(request);

        try {
            const result = await assessEventWithProvider(
                eventId,
                ownerUserId,
                "mistral",
                mistralAssessEvent,
                {
                    modelName: LLM_MODELS.mistral,
                    promptVersion: PROMPT_VERSION
                },
            );

            if (!result) {
                return sendNotFoundError(reply, "Event not found");
            }

            return reply.status(201).send(result);
        } catch (error) {
            logError("Error during Mistral assessment", error);

            return sendInternalServerError(reply, "An error occurred during the Mistral assessment.");
        }
    });


    app.post<{
        Params: { eventId: string };
    }>("/events/:eventId/openai-assessment", async (request, reply) => {
        const { eventId } = request.params;
        const ownerUserId = getCurrentUserId(request);

        try {
            const result = await assessEventWithProvider(
                eventId,
                ownerUserId,
                "openai",
                openAiAssessEvent,
                {
                    modelName: LLM_MODELS.openAi,
                    promptVersion: PROMPT_VERSION,
                },
            );

            if (!result) {
                return sendNotFoundError(reply, "Event not found");
            }

            return reply.status(201).send(result);
        } catch (error) {
            logError("Error during OpenAI assessment", error);

            return sendInternalServerError(reply, "An error occurred during the OpenAI assessment.");
        }
    });
}
