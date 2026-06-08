import type { FastifyInstance } from "fastify";
import { embedSearchableDocumentsWithoutEmbeddings } from "../services/embeddings.service.js";
import { sendInternalServerError } from "../utils/httpErrors.js";
import { logError } from "../utils/logging.js";

/** Registers routes for generating searchable document embeddings. */
export async function embeddingRoutes(app: FastifyInstance) {
  app.post("/search-documents/embed-missing", async (_request, reply) => { //_request because we don't need any data from the request to perform this action
    try {
      const result = await embedSearchableDocumentsWithoutEmbeddings();

      return reply.send(result);
    } catch (error) {
      logError("Error embedding searchable documents", error);

      return sendInternalServerError(
        reply,
        "An error occurred while embedding searchable documents.",
      );
    }
  });
}