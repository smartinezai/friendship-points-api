import type { FastifyInstance } from "fastify";
import {prisma} from "../db/prisma.js";


export async function ruleRoutes(app: FastifyInstance) {
    
    app.get<{ Params: { friendId: string } }>("/friends/:friendId/rules", async (request, reply) => {
        const { friendId } = request.params; //destructure id from request params, and type it as a string

        const friend = await prisma.friend.findUnique({ //first check if the friend exists
            where: { id : friendId},
        });

        if (!friend) {
            reply.status(404);
            return { error: "Friend not found" };
        }
        const rules = await prisma.rule.findMany({
            where: { friendId },
        });
        return { rules };
    });

}