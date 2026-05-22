import type { FastifyInstance } from "fastify";
import {prisma} from "../db/prisma.js";
import { getFriendById } from "../services/friends.service.js";

export async function friendRoutes(app: FastifyInstance) {
    
    app.get<{ Params: { id: string } }>("/friends/:id", async (request, reply) => {
        const { id } = request.params; //destructure id from request params, and type it as a string

        const friend = await getFriendById(id);

        if (!friend) {
            reply.status(404);
            return { error: "Friend not found" };
        }

        return { friend };
    });

    app.get<{Querystring: {name?: string}}>("/friends/search", async (request,reply) =>{
        const {name} = request.query;

        if (!name){
            reply.status(400);
            return {error: "Name query parameter is required."};
        }
        const friends = await prisma.friend.findMany({
            where: {
                displayName: {
                    contains: name,
                    mode: "insensitive",
                },
            },
        });
        return {friends};

    });


    app.get("/friends", async () => {
    // get all friends
    const friends = await prisma.friend.findMany();

    return {friends};
  });

    app.post<{ Body: { displayName: string; notes?: string} }>("/friends", async(request, reply) => {
        const {displayName, notes}  = request.body;

        if (!displayName || displayName.trim() === "") {
            reply.status(400);
            return { error: "displayName is required" };
        }

        const friend = await prisma.friend.create({
            data: {
                displayName,
                notes: notes ?? null,  //use null if notes is undefined, since our schema expects a string or null
            },
        });

        reply.status(201);
        return { friend };
    });
}