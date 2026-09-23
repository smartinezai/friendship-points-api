import type { FastifyInstance } from "fastify";
import { prisma } from "../db/prisma.js";
import { getFriendById } from "../services/friends.service.js";
import { getCurrentUserId } from "../services/currentUser.service.js";
import {
    createRuleBodySchema,
    updateRuleWeightBodySchema,
    type CreateRuleBody,
    type UpdateRuleWeightBody,
} from "../schemas/rules.schema.js";
import { sendNotFoundError, sendValidationError } from "../utils/httpErrors.js";
import {
    toRuleDto,
    type RuleResponseDto,
    type RulesResponseDto,
} from "../dto/friendship.dto.js";

/** Registers friendship-rule routes for creation, listing, and weight updates. */
export async function ruleRoutes(app: FastifyInstance) {

    app.get<{ Params: { friendId: string } }>("/friends/:friendId/rules", async (request, reply) => {
        const { friendId } = request.params;
        const ownerUserId = getCurrentUserId(request);

        const friend = await getFriendById(friendId, ownerUserId);

        if (!friend) {
            return sendNotFoundError(reply, "Friend not found");
        }
        const rules = await prisma.rule.findMany({
            where: { friendId },
        });
        return { rules: rules.map(toRuleDto) } satisfies RulesResponseDto;
    });




    app.post<{
        Params: { friendId: string };
        Body: CreateRuleBody;
    }>("/friends/:friendId/rules", async (request, reply) => {
        const { friendId } = request.params;
        const ownerUserId = getCurrentUserId(request);
        const friend = await getFriendById(friendId, ownerUserId);

        if (!friend) {
            return sendNotFoundError(reply, "Friend not found");
        }

        const parsedBody = createRuleBodySchema.safeParse(request.body);
        if (!parsedBody.success) {
            return sendValidationError(reply, parsedBody.error.issues);
        }
        const { title, description, impactDirection, weight } = parsedBody.data;

        const rule = await prisma.rule.create({
            data: {
                friendId,
                title,
                description,
                impactDirection,
                weight,
            },
        });

        reply.status(201);
        return { rule: toRuleDto(rule) } satisfies RuleResponseDto;
    });


    app.patch<{
        Params: { ruleId: string };
        Body: UpdateRuleWeightBody;
    }>("/rules/:ruleId/weight", async (request, reply) => {
        const { ruleId } = request.params;
        const ownerUserId = getCurrentUserId(request);
        const parsedBody = updateRuleWeightBodySchema.safeParse(request.body);
        if (!parsedBody.success) {
            return sendValidationError(reply, parsedBody.error.issues);
        }
        const { weight } = parsedBody.data;
        const rule = await prisma.rule.findUnique({
            where: { id: ruleId },
            include: { friend: true },
        });

        if (!rule || rule.friend.ownerUserId !== ownerUserId) {
            return sendNotFoundError(reply, "Rule not found");
        }

        const updatedRule = await prisma.rule.update({
            where: { id: ruleId },
            data: { weight },
        });

        return { rule: toRuleDto(updatedRule) } satisfies RuleResponseDto;

    });

}
