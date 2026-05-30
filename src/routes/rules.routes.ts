import type { FastifyInstance } from "fastify";
import { prisma } from "../db/prisma.js";
import { getFriendById } from "../services/friends.service.js";
import { createRuleBodySchema, updateRuleWeightBodySchema } from "../schemas/rules.schema.js";
import { sendNotFoundError, sendValidationError } from "../utils/httpErrors.js";

export async function ruleRoutes(app: FastifyInstance) {

    app.get<{ Params: { friendId: string } }>("/friends/:friendId/rules", async (request, reply) => {
        const { friendId } = request.params; //destructure friendId from request params, and type it as a string

        const friend = await getFriendById(friendId); //first check if the friend exists

        if (!friend) {
            reply.status(404);
            return { error: "Friend not found" };
        }
        const rules = await prisma.rule.findMany({
            where: { friendId },
        });
        return { rules };
    });




    app.post<{
        Params: { friendId: string };
        Body: {
            title: string;
            description: string;
            impactDirection: string;
            weight: string;
        };
    }>("/friends/:friendId/rules", async (request, reply) => {
        const { friendId } = request.params; //destructure friendId from request params, and type it as a string
        const friend = await getFriendById(friendId); //first check if the friend exists

        if (!friend) {
            reply.status(404);
            return { error: "Friend not found" };
        }

        const parsedBody = createRuleBodySchema.safeParse(request.body);
        if (!parsedBody.success) {
            return sendValidationError(reply, parsedBody.error.issues);
        }
        const { title, description, impactDirection, weight } = parsedBody.data; //destructure body from request body, and type it as an object with the required fields
        
        if (
            !title ||
            title.trim() === "" ||
            !description ||
            description.trim() === "" ||
            !impactDirection ||
            impactDirection.trim() === "" ||
            !weight ||
            weight.trim() === ""
        ) {
            reply.status(400);
            return { error: "title, description, impactDirection, and weight are required" };
        }

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
        return { rule };
    });


    app.patch<{
        Params: { ruleId: string };
        Body: { weight: string };
    }>("/rules/:ruleId/weight", async (request, reply) => {
        const { ruleId } = request.params;
        const parsedBody = updateRuleWeightBodySchema.safeParse(request.body);
        if (!parsedBody.success) {
            return sendValidationError(reply, parsedBody.error.issues);
        }
        const { weight } = parsedBody.data;
        const rule = await prisma.rule.findUnique({
            where: { id: ruleId },
        });

        if (!rule) {
            return sendNotFoundError(reply, "Rule not found");
        }

        const updatedRule = await prisma.rule.update({
            where: { id: ruleId },
            data: { weight },
        });

        return { rule: updatedRule };

    });

}