import type { FastifyInstance } from "fastify";
import { prisma } from "../db/prisma.js";
import { getFriendById } from "../services/friends.service.js";
import { getCurrentUserId } from "../services/currentUser.service.js";
import {
    createFriendBodySchema,
    updateFriendBodySchema,
    appendFriendNoteBodySchema,
} from "../schemas/friends.schema.js";
import {
    sendNotFoundError,
    sendValidationError,
    sendBadRequestError,
} from "../utils/httpErrors.js";
import {
    retrieveFriendContext,
    retrieveFriendContextSemantically,
    rerankContextItems,
} from "../services/search.service.js";
import { rebuildSearchableDocumentsForFriend } from "../services/searchIngestion.service.js";

/** Registers friend CRUD, notes, search, and search-index maintenance routes. */
export async function friendRoutes(app: FastifyInstance) {

    app.get<{ Querystring: { name?: string } }>("/friends/search", async (request, reply) => {
        const { name } = request.query;
        const ownerUserId = getCurrentUserId(request);

        if (!name) {
            return sendBadRequestError(reply, "Name query parameter is required.");
        }
        const friends = await prisma.friend.findMany({
            where: {
                ownerUserId,
                deletedAt: null,
                displayName: {
                    contains: name,
                    mode: "insensitive",
                },
            },
        });
        return { friends };

    });

    /** Manual endpoint for inspecting retrieved RAG context during development. */
    app.get<{
        Params: { id: string };
        Querystring: { query?: string };
    }>("/friends/:id/search-context", async (request, reply) => {
        const { id } = request.params;
        const { query } = request.query;

        if (!query) {
            return sendBadRequestError(reply, "Query parameter is required.");
        }

        const ownerUserId = getCurrentUserId(request);
        const friend = await getFriendById(id, ownerUserId);

        if (!friend) {
            return sendNotFoundError(reply, "Friend not found");
        }

        const results = await retrieveFriendContext(id, query);

        return { results };
    });

    /** Manual endpoint for inspecting semantic vector retrieval during development. */
    app.get<{
        Params: { id: string };
        Querystring: { query?: string };
    }>("/friends/:id/search-context/semantic", async (request, reply) => {
        const { id } = request.params;
        const { query } = request.query;

        if (!query) {
            return sendBadRequestError(reply, "Query parameter is required.");
        }

        const ownerUserId = getCurrentUserId(request);
        const friend = await getFriendById(id, ownerUserId);

        if (!friend) {
            return sendNotFoundError(reply, "Friend not found");
        }

        const results = await retrieveFriendContextSemantically(id, query, {
            limit: 5,
        });

        return { results };
    });

    /** Manual endpoint for inspecting semantic retrieval followed by reranking. */
    app.get<{
        Params: { id: string };
        Querystring: { query?: string };
    }>("/friends/:id/search-context/reranked", async (request, reply) => {
        const { id } = request.params;
        const { query } = request.query;

        if (!query) {
            return sendBadRequestError(reply, "Query parameter is required.");
        }

        const ownerUserId = getCurrentUserId(request);
        const friend = await getFriendById(id, ownerUserId);

        if (!friend) {
            return sendNotFoundError(reply, "Friend not found");
        }

        const semanticResults = await retrieveFriendContextSemantically(id, query, {
            limit: 10,
        });

        const rerankedResults = rerankContextItems(query, semanticResults).slice(0, 5);

        return {
            semanticResults,
            rerankedResults,
        };
    });

    app.post<{
        Params: { id: string };
    }>("/friends/:id/rebuild-search-index", async (request, reply) => {
        const { id } = request.params;
        const ownerUserId = getCurrentUserId(request);
        const result = await rebuildSearchableDocumentsForFriend(id, ownerUserId);

        if (!result) {
            return sendNotFoundError(reply, "Friend not found");
        }

        return reply.send({
            message: "Search index rebuilt successfully",
            createdDocCount: result.createdDocCount,
        });
    });

    app.get<{ Params: { id: string } }>("/friends/:id", async (request, reply) => {
        const { id } = request.params;
        const ownerUserId = getCurrentUserId(request);

        const friend = await getFriendById(id, ownerUserId);

        if (!friend) {
            return sendNotFoundError(reply, "Friend not found");
        }

        return { friend };
    });


    app.get("/friends", async (request) => {
        const ownerUserId = getCurrentUserId(request);
        const friends = await prisma.friend.findMany({
            where: {
                ownerUserId,
                deletedAt: null,
            },
        });

        return { friends };
    });

    app.post<{
        Body: {
            displayName: string;
            notes?: string;
            allowDuplicate?: boolean;
        }
    }>("/friends", async (request, reply) => {
        const ownerUserId = getCurrentUserId(request);
        const parsedBody = createFriendBodySchema.safeParse(request.body);

        if (!parsedBody.success) {
            return sendValidationError(reply, parsedBody.error.issues);
        }

        const { displayName, notes, allowDuplicate } = parsedBody.data;

        const existingFriend = await prisma.friend.findFirst({
            where: { ownerUserId, displayName, deletedAt: null }
        });

        if (existingFriend && !allowDuplicate) {
            reply.status(409);
            return {
                error: "Friend with this display name already exists",
                existingFriend,
            };

        }

        const targetPerson = await prisma.person.create({
            data: { displayName },
        });

        const friend = await prisma.friend.create({
            data: {
                ownerUserId,
                targetPersonId: targetPerson.id,
                displayName,
                notes: notes ?? null,
            },
        });

        reply.status(201);
        return { friend };
    });

    app.patch<{
        Params: { id: string };
    }>("/friends/:id", async (request, reply) => {
        const { id } = request.params;
        const ownerUserId = getCurrentUserId(request);

        const parsedBody = updateFriendBodySchema.safeParse(request.body);

        if (!parsedBody.success) {
            return sendValidationError(reply, parsedBody.error.issues);
        }

        const existingFriend = await getFriendById(id, ownerUserId);

        if (!existingFriend) {
            return sendNotFoundError(reply, "Friend not found");
        }

        const updateData: {
            displayName?: string;
            notes?: string | null;
        } = {};

        if (parsedBody.data.displayName !== undefined) {
            updateData.displayName = parsedBody.data.displayName;
        }

        if (parsedBody.data.notes !== undefined) {
            updateData.notes = parsedBody.data.notes;
        }

        const updatedFriend = await prisma.friend.update({
            where: { id },
            data: updateData,
        });

        return reply.send({ friend: updatedFriend });
    });

    app.post<{
        Params: { id: string };
    }>("/friends/:id/notes/append", async (request, reply) => {
        const { id } = request.params;
        const ownerUserId = getCurrentUserId(request);

        const parsedBody = appendFriendNoteBodySchema.safeParse(request.body);

        if (!parsedBody.success) {
            return sendValidationError(reply, parsedBody.error.issues);
        }

        const existingFriend = await getFriendById(id, ownerUserId);

        if (!existingFriend) {
            return sendNotFoundError(reply, "Friend not found");
        }

        const { note } = parsedBody.data;

        // Preserve readable note history by separating appended notes.
        const updatedNotes = existingFriend.notes
            ? `${existingFriend.notes}\n\n${note}`
            : note;

        const updatedFriend = await prisma.friend.update({
            where: { id },
            data: { notes: updatedNotes },
        });

        return reply.send({ friend: updatedFriend });
    });

    app.delete<{
        Params: { id: string };
    }>("/friends/:id", async (request, reply) => {
        const { id } = request.params;
        const ownerUserId = getCurrentUserId(request);

        const existingFriend = await getFriendById(id, ownerUserId);

        if (!existingFriend) {
            return sendNotFoundError(reply, "Friend not found");
        }

        await prisma.friend.update({
            where: { id },
            data: { deletedAt: new Date() },
        });

        return reply.status(200).send({
            message: "Friend deleted successfully",
        });
    });


}
